import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";

import api from "../../../services/api";

import otpimg from "../../../assets/otpimg.png";
import exclamatory from "../../../assets/exclamatory.png";

import KycStepper from "../../../Components/kyc/KycStepper";

import KycInfoSection from "../../../Components/kyc/KycInfoSection";

const Numberotp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [mobileNumber, setMobileNumber] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stateMobile = location.state?.mobile_number;
    const stateApplicationId = location.state?.application_id;

    const savedMobile = localStorage.getItem("mobile_number");
    const savedApplicationId = localStorage.getItem("application_id");

    const finalMobile = stateMobile || savedMobile || "";
    const finalApplicationId = stateApplicationId || savedApplicationId || "";

    if (!finalMobile || !finalApplicationId) {
      navigate("/numberregistration");
      return;
    }

    setMobileNumber(finalMobile);
    setApplicationId(finalApplicationId);

    localStorage.setItem("mobile_number", finalMobile);
    localStorage.setItem("application_id", finalApplicationId);
  }, [location.state, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setMessage("");

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleEditNumber = () => {
    sessionStorage.setItem("edit_mobile", "true");
    sessionStorage.setItem("mobile_number", mobileNumber);
    navigate("/numberregistration");
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join("");

    if (fullOtp.length !== 6) {
      setMessage("Please enter 6 digit OTP");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await api.post("/contact/verify-mobile-otp", {
        application_id: applicationId,
        kyc_id: localStorage.getItem("kyc_id"),
        mobile_number: mobileNumber,
        otp: fullOtp,
      });

      toast.success("Mobile number verified successfully");
      
      const nextRoute = response.data?.data?.next_step || "/emailverify";

      navigate(nextRoute, {
        state: {
          application_id: applicationId,
        },
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post("/contact/resend-mobile-otp", {
        application_id: applicationId,
        mobile_number: mobileNumber,
      });

      toast.success("OTP resent successfully");
      setOtp(["", "", "", "", "", ""]);
      setTimer(30);
      setCanResend(false);
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className='container'>
      <KycStepper currentStep='contact' completedSteps={[]} />

      <div className='row'>
        <div className='col-lg-6 image-column'>
          <img src={otpimg} alt='online-registration' className='otpimg' />
        </div>

        <div className='col-lg-6 forms-card'>
          <div className='register-card'>
            <div className='logo-section'>
              <h2 className='text-center'>Enter Mobile OTP</h2>
              <p className='text-center'>
                Enter 6 digit verification code sent to your mobile number
              </p>

              <div className='text-center mb-3'>
                <span className='otp-mobile-number'>{mobileNumber}</span>
                <FaEdit
                  className='edit-icon'
                  onClick={handleEditNumber}
                  style={{ cursor: "pointer", marginLeft: "8px" }}
                />
              </div>

              <div className='otp-container'>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type='text'
                    maxLength='1'
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className='otp-input'
                  />
                ))}
              </div>

              {message && <p className='error-text text-center'>{message}</p>}

              <button
                className='submit-btn'
                onClick={handleVerifyOtp}
                disabled={loading}
                type='button'
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <div className='text-center mt-3'>
                {canResend ? (
                  <button
                    type='button'
                    className='resend-btn'
                    onClick={handleResendOtp}
                  >
                    Resend OTP
                  </button>
                ) : (
                  <p className='resend-timer'>
                    Resend OTP in 0:{timer < 10 ? `0${timer}` : timer} sec
                  </p>
                )}
              </div>

              <div className='note-section'>
                <p>
                  <strong style={{ fontSize: "16px" }}>Note :</strong>
                </p>
                <p className='aadhaar-text'>
                  <span className='star-icon'>*</span> Online account opening
                  requires your number to be linked with Aadhaar. You can check
                  if your mobile number is linked to Aadhaar{" "}
                  <a
                    href='https://myaadhaar.uidai.gov.in/verify-email-mobile'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='link-here'
                  >
                    here
                  </a>
                  . If your mobile number isn't linked to Aadhaar, please open
                  your account offline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <KycInfoSection />
    </div>
  );
};

export default Numberotp;
