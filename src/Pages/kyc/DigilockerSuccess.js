import React, { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import api from "../../services/api";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes

const resolveDigilockerId = (searchParams) =>
  searchParams.get("id") ||
  searchParams.get("request_id") ||
  localStorage.getItem("digilocker_id") ||
  localStorage.getItem("digilocker_request_id") ||
  null;

const DigilockerSuccess = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const [error, setError] = useState("");

  useEffect(() => {
    const id = resolveDigilockerId(searchParams);

    console.log("DIGILOCKER ID:", id);

    if (!id) {
      setError(
        "Missing DigiLocker reference. Please restart the DigiLocker step."
      );
      return undefined;
    }

    let attempts = 0;
    let cancelled = false;

    const finish = () => {
      cancelled = true;
      clearInterval(interval);
    };

    const tick = async () => {
      if (cancelled) return;

      attempts += 1;

      if (attempts > MAX_POLL_ATTEMPTS) {
        finish();
        setError("DigiLocker verification timed out. Please try again.");
        return;
      }

      try {
        const statusResponse = await api.get(`/digilocker/status/${id}`);

        const statusData = statusResponse.data.data;

        console.log("STATUS:", statusData);

        if (statusData.status !== "authenticated") return;

        finish();

        // CVL KRA: pass kyc_id so backend can upload Aadhaar XML to S3
        const applicationId = localStorage.getItem("kyc_id");
        const aadhaarResponse = await api.get(
          `/digilocker/aadhaar/${id}${
            applicationId ? `?kyc_id=${applicationId}` : ``
          }`
        );

        const aadhaarData = aadhaarResponse.data.data.aadhaar;

        console.log("AADHAAR DATA:", aadhaarData);

        navigate("/digilocker-details", {
          state: { digilockerData: aadhaarData },
        });
      } catch (err) {
        finish();
        const detail = err.response?.data || err.message;
        console.log(detail);
        setError(
          typeof detail === "string"
            ? detail
            : detail?.message ||
                "Unable to fetch DigiLocker details. Please try again."
        );
      }
    };

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    tick();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [searchParams, navigate]);

  return (
    <div className="container py-5 text-center">
      {error ? (
        <h3 className="text-danger">{error}</h3>
      ) : (
        <h3>Fetching DigiLocker Details...</h3>
      )}
    </div>
  );
};

export default DigilockerSuccess;
