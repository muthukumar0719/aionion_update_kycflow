import React, { useEffect, useState } from "react";

import KycStepper from "../../Components/kyc/KycStepper";

const REDIRECT_URL = "https://www.aionioncapital.com";
const AUTO_REDIRECT_SECONDS = 5;

const KycCompleted = () => {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      window.location.href = REDIRECT_URL;
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <div className='container py-5'>
      <KycStepper
        currentStep='complete'
        completedSteps={["contact", "identify", "personal", "scheme", "complete"]}
      />

      <div
        style={{
          maxWidth: "760px",
          margin: "40px auto 0",
          background: "#fff",
          borderRadius: "24px",
          boxShadow: "0 18px 48px rgba(38, 64, 149, 0.12)",
          padding: "48px 36px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <img
          src='/aionion-logo.png'
          alt='Aionion Capital'
          style={{ height: "90px", marginBottom: "20px" }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              width: "70px",
              height: "22px",
              background: "#1c2fef",
              transform: "skewX(-20deg)",
            }}
          />
          <div
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontWeight: 700,
              fontSize: "56px",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: "#1c2fef" }}>Happy </span>
            <span style={{ color: "#f36c8a" }}>Investing..!</span>
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              width: "70px",
              height: "22px",
              background: "#f36c8a",
              transform: "skewX(-20deg)",
            }}
          />
        </div>

        <div style={{ textAlign: "left", fontSize: "17px", lineHeight: 1.7, color: "#1a1a1a" }}>
          <p style={{ fontWeight: 700, marginBottom: "10px" }}>Congratulations!</p>
          <p style={{ fontStyle: "italic", marginBottom: "10px" }}>
            Your Demat Account Opening Process Has Been Completed Successfully.
          </p>
          <p style={{ fontStyle: "italic", marginBottom: "10px" }}>
            Your Demat Account will be activated within 2 working days.
          </p>
          <p style={{ fontStyle: "italic", marginBottom: "10px" }}>
            You will receive a confirmation notification once your account is active.
          </p>
          <p style={{ fontStyle: "italic", marginBottom: 0 }}>Thank you for choosing us.</p>
        </div>

        <p style={{ marginTop: "24px", color: "#8a8f9c", fontSize: "15px" }}>
          Redirecting to aionioncapital.com in {secondsLeft}s...{" "}
          <a
            href={REDIRECT_URL}
            style={{ color: "#1c2fef", fontWeight: 600, textDecoration: "none" }}
          >
            Go now
          </a>
        </p>
      </div>
    </div>
  );
};

export default KycCompleted;
