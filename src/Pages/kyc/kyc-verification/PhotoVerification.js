import React, { useRef, useState, useEffect } from "react";

import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

import { useNavigate } from "react-router-dom";

import KycStepper from "../../../Components/kyc/KycStepper";
import api from "../../../services/api";

const PhotoVerification = () => {
  const webcamRef = useRef(null);

  const navigate = useNavigate();

  const [cameraOpen, setCameraOpen] = useState(false);

  const [capturedImage, setCapturedImage] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // Live location captured for the in-person verification record. Stored on
  // kyc_master_details.ipv_latitude / ipv_longitude / ipv_location_accuracy
  // by /photo/upload - the same coordinates the eSign step needs later.
  const [geo, setGeo] = useState(null);
  const [geoError, setGeoError] = useState("");

  const captureLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGeoError("Location is not supported by this browser.");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const coords = { latitude, longitude, accuracy };
          setGeo(coords);
          setGeoError("");
          resolve(coords);
        },
        (err) => {
          setGeoError(
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied. Please allow location access - it is required for KYC verification."
              : "Unable to fetch your current location. Please check that location services are on.",
          );
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });

  const [tokenFromUrl, setTokenFromUrl] = useState("");
  const [validatingToken, setValidatingToken] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  const openCamera = async () => {
    setCameraOpen(true);
    setCapturedImage(null);
    setError("");
  };
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");

    if (urlToken) {
      setTokenFromUrl(urlToken);
      validateUrlToken(urlToken);
    } else {
      generateTokenAndUpdateUrl();
    }

    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models");
    };

    loadModels();

    // Ask for location early so the permission prompt is out of the way before
    // the applicant captures their photo.
    captureLocation();
  }, []);

  const generateTokenAndUpdateUrl = async () => {
    try {
      const appId = localStorage.getItem("application_id");
      if (!appId) return;

      const res = await api.post("/photo/generate-token", { application_id: appId });
      if (res.data.success) {
        const newToken = res.data.token;
        setTokenFromUrl(newToken);
        window.history.replaceState(null, "", window.location.pathname + "?token=" + newToken);
      }
    } catch (err) {
      console.log("Token generation error:", err);
    }
  };

  const validateUrlToken = async (t) => {
    setValidatingToken(true);
    try {
      const res = await api.get(`/photo/validate-token/${t}`);
      if (res.data.success) {
        setTokenError(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired link.");
      setTokenError(true);
    } finally {
      setValidatingToken(false);
    }
  };


  // Crop a square from the centre of the frame (no circular mask - the
  // stored photo, and the copy pasted into the KYC PDF, are both square).
  const cropToSquare = (img) => {
    const size = Math.min(img.width, img.height);
    const sx = (img.width - size) / 2;
    const sy = (img.height - size) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

    return canvas.toDataURL("image/png");
  };

  // CAPTURE PHOTO
  const capturePhoto = async () => {
  const imageSrc = webcamRef.current?.getScreenshot();

  if (!imageSrc) {
    setError("Unable to capture photo");
    return;
  }

  const img = new Image();

  img.src = imageSrc;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const detections = await faceapi.detectAllFaces(
    img,
    new faceapi.TinyFaceDetectorOptions()
  ).withFaceLandmarks(true);

  if (detections.length === 0) {
    setError("No human face detected.");
    return;
  }

  if (detections.length > 1) {
    setError("Multiple faces detected. Please ensure only one person is visible.");
    return;
  }

  // The capture guide is a circle centred in the frame. The face must sit
  // inside that circle - centred and not too small / too large.
  const box = detections[0].detection.box;
  const circleCx = img.width / 2;
  const circleCy = img.height / 2;
  const circleR = Math.min(img.width, img.height) / 2;

  const faceCx = box.x + box.width / 2;
  const faceCy = box.y + box.height / 2;
  const offCentre = Math.hypot(faceCx - circleCx, faceCy - circleCy);
  const faceSize = Math.max(box.width, box.height);

  if (offCentre > circleR * 0.45) {
    setError("Please move your face to the centre of the circle.");
    return;
  }

  if (faceSize < circleR * 0.8) {
    setError("Move closer so your face fills the circle.");
    return;
  }

  if (faceSize > circleR * 2.2) {
    setError("Move back a little so your whole face is inside the circle.");
    return;
  }

  const landmarks = detections[0].landmarks;
  const leftEyeY = landmarks.getLeftEye()[0].y;
  const rightEyeY = landmarks.getRightEye()[0].y;
  const mouthY = landmarks.getMouth()[0].y;
  const avgEyeY = (leftEyeY + rightEyeY) / 2;

  if (avgEyeY > mouthY) {
    setError("Face appears upside down. If the preview is inverted, use the Rotate button.");
  } else {
    setError("");
  }

  setCapturedImage(cropToSquare(img));
  setCameraOpen(false);
};

  const cancelPhoto = () => {
    setCameraOpen(false);
    setCapturedImage(null);
    setError("");
  };

  const handleRotate = (direction) => {
    if (!capturedImage) return;
    const img = new Image();
    img.src = capturedImage;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.height; // Swap for 90 degree rotation
      canvas.height = img.width;
      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(direction === 'left' ? -Math.PI / 2 : Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      setCapturedImage(canvas.toDataURL("image/png"));
      setError("");
    };
  };

  const handleContinue = async () => {
    try {
      if (!capturedImage) {
        setError("Please capture a photo first");
        return;
      }

      if (!tokenFromUrl) {
        const applicationId = Number(localStorage.getItem("application_id"));

        if (!applicationId) {
          setError("Application ID is missing. Please restart the KYC flow.");
          return;
        }
      }

      setLoading(true);
      setError("");

      // Use the freshest fix we can get; fall back to whatever was captured on
      // mount if the applicant just denied/failed this prompt.
      const coords = (await captureLocation()) || geo;

      const payload = {
        image: capturedImage,
      };

      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
        payload.accuracy = coords.accuracy;
      }

      if (tokenFromUrl) {
        payload.token = tokenFromUrl;
      } else {
        payload.application_id = Number(localStorage.getItem("application_id"));
      }

      await api.post("/photo/upload", payload);

      if (tokenFromUrl && !localStorage.getItem("application_id")) {
        setSharedSuccess(true);
      } else {
        navigate("/esign");
      }
    } catch (error) {
      console.log("PHOTO UPLOAD ERROR:", error.response?.data || error.message);

      setError(error.response?.data?.message || "Photo upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container '>
      <KycStepper
        currentStep='complete'
        completedSteps={["contact", "identify", "personal", "scheme"]}
      />

      {validatingToken && <div className='alert alert-info mt-3'>Validating secure link...</div>}
      
      {sharedSuccess ? (
        <div className='row mt-5 text-center'>
          <div className='col-12'>
            <h3 className='text-success'>Live Photo Uploaded Successfully!</h3>
            <p>You can now close this tab and return to the main device if applicable.</p>
          </div>
        </div>
      ) : (
      <div className='row'>
        {/* LEFT COLUMN */}
        <div className='col-lg-6 d-flex justify-content-center'>
          <div className='face-card'>
            <h5>For KYC verification Please take Live Photo </h5>
            <div className='scan-box'>
              <div className='corner top-left'></div>
              <div className='corner top-right'></div>
              <div className='corner bottom-left'></div>
              <div className='corner bottom-right'></div>

              <div className='user-icon'>
                <div className='head'></div>
                <div className='body'></div>
              </div>
            </div>

            <div className='Instruction-card'>
              <ul>
                <li>
                  Face Forward and make sure your face is clearly visible.
                </li>
                <li>Remove your glasses, if necessary.</li>
                <li>Allow location access when prompted.</li>
              </ul>
            </div>

            {geoError && (
              <p className='text-warning mt-2 mb-0' style={{ fontSize: "0.85rem" }}>
                {geoError}{" "}
                <button
                  type='button'
                  className='btn btn-link p-0 align-baseline'
                  style={{ fontSize: "0.85rem" }}
                  onClick={captureLocation}
                >
                  Retry location
                </button>
              </p>
            )}

            {/* OPEN CAMERA BUTTON */}
            {!cameraOpen && !capturedImage && !validatingToken && !tokenError && (
              <div className='d-flex justify-content-center mt-3'>
                <button
                  type='button'
                  className='btn btn-primary'
                  onClick={openCamera}
                >
                  Open Camera
                </button>
              </div>
            )}
          </div>
        </div>

        <div className='col-lg-6 d-flex justify-content-center'>
          {(cameraOpen || capturedImage || error) && (
            <div className='face-result-card'>
              {/* CAMERA VIEW */}
              {cameraOpen && !capturedImage && (
                <>
                  <div className='mt-4 d-flex justify-content-center'>
                    <div
                      style={{
                        position: "relative",
                        width: 300,
                        height: 300,
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#000",
                      }}
                    >
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat='image/jpeg'
                        width={400}
                        height={300}
                        mirrored={true}
                        videoConstraints={{
                          width: 400,
                          height: 300,
                          facingMode: "user",
                        }}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          height: 300,
                          width: "auto",
                        }}
                        onUserMediaError={(error) => {
                          console.log("Camera error:", error);
                          setError("Unable to access camera.");
                        }}
                      />

                      {/* Circular alignment guide */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          border: "3px dashed rgba(255,255,255,0.9)",
                          boxShadow: "0 0 0 9999px rgba(0,0,0,0.25)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  </div>

                  <p
                    className='text-muted text-center mt-2 mb-0'
                    style={{ fontSize: "0.85rem" }}
                  >
                    Position your face inside the circle.
                  </p>

                  {/* CAPTURE / CANCEL ONLY WHEN CAMERA OPEN */}
                  <div className='d-flex justify-content-center gap-3 mt-3'>
                    <button
                      type='button'
                      className='btn btn-success'
                      onClick={capturePhoto}
                    >
                      Capture
                    </button>

                    <button
                      type='button'
                      className='btn btn-secondary'
                      onClick={cancelPhoto}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* PREVIEW AFTER CAPTURE */}
              {capturedImage && !cameraOpen && (
                <div className='mt-4 text-center'>
                  <img
                    src={capturedImage}
                    alt='Captured'
                    width='300'
                    height='300'
                    style={{ objectFit: "cover" }}
                  />

                  <div className='mt-3 d-flex justify-content-center gap-3'>
                    <button
                      type='button'
                      className='btn btn-secondary'
                      onClick={cancelPhoto}
                    >
                      Retake
                    </button>

                    <button
                      type='button'
                      className='btn btn-warning'
                      onClick={() => handleRotate('left')}
                      title="Rotate Left"
                    >
                      ⟲
                    </button>

                    <button
                      type='button'
                      className='btn btn-warning'
                      onClick={() => handleRotate('right')}
                      title="Rotate Right"
                    >
                      ⟳
                    </button>

                    <button
                      type='button'
                      className='btn btn-success'
                      onClick={handleContinue}
                      disabled={loading}
                    >
                      {loading ? "Uploading..." : "Continue"}
                    </button>
                  </div>
                </div>
              )}

              {/* ERROR */}
              {error && <p className='text-danger mt-3'>{error}</p>}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default PhotoVerification;
