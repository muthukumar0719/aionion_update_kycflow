import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../../services/api";

import Pancard from "../../../assets/Pancard.png";

import KycStepper from "../../../Components/kyc/KycStepper";
import KycInfoSection from "../../../Components/kyc/KycInfoSection";

import lockicon from "../../../assets/lockicon.png";
import Restriction from "../../../assets/Restriction.png";
import phone from "../../../assets/phone.png";
import email from "../../../assets/email.png";
import calendar from "../../../assets/calendar.png";

const formatDobInput = (value) => {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
};

const parseDobToIso = (value) => {
  const match = String(value || "")
    .trim()
    .match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (!match) {
    return "";
  }

  const [, day, month, year] = match;
  const isoDate = `${year}-${month}-${day}`;
  const date = new Date(`${isoDate}T00:00:00`);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return "";
  }

  return isoDate;
};

const Pancardverification = () => {
  const navigate = useNavigate();

  const [showExistingPopup, setShowExistingPopup] = useState(false);
  const [showMinorPopup, setShowMinorPopup] = useState(false);
  const [existingClientCode, setExistingClientCode] = useState("");

  const [formData, setFormData] = useState({
    pan_number: "",
    dob: "",
    terms_accepted: false,
  });

  const [errors, setErrors] = useState({
    pan_number: "",
    dob: "",
    terms_accepted: "",
    general: "",
  });

  const [loading, setLoading] = useState(false);
  const [panResult, setPanResult] = useState(null);

  // PAN file / mobile camera states
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [activePanMethod, setActivePanMethod] = useState("upload");

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState("");

  // Capture Photo only in mobile view
  const [isMobileView, setIsMobileView] = useState(() => {
    return typeof window !== "undefined" && window.innerWidth <= 576;
  });

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // ---------------------------------------
  // PAN Number
  // ---------------------------------------
  const handlePanChange = (event) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);

    setFormData((previous) => ({
      ...previous,
      pan_number: value,
    }));

    setErrors((previous) => ({
      ...previous,
      pan_number: "",
      general: "",
    }));
  };

  // ---------------------------------------
  // Date of Birth
  // ---------------------------------------
  const handleDobChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      dob: formatDobInput(event.target.value),
    }));

    setErrors((previous) => ({
      ...previous,
      dob: "",
      general: "",
    }));
  };

  // ---------------------------------------
  // Checkbox
  // ---------------------------------------
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      general: "",
    }));
  };

  // ---------------------------------------
  // Validation
  // ---------------------------------------
  const validateForm = () => {
    const newErrors = {
      pan_number: "",
      dob: "",
      terms_accepted: "",
      general: "",
    };

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!formData.pan_number.trim()) {
      newErrors.pan_number = "PAN number is required.";
    } else if (!panRegex.test(formData.pan_number)) {
      newErrors.pan_number = "Enter a valid PAN number.";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required.";
    } else {
      const dobIso = parseDobToIso(formData.dob);
      const dobDate = dobIso ? new Date(`${dobIso}T00:00:00`) : new Date("");
      const today = new Date();

      if (!dobIso || Number.isNaN(dobDate.getTime())) {
        newErrors.dob = "Enter date of birth in dd-mm-yyyy format.";
      } else if (dobDate > today) {
        newErrors.dob = "Date of birth cannot be in the future.";
      } else {
        // Calculate age
        let age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dobDate.getDate())
        ) {
          age--;
        }

        // Minor validation
        if (age < 18) {
          setShowMinorPopup(true);
          newErrors.dob = "Applicants must be at least 18 years old.";
        }
      }
    }

    if (!formData.terms_accepted) {
      newErrors.terms_accepted = "Please accept the KYC Terms and Conditions.";
    }

    setErrors(newErrors);

    return !newErrors.pan_number && !newErrors.dob && !newErrors.terms_accepted;
  };

  const handleMinorPopupClose = () => {
    setShowMinorPopup(false);
    navigate("/");
  };

  // ---------------------------------------
  // Clear selected PAN file
  // ---------------------------------------
  const clearSelectedPanFile = () => {
    setFile(null);
    setCapturedPreview("");
    setFileError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ---------------------------------------
  // Stop camera
  // ---------------------------------------
  const stopPanCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  // ---------------------------------------
  // Mobile screen check
  // ---------------------------------------
  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth <= 576;

      setIsMobileView(mobileView);

      // When switching from mobile to tablet/desktop
      if (!mobileView) {
        stopPanCamera();

        setActivePanMethod((previous) => {
          return previous === "capture" ? "upload" : previous;
        });

        setCapturedPreview("");
        setFile(null);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ---------------------------------------
  // Stop camera on page leave
  // ---------------------------------------
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // ---------------------------------------
  // Switch Upload / Capture tab
  // ---------------------------------------
  const handlePanMethodChange = (method) => {
    if (method === activePanMethod) return;

    stopPanCamera();
    clearSelectedPanFile();

    setFileError("");
    setActivePanMethod(method);
  };

  // ---------------------------------------
  // Normal PAN file upload
  // ---------------------------------------
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];

    const allowedExtensions = ["jpg", "jpeg", "png"];

    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    const isValidFile =
      allowedMimeTypes.includes(selectedFile.type) ||
      allowedExtensions.includes(extension);

    if (!isValidFile) {
      setFile(null);
      setFileError("Only JPG, JPEG and PNG files are allowed.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setFile(null);
      setFileError("File size must be less than 2 MB.");
      event.target.value = "";
      return;
    }

    setCapturedPreview("");
    setFileError("");
    setFile(selectedFile);
  };

  // ---------------------------------------
  // Open Camera - Mobile only
  // ---------------------------------------
  const openPanCamera = async () => {
    try {
      setFileError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setFileError("Camera is not supported in this browser.");
        return;
      }

      stopPanCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;

      setCameraActive(true);

      requestAnimationFrame(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          try {
            await videoRef.current.play();
          } catch (error) {
            console.error("Camera play error:", error);
          }
        }
      });
    } catch (cameraError) {
      console.error("PAN Camera Error:", cameraError);

      if (cameraError.name === "NotAllowedError") {
        setFileError(
          "Camera permission was denied. Please allow camera access and try again.",
        );
      } else {
        setFileError("Unable to open camera. Please try again.");
      }
    }
  };

  // ---------------------------------------
  // Capture PAN photo
  // ---------------------------------------
  const capturePanPhoto = () => {
    const video = videoRef.current;
    const canvas = cameraCanvasRef.current;

    if (!video || !canvas || !video.videoWidth) {
      setFileError("Camera is not ready. Please wait and try again.");
      return;
    }

    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / video.videoWidth);

    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const context = canvas.getContext("2d");

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setFileError("Failed to capture PAN card image.");
          return;
        }

        if (blob.size > 2 * 1024 * 1024) {
          setFileError(
            "Captured image is above 2 MB. Please capture again with better framing.",
          );
          return;
        }

        const capturedFile = new File(
          [blob],
          `pan-card-capture-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          },
        );

        setCapturedPreview(canvas.toDataURL("image/jpeg", 0.82));
        setFile(capturedFile);
        setFileError("");

        stopPanCamera();
      },
      "image/jpeg",
      0.82,
    );
  };

  const retakePanPhoto = () => {
    clearSelectedPanFile();
    openPanCamera();
  };

  // ---------------------------------------
  // Upload PAN to backend
  // Backend uses upload.single("panCard")
  // ---------------------------------------
  const uploadPanCard = async ({ applicationId, panNumber, dateOfBirth }) => {
    if (!file) {
      throw new Error("PAN card image is required.");
    }

    const uploadData = new FormData();

    uploadData.append("kyc_id", applicationId);
    uploadData.append("pan_number", panNumber);
    uploadData.append("dob", dateOfBirth);

    uploadData.append("terms_accepted", String(formData.terms_accepted));

    // DB can store: upload / capture
    uploadData.append("pan_upload_method", activePanMethod);

    // Must match backend multer:
    // upload.single("panCard")
    uploadData.append("panCard", file);

    const uploadResponse = await api.post("/pancard/upload", uploadData);

    const uploadResult = uploadResponse.data;

    if (!uploadResult?.success) {
      throw new Error(uploadResult?.message || "PAN card upload failed.");
    }

    return uploadResult;
  };

  const normalizeMobileNumber = (value = "") => {
    const digits = String(value).replace(/\D/g, "");

    // Compare only the final 10 digits, removing +91/91 prefixes.
    return digits.slice(-10);
  };

  const normalizeEmailAddress = (value = "") => {
    return String(value).trim().toLowerCase();
  };

  const getFirstAvailableValue = (object, keys) => {
    for (const key of keys) {
      const value = object?.[key];

      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }

    return "";
  };

  const checkKraContactMatch = (kraData = {}) => {
    // Values saved during the previous mobile/email step.
    const enteredMobile =
      localStorage.getItem("mobileNumber") ||
      localStorage.getItem("mobile_number") ||
      localStorage.getItem("mobile") ||
      localStorage.getItem("phoneNumber") ||
      "";

    const enteredEmail =
      localStorage.getItem("emailAddress") ||
      localStorage.getItem("email") ||
      localStorage.getItem("email_id") ||
      "";

    // Adjust these keys if your KRA response uses different field names.
    const kraMobile = getFirstAvailableValue(kraData, [
      "mobile",
      "mobile_number",
      "mobileNumber",
      "mobile_no",
      "mobileNo",
      "phone",
      "phone_number",
      "phoneNumber",
    ]);

    const kraEmail = getFirstAvailableValue(kraData, [
      "email",
      "email_id",
      "emailId",
      "email_address",
      "emailAddress",
    ]);

    const normalizedEnteredMobile = normalizeMobileNumber(enteredMobile);

    const normalizedKraMobile = normalizeMobileNumber(kraMobile);

    const normalizedEnteredEmail = normalizeEmailAddress(enteredEmail);

    const normalizedKraEmail = normalizeEmailAddress(kraEmail);

    // AND operation: both mobile and email must be available and match.
    const mobileMatched =
      Boolean(normalizedEnteredMobile && normalizedKraMobile) &&
      normalizedEnteredMobile === normalizedKraMobile;

    const emailMatched =
      Boolean(normalizedEnteredEmail && normalizedKraEmail) &&
      normalizedEnteredEmail === normalizedKraEmail;

    return {
      mobileMatched,
      emailMatched,
      allContactDetailsMatched: mobileMatched && emailMatched,
    };
  };

  const redirectToDigiLocker = async ({
    applicationId,
    panNumber,
    reason,
    contactVerification,
  }) => {
    try {
      /*
       * This must match your backend route:
       * router.post("/start", startDigilockerController)
       */
      const response = await api.post("/digilocker/start");

      // Your controller returns result.data directly.
      const digiLockerData = response.data?.data || response.data;

      console.log("DIGILOCKER START RESPONSE:", digiLockerData);

      const requestId =
        digiLockerData?.id ||
        digiLockerData?.requestId ||
        digiLockerData?.request_id;

      const digiLockerUrl =
        digiLockerData?.url ||
        digiLockerData?.authorizationUrl ||
        digiLockerData?.authorization_url ||
        digiLockerData?.redirectUrl ||
        digiLockerData?.redirect_url;

      if (!requestId) {
        throw new Error("DigiLocker request ID was not received.");
      }

      if (!digiLockerUrl) {
        throw new Error("DigiLocker login URL was not received.");
      }

      // Save request ID in your identification table.
      await api.post("/identify/save-details", {
        kyc_id: applicationId,
        pan_number: panNumber,
        provider: "digilocker",
        provider_ref: requestId,
        verification_reason: reason,
        mobile_matched: contactVerification?.mobileMatched ?? false,
        email_matched: contactVerification?.emailMatched ?? false,
      });

      localStorage.setItem("digilocker_request_id", String(requestId));

      localStorage.setItem("digilocker_flow_reason", reason);

      localStorage.setItem("verification_provider", "digilocker");

      // This opens the actual Setu/DigiLocker page.
      window.location.assign(digiLockerUrl);
    } catch (error) {
      console.error(
        "START DIGILOCKER ERROR:",
        error.response?.data || error.message,
      );

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Unable to start DigiLocker verification.",
      );
    }
  };

  // ---------------------------------------
  // Verify PAN and upload PAN image
  // ---------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    if (!file) {
      setFileError(
        activePanMethod === "capture"
          ? "Please capture your PAN card image."
          : "Please upload your PAN card image.",
      );
      return;
    }

    try {
      setLoading(true);
      setFileError("");

      const cleanedPan = formData.pan_number.trim().toUpperCase();
      const dobIso = parseDobToIso(formData.dob);

      localStorage.setItem("panNumber", cleanedPan);

      const existingKycId = localStorage.getItem("kyc_id");
      if (!existingKycId) {
        throw new Error("KYC ID is missing. Please restart the KYC process.");
      }

      // OCR validation in verify-pan reads this upload, so upload must finish first.
      await uploadPanCard({
        applicationId: existingKycId,
        panNumber: cleanedPan,
        dateOfBirth: dobIso,
      });

      const verifyResponse = await api.post("/identify/verify-pan", {
        kyc_id: localStorage.getItem("kyc_id"),
        pan_number: cleanedPan,
        dob: dobIso,
      });

      const result = verifyResponse.data;

      console.log("VERIFY PAN RESPONSE:", result);

      if (result?.kyc_id) {
        localStorage.setItem("kyc_id", String(result.kyc_id));
      }

      if (!result?.success) {
        setErrors((previous) => ({
          ...previous,
          general: result?.message || "PAN verification failed.",
        }));

        return;
      }

      if (result?.accountExists) {
        setExistingClientCode(result.clientCode || "");
        setShowExistingPopup(true);
        return;
      }

      const applicationId = result?.kyc_id || localStorage.getItem("kyc_id");

      if (!applicationId) {
        setErrors((previous) => ({
          ...previous,
          general: "KYC ID is missing. Please restart the KYC process.",
        }));

        return;
      }

      /*
       * KRA FLOW
       *
       * Continue to KRA details only when:
       * 1. The PAN is KRA registered.
       * 2. Entered mobile matches KRA mobile.
       * 3. Entered email matches KRA email.
       *
       * Otherwise continue through DigiLocker.
       */
      if (result?.isKraRegistered) {
        const kraData = result?.data || {};

        const { mobileMatched, emailMatched, allContactDetailsMatched } =
          checkKraContactMatch(kraData);

        console.log("KRA CONTACT MATCH RESULT:", {
          mobileMatched,
          emailMatched,
          allContactDetailsMatched,
        });

        // KRA registered -> always fetch and show the KRA details.
        // (KRA masks mobile/email in its response, so an exact contact match
        // can rarely pass; the match result is passed through for display only.)
        localStorage.setItem(
          "kra_contact_verified",
          allContactDetailsMatched ? "true" : "false",
        );

        navigate("/kra-details", {
          state: {
            panData: kraData,
            contactVerification: { mobileMatched, emailMatched },
          },
        });

        return;
      }

      if (result?.incomeTaxVerified) {
        navigate("/income-details", {
          state: {
            incomeTaxData: result.data,
            pan_number: cleanedPan,
            dob: formData.dob,
          },
        });

        return;
      }

      setPanResult(result.data || result);
    } catch (submitError) {
      console.error(
        "PAN verification / upload error:",
        submitError.response?.data || submitError.message,
      );

      setErrors((previous) => ({
        ...previous,
        general:
          submitError.response?.data?.message ||
          submitError.message ||
          "PAN verification failed.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleExistingPopupClose = () => {
    setShowExistingPopup(false);
    navigate("/");
  };

  const handleContinue = () => {
    navigate("/bankdetails");
  };

  return (
    <div className='container'>
      <KycStepper currentStep='identify' completedSteps={["contact"]} />

      <div className='row'>
        <div className='col-lg-6 pancard-left'>
          <div className='pan-card'>
            <p className='text-format'>1. Kindly input your:</p>

            <ul>
              <li>PAN Number as in PAN Card</li>
              <li>Date of Birth as in PAN Card</li>
            </ul>

            <p className='text-format'>
              2. The Account Name will be recorded in accordance with the
              details provided in the Income Tax Database.
            </p>

            <p className='text-format'>
              3. In compliance with the latest PMLA regulations, please verify
              that your Aadhaar Number is correctly linked to your PAN.
            </p>

            <img src={Pancard} alt='PAN card' className='pancardimg' />
          </div>
        </div>

        <div className='col-lg-6 forms-card'>
          <div className='register-card'>
            <div className='logo-section'>
              <h2 className='text-center'>PAN Verification</h2>

              <p className='text-center'>
                Your name will be taken as per ITD (Income Tax Department)
              </p>
            </div>

            <div className='input-container'>
              <input
                type='text'
                name='pan_number'
                className='input-field'
                placeholder='PAN Number'
                value={formData.pan_number}
                onChange={handlePanChange}
                maxLength='10'
                disabled={loading}
              />

              <label className='floating-label'>
                Enter your PAN Number <span>*</span>
              </label>

              {errors.pan_number && (
                <p className='error-text'>{errors.pan_number}</p>
              )}
            </div>

            <div className='input-container'>
              <input
                type='text'
                className='input-field'
                name='dob'
                value={formData.dob}
                onChange={handleDobChange}
                placeholder='dd-mm-yyyy'
                inputMode='numeric'
                maxLength='10'
                disabled={loading}
              />

              <label className='floating-label'>
                Date of Birth <span className='required'>*</span>
              </label>

              {errors.dob && <p className='error-text'>{errors.dob}</p>}
            </div>

            {/* PAN Upload / Mobile Capture */}
            <div className=''>
              <h4 className='pan-page-title'>Upload PAN Card </h4>

              {fileError && (
                <div className='signature-error-box'>{fileError}</div>
              )}

              {isMobileView && (
                <div className='signature-tabs'>
                  <button
                    type='button'
                    className={`signature-tab ${
                      activePanMethod === "upload" ? "active" : ""
                    }`}
                    onClick={() => handlePanMethodChange("upload")}
                    disabled={loading}
                  >
                    Upload PAN Card
                  </button>
                  <button
                    type='button'
                    className={`signature-tab ${
                      activePanMethod === "capture" ? "active" : ""
                    }`}
                    onClick={() => handlePanMethodChange("capture")}
                    disabled={loading}
                  >
                    Capture Photo
                  </button>
                </div>
              )}

              <div className='signature-tab-content'>
                {/* Normal PAN image upload */}
                {activePanMethod === "upload" && (
                  <div className='signature-upload-content'>
                    <input
                      ref={fileInputRef}
                      type='file'
                      id='panFile'
                      accept='.jpg,.jpeg,.png,image/jpeg,image/png'
                      hidden
                      onChange={handleFileChange}
                      disabled={loading}
                    />

                    <label
                      htmlFor='panFile'
                      className='signature-file-upload-box'
                    >
                      <div className='upload-file-icon'>↑</div>

                      <p>
                        Choose PAN Card
                        <span className='text-danger'> *</span>
                      </p>

                      <small>JPG, JPEG or PNG up to 2 MB</small>

                      <span className='browse-file-btn'>Browse File</span>
                    </label>
                  </div>
                )}

                {/* Capture only in mobile view ≤576px */}
                {activePanMethod === "capture" && isMobileView && (
                  <div className='signature-camera-content'>
                    {!cameraActive && !capturedPreview && (
                      <div className='camera-start-box'>
                        <div className='camera-icon'>📷</div>

                        <h5>Capture PAN Card</h5>

                        <p>
                          Keep your PAN card flat, fully visible and in good
                          lighting before taking the photo.
                        </p>

                        <button
                          type='button'
                          className='camera-action-btn'
                          onClick={openPanCamera}
                          disabled={loading}
                        >
                          Open Camera
                        </button>
                      </div>
                    )}

                    {cameraActive && (
                      <div className='camera-preview-wrapper'>
                        <video
                          ref={videoRef}
                          className='camera-video'
                          autoPlay
                          playsInline
                          muted
                        />

                        <div className='camera-buttons-row'>
                          <button
                            type='button'
                            className='camera-cancel-btn'
                            onClick={stopPanCamera}
                          >
                            Cancel
                          </button>

                          <button
                            type='button'
                            className='camera-capture-btn'
                            onClick={capturePanPhoto}
                          >
                            Capture Photo
                          </button>
                        </div>
                      </div>
                    )}

                    {capturedPreview && !cameraActive && (
                      <div className='captured-image-wrapper'>
                        <img
                          src={capturedPreview}
                          alt='Captured PAN card'
                          className='captured-signature-image'
                        />

                        <button
                          type='button'
                          className='retake-photo-btn'
                          onClick={retakePanPhoto}
                          disabled={loading}
                        >
                          Retake Photo
                        </button>
                      </div>
                    )}

                    <canvas ref={cameraCanvasRef} hidden />
                  </div>
                )}
              </div>

              {file && (
                <div
                  className='selected-file-box'
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    border: "1px solid #21a366",
                    background: "#e9f8f0",
                    borderRadius: "12px",
                    padding: "12px 16px",
                  }}
                >
                  <span
                    aria-hidden='true'
                    style={{
                      flex: "0 0 auto",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#21a366",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>

                  <span
                    className='selected-file-name'
                    style={{ color: "#0f7a4b", fontWeight: 600, flex: 1 }}
                  >
                    {activePanMethod === "capture"
                      ? `Captured PAN Image: ${file.name}`
                      : `Selected PAN File: ${file.name}`}
                  </span>

                  <button
                    type='button'
                    className='remove-file-btn'
                    onClick={clearSelectedPanFile}
                    disabled={loading}
                    title='Remove file'
                    style={{
                      flex: "0 0 auto",
                      background: "transparent",
                      border: "none",
                      color: "#6b7280",
                      fontSize: "18px",
                      lineHeight: 1,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {errors.general && <p className='error-text'>{errors.general}</p>}

            <div className='d-flex checkbox-content'>
              <input
                type='checkbox'
                id='terms'
                name='terms_accepted'
                className='checkbox'
                checked={formData.terms_accepted}
                onChange={handleChange}
                disabled={loading}
              />

              <div className='terms-wrapper'>
                <label htmlFor='terms'>
                  I Consent to{" "}
                  <span className='terms-text'>KYC Terms and Conditions*</span>
                </label>

                <div className='terms-popup'>
                  <p>
                    I/We hereby declare that the KYC details furnished by me are
                    true and correct to the best of my/our knowledge and belief
                    and I/we undertake to inform you of any changes therein,
                    immediately. In case any of the above information is found
                    to be false or untrue or misleading or misrepresenting, I
                    am/We are aware that I/We may be held liable for it. I/We
                    hereby consent to receiving information from CVL KRA and
                    C-KYC registry through SMS/Email on the above registered
                    number/Email address. I am/We are also aware that for
                    Aadhaar OVD based KYC, my KYC request shall be validated
                    against Aadhaar details. I/We hereby consent to sharing
                    my/our masked Aadhaar card with readable QR code or my
                    Aadhaar XML/Digilocker XML file, along with passcode and as
                    applicable, with KRA and other Intermediaries with whom I
                    have a business relationship for KYC purposes only.
                  </p>
                </div>
              </div>
            </div>

            {errors.terms_accepted && (
              <p className='error-text'>{errors.terms_accepted}</p>
            )}

            <button
              type='button'
              className='submit-btn'
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Submit"}
            </button>

            {panResult && (
              <div className='mt-3 pan-result-card'>
                <h5>Your PAN is verified</h5>

                <p>
                  <strong>Full Name:</strong>{" "}
                  {panResult.full_name || "Not available"}
                </p>

                <p>
                  <strong>Category:</strong>{" "}
                  {panResult.category || "Not available"}
                </p>

                {panResult.aadhaar_seeding_status && (
                  <p>
                    <strong>Aadhaar Seeding Status:</strong>{" "}
                    {panResult.aadhaar_seeding_status}
                  </p>
                )}

                <button
                  type='button'
                  className='submit-btn mt-2'
                  onClick={handleContinue}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showExistingPopup && (
        <div className='popup-overlay'>
          <div className='popup-card-result'>
            <button
              type='button'
              className='popup-close-result'
              onClick={handleExistingPopupClose}
            >
              ×
            </button>

            <div className='popup-icon'>
              <img src={lockicon} alt='lockicon' className='headerimg' />
            </div>

            <h4 className='popup-title'>Account Already Exists</h4>

            <p className='popup-message'>
              An account is already registered with Aionion Capital.
            </p>

            <div className='client-code-box'>
              Your Client Code : {existingClientCode}
            </div>

            <p className='popup-contact-text'>
              Please Contact your RM, For Helpline
            </p>

            <div className='popup-help-row'>
              <img src={phone} alt='lockicon' className='popup-help-icon' />
              <span>(+91) 92402 62108</span>
            </div>

            <div className='popup-help-row'>
              <img src={email} alt='lockicon' className='popup-help-icon' />
              <span>clientcare@aionioncapital.com</span>
            </div>
          </div>
        </div>
      )}

      {showMinorPopup && (
        <div className='popup-overlay'>
          <div className='popup-card-result'>
            <button
              type='button'
              className='popup-close-result'
              onClick={handleMinorPopupClose}
            >
              ×
            </button>

            <div className='popup-icon'>
              <img src={Restriction} alt='Restriction' className='headerimg' />
            </div>

            <h4 className='popup-title'>Age Restriction</h4>

            <p className='popup-message'>
              You must be 18 years or older to proceed.
            </p>

            <div className='client-code-box'>
              <img src={calendar} alt='calendat' className='calendarimg' />
              Date of Birth :{" "}
              {new Date(formData.dob).toLocaleDateString("en-GB")}
            </div>

            <p className='popup-contact-text'>
              As per our records, you are under 18 years of age.
            </p>

            <p className='popup-contact-text'>
              Access to this service is not allowed.
            </p>
          </div>
        </div>
      )}

      <KycInfoSection />
    </div>
  );
};

export default Pancardverification;
