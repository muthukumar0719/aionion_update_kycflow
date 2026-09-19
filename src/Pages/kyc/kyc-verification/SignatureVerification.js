import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import KycStepper from "../../../Components/kyc/KycStepper";
import api from "../../../services/api";

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 30;
const PROVIDER_PENDING_STATUSES = new Set([
  "sign_in_progress",
  "sign_pending",
  "sign_initiated",
  "pending",
  "in_progress",
]);

const buildPendingProviderMessage = (providerStatus) =>
  `The eSign provider has not finalized this request yet${providerStatus ? ` (${providerStatus})` : ""}. Please wait 30-60 seconds, then use Check Status again. If the OTP page showed "transaction not allowed", this usually means the provider or ESP has not completed the transaction on their side yet.`;

const SignatureVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [esignStatus, setEsignStatus] = useState("");
  // Set when eSign has definitively failed in a way "Check Status" can never
  // fix by itself (Aadhaar name mismatch, or the name couldn't be verified) -
  // the applicant has to go back to Setu and sign again, not just re-poll.
  const [needsRetry, setNeedsRetry] = useState(false);
  const [providerStatus, setProviderStatus] = useState("");
  const [signedPdfUrl, setSignedPdfUrl] = useState("");
  const [ddpiDetails, setDdpiDetails] = useState(null);
  const [ddpiLoading, setDdpiLoading] = useState(false);
  const [applicationId, setApplicationId] = useState(
    () =>
      searchParams.get("application_id") ||
      localStorage.getItem("application_id") ||
      "",
  );
  const [esignId, setEsignId] = useState(
    () => localStorage.getItem("unique_id") || "",
  );
  const hasReturnFromEsign = searchParams.get("esign_return") === "1";
  const isCompleted = (esignStatus === "completed" || providerStatus === "sign_complete") && Boolean(signedPdfUrl);
  const isCheckingReturnedEsign = hasReturnFromEsign && !isCompleted;

  // eSign is done - skip the "Download Signed PDF / Continue" screen and go
  // straight to the Happy Investing page instead of making the user click through.
  useEffect(() => {
    if (isCompleted) {
      navigate("/kyc-complete");
    }
  }, [isCompleted, navigate]);

  const assetBaseUrl = useMemo(
    () => String(api.defaults.baseURL || "").replace(/\/api\/?$/, ""),
    [],
  );

  useEffect(() => {
    const nextApplicationId =
      searchParams.get("application_id") ||
      localStorage.getItem("application_id") ||
      "";

    setApplicationId(nextApplicationId);
    setEsignId(localStorage.getItem("unique_id") || "");
  }, [searchParams]);

  // eSign endpoints are addressed by unique_id where available; older
  // in-progress sessions created before this field existed fall back to the
  // numeric id (the backend accepts either).
  const effectiveEsignId = esignId || applicationId;

  useEffect(() => {
    if (!applicationId) {
      return;
    }

    let cancelled = false;

    const loadDdpiDetails = async () => {
      try {
        setDdpiLoading(true);
        const response = await api.get(`/ddpi/applications/${applicationId}`);
        if (!cancelled) {
          setDdpiDetails(response.data?.data || null);
        }
      } catch (error) {
        if (!cancelled) {
          setDdpiDetails(null);
        }
      } finally {
        if (!cancelled) {
          setDdpiLoading(false);
        }
      }
    };

    loadDdpiDetails();

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  useEffect(() => {
    if (!effectiveEsignId || !hasReturnFromEsign) {
      return undefined;
    }

    let pollAttempts = 0;
    let pollTimer = null;
    let stopped = false;

    const stopPolling = () => {
      stopped = true;
      if (pollTimer) {
        window.clearTimeout(pollTimer);
      }
    };

    const checkEsignStatus = async () => {
      try {
        setStatusLoading(true);

        const response = await api.get(
          `/esign/applications/${effectiveEsignId}/status`,
        );
        const data = response.data?.data || {};
        const nextEsignStatus = data.esign_status || "";
        const nextProviderStatus = data.provider_status || "";

        setEsignStatus(nextEsignStatus);
        setProviderStatus(nextProviderStatus);

        if (nextProviderStatus === "sign_complete") {
          localStorage.setItem("esign_completed", "true");
          setSignedPdfUrl(
            `${api.defaults.baseURL}/esign/applications/${effectiveEsignId}/signed-pdf`,
          );
          setMessage(
            "eSign completed successfully. Download the signed PDF or continue.",
          );
          stopPolling();
          return;
        }

        if (nextEsignStatus === "pending") {
          pollAttempts += 1;
          setMessage(buildPendingProviderMessage(nextProviderStatus));

          if (pollAttempts < MAX_POLL_ATTEMPTS && !stopped) {
            pollTimer = window.setTimeout(checkEsignStatus, POLL_INTERVAL_MS);
            return;
          }

          setMessage(buildPendingProviderMessage(nextProviderStatus));
          stopPolling();
          return;
        }

        setMessage(
          data.provider_response?.message ||
            "eSign is not completed yet. Please retry after signing.",
        );
        stopPolling();
      } catch (error) {
        const code = error.response?.data?.code;
        if (code === "ESIGN_NAME_MISMATCH" || code === "ESIGN_NAME_UNVERIFIABLE") {
          setNeedsRetry(true);
        }
        setMessage(
          error.response?.data?.message ||
            "Unable to check the eSign status right now.",
        );
        stopPolling();
      } finally {
        setStatusLoading(false);
      }
    };

    checkEsignStatus();

    return () => {
      stopPolling();
    };
  }, [effectiveEsignId, hasReturnFromEsign]);

  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => {
          const reason =
            error.code === error.PERMISSION_DENIED
              ? "Location permission was denied."
              : "Unable to fetch current location.";
          reject(new Error(`${reason} eSign requires your current location.`));
        },
        { enableHighAccuracy: true, timeout: 15000 },
      );
    });

  const handleStartEsign = async () => {
    try {
      setLoading(true);
      setMessage("");
      setNeedsRetry(false);

      if (!effectiveEsignId) {
        setMessage(
          "Application ID not found. Please resume the application again.",
        );
        return;
      }

      const { latitude, longitude } = await getCurrentPosition();

      const response = await api.post(
        `/esign/applications/${effectiveEsignId}/start`,
        { lat: latitude, lng: longitude },
      );

      const signingUrl = response.data?.data?.signing_url;

      if (!signingUrl) {
        setMessage("eSign could not be started. Please try again.");
        return;
      }

      setMessage("Redirecting to Setu eSign...");
      window.location.href = signingUrl;
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to start the eSign step right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!effectiveEsignId) {
      setMessage(
        "Application ID not found. Please resume the application again.",
      );
      return;
    }

    try {
      setStatusLoading(true);
      setMessage("Refreshing eSign status...");

      const response = await api.get(
        `/esign/applications/${effectiveEsignId}/status`,
      );
      const data = response.data?.data || {};
      const nextEsignStatus = data.esign_status || "";
      const nextProviderStatus = data.provider_status || "";

      setEsignStatus(nextEsignStatus);
      setProviderStatus(nextProviderStatus);

      if (nextProviderStatus === "sign_complete") {
        localStorage.setItem("esign_completed", "true");
        setSignedPdfUrl(
          `${api.defaults.baseURL}/esign/applications/${effectiveEsignId}/signed-pdf`,
        );
        setMessage(
          "eSign completed successfully. Download the signed PDF or continue.",
        );
        return;
      }

      if (
        nextEsignStatus === "pending" ||
        PROVIDER_PENDING_STATUSES.has(nextProviderStatus)
      ) {
        setMessage(buildPendingProviderMessage(nextProviderStatus));
        return;
      }

      setMessage(
        data.provider_response?.message ||
          "eSign is still pending. Please finish signing and check again.",
      );
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === "ESIGN_NAME_MISMATCH" || code === "ESIGN_NAME_UNVERIFIABLE") {
        setNeedsRetry(true);
      }
      setMessage(
        error.response?.data?.message ||
          "Unable to check the eSign status right now.",
      );
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className='container'>
      <KycStepper
        currentStep='complete'
        completedSteps={["contact", "identify", "personal", "scheme"]}
      />

      <div className=''>
        

        {ddpiDetails?.ddpi_selected ? (
          <div>
            {ddpiLoading ? (
              <p style={{ color: "#264095", marginBottom: 0 }}>
                Loading assigned stamp paper...
              </p>
            ) : ddpiDetails.image_url ? (
              <img
                src={`${assetBaseUrl}${ddpiDetails.image_url}`}
                alt={ddpiDetails.stamp_number || "Assigned stamp paper"}
                onError={(e) => e.target.style.display = 'none'}
                style={{
                  width: "100%",
                  maxWidth: "480px",
                  borderRadius: "12px",
                  border: "1px solid #d7defe",
                  background: "#fff",
                }}
              />
            ) : null}
          </div>
        ) : null}

        {message ? (
          <p className='mt-3' style={{ color: "#264095" }}>
            {message}
          </p>
        ) : null}

        {providerStatus ? (
          <p className='mt-2' style={{ color: "#264095" }}>
            Setu status: <strong>{providerStatus}</strong>
          </p>
        ) : null}

        {!isCompleted && !hasReturnFromEsign ? (
          <button
            type='button'
            className='submit-btn'
            style={{
              marginTop: "35px",
              marginBottom: "40px",
              width: "auto",
              minWidth: "320px",
              maxWidth: "480px",
              marginLeft: "auto",
              marginRight: "auto",
              paddingLeft: "32px",
              paddingRight: "32px",
            }}
            onClick={handleStartEsign}
            disabled={loading || statusLoading || !applicationId}
          >
            {loading ? "Processing..." : "Proceed to eSign"}
          </button>
        ) : null}

        {isCheckingReturnedEsign ? (
          <>
            <style>{`
              @keyframes esignSpin { to { transform: rotate(360deg); } }
              @keyframes esignBounce {
                0%, 80%, 100% { transform: scale(0.5); opacity: 0.4; }
                40% { transform: scale(1); opacity: 1; }
              }
              @keyframes esignBar {
                0% { left: -40%; }
                100% { left: 100%; }
              }
              @keyframes esignPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.55; }
              }
            `}</style>

            <div
              style={{
                marginTop: "24px",
                border: "1px solid #d7defe",
                borderRadius: "20px",
                background:
                  "linear-gradient(135deg, #f2f6ff 0%, #eef2ff 50%, #f5f0ff 100%)",
                padding: "40px 24px",
                color: "#264095",
                textAlign: "center",
              }}
            >
              {/* gradient spinner ring */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  margin: "0 auto 22px",
                  borderRadius: "50%",
                  background:
                    "conic-gradient(from 0deg, #2f6bff, #7b3ff2, #ff4d9d, #ffb020, #2f6bff)",
                  WebkitMask:
                    "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px))",
                  mask:
                    "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px))",
                  animation: "esignSpin 1s linear infinite",
                }}
              />

              <p
                style={{
                  margin: "0 0 6px",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  animation: "esignPulse 1.6s ease-in-out infinite",
                }}
              >
                {statusLoading
                  ? "Checking eSign completion status..."
                  : "Waiting for the latest eSign status update from Setu."}
              </p>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#5b6bb5" }}>
                Please keep this page open. This usually takes a few seconds.
              </p>

              {/* bouncing dots */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  margin: "20px 0 18px",
                }}
              >
                {["#2f6bff", "#7b3ff2", "#ff4d9d"].map((c, i) => (
                  <span
                    key={c}
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: c,
                      display: "inline-block",
                      animation: `esignBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                    }}
                  />
                ))}
              </div>

              {/* indeterminate progress bar */}
              <div
                style={{
                  position: "relative",
                  height: "6px",
                  borderRadius: "999px",
                  background: "#dfe6ff",
                  overflow: "hidden",
                  maxWidth: "320px",
                  margin: "0 auto",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: "40%",
                    borderRadius: "999px",
                    background:
                      "linear-gradient(90deg, #2f6bff, #7b3ff2, #ff4d9d)",
                    animation: "esignBar 1.3s ease-in-out infinite",
                  }}
                />
              </div>

              {needsRetry ? (
                <button
                  type='button'
                  className='submit-btn'
                  style={{
                    marginTop: "24px",
                    marginBottom: "25px",
                    width: "auto",
                    minWidth: "320px",
                    maxWidth: "480px",
                    marginLeft: "auto",
                    marginRight: "auto",
                    paddingLeft: "32px",
                    paddingRight: "32px",
                  }}
                  onClick={handleStartEsign}
                  disabled={loading || !applicationId}
                >
                  {loading ? "Processing..." : "Try Again"}
                </button>
              ) : null}
            </div>

            {needsRetry ? null : (
              <button
                type='button'
                className='submit-btn'
                style={{
                  marginTop: "16px",
                  background: "#fff",
                  color: "#264095",
                  border: "1px solid #264095",
                }}
                onClick={handleCheckStatus}
                disabled={loading || statusLoading || !applicationId}
              >
                Check Status
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default SignatureVerification;
