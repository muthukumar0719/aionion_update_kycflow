import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../../services/api";

import numberregistration from "../../../assets/numberregistration.png";
import otp from "../../../assets/otp.png";
import exclamatory from "../../../assets/exclamatory.png";

import KycStepper from "../../../Components/kyc/KycStepper";
import KycInfoSection from "../../../Components/kyc/KycInfoSection";

const Numberregistration = () => {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    mobile_number: "",
    dependency_type: "",
    terms_accepted: false,
  });
  const handleMobileInput = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);

    setFormData((prev) => ({
      ...prev,
      mobile_number: value,
    }));

    setErrors((prev) => ({
      ...prev,
      mobile_number: "",
      general: "",
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.mobile_number) {
      newErrors.mobile_number = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = "Enter a valid 10-digit mobile number";
    }

    if (!formData.terms_accepted) {
      newErrors.terms_accepted = "Please accept Terms & Conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      const payload = {
        mobile_number: formData.mobile_number,
        dependency_type: formData.dependency_type || null,
        terms_accepted: formData.terms_accepted,
      };

      const response = await api.post("/contact/start", payload);

      const responseData = response?.data?.data;

      if (!responseData?.application_id) {
        throw new Error("Application ID not received from server");
      }

      localStorage.setItem("application_id", responseData.application_id);
      if (responseData.kyc_id) {
        localStorage.setItem("kyc_id", String(responseData.kyc_id));
      }
      if (responseData.unique_id) {
        localStorage.setItem("unique_id", responseData.unique_id);
      }
      localStorage.setItem("mobile_number", formData.mobile_number);

      navigate("/numberotp", {
        state: {
          mobile_number: formData.mobile_number,
          application_id: responseData.application_id,
        },
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general:
          error.response?.data?.message ||
          error.message ||
          "Failed to send OTP. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const editMode = sessionStorage.getItem("edit_mobile");
    const savedMobile = sessionStorage.getItem("mobile_number");

    if (editMode === "true") {
      setFormData({
        mobile_number: savedMobile || "",
        dependency_type: "",
        terms_accepted: false,
      });

      sessionStorage.removeItem("edit_mobile");
      sessionStorage.removeItem("mobile_number");
    }
  }, []);

  return (
    <div className='container'>
      <KycStepper currentStep='contact' completedSteps={[]} />

      <div className='row'>
        <div className='col-lg-6 image-column'>
          <img
            src={numberregistration}
            alt='online-registration'
            className='numberregistrationimg'
          />
        </div>

        <div className='col-lg-6 forms-card'>
          <div className='register-card'>
            <div className='logo-section'>
              <h2 className='text-center form-heading'>Sign up Now</h2>
              <p className='text-center form-subheading'>
                Or resume/track your existing application
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className='input-container'>
                <input
                  type='tel'
                  name='mobile_number'
                  className='input-field'
                  placeholder='Enter Your Mobile Number'
                  maxLength={10}
                  value={formData.mobile_number}
                  onChange={handleMobileInput}
                />

                <label className='floating-label'>
                  Enter your Mobile Number <span>*</span>
                </label>

                {errors.mobile_number && (
                  <p className='error-text'>{errors.mobile_number}</p>
                )}
              </div>

              <div className='d-flex checkbox-content'>
                <input
                  type='checkbox'
                  id='terms'
                  name='terms_accepted'
                  className='checkbox'
                  checked={formData.terms_accepted}
                  onChange={handleChange}
                />

                <div className='terms-wrapper'>
                  <label htmlFor='terms'>
                    Accept all{" "}
                    <span className='terms-text'>Terms & Conditions*</span>
                  </label>

                  <div className='terms-popup'>
                    <p>
                      I hereby give my consent to undertake the online KYC
                      process for opening a Trading/Demat account with Aionion
                      Capital Market Services Private Limited. I am voluntarily
                      providing this email ID and mobile number to AIONION
                      CAPITAL MARKET SERVICES PRIVATE LIMITED for communication
                      purposes. I confirm that the provided email ID and mobile
                      number belong solely to me. I request all formal,
                      informal, and promotional communications to be sent to the
                      provided email ID and mobile number. Additionally, I
                      voluntarily authorize AIONION CAPITAL MARKET SERVICES
                      PRIVATE LIMITED to send all trading and
                      transaction-related statements to this mobile number.
                    </p>
                  </div>
                </div>
              </div>

              {errors.terms_accepted && (
                <p className='error-text'>{errors.terms_accepted}</p>
              )}

              {errors.general && (
                <p className='error-text' style={{ marginTop: "10px" }}>
                  {errors.general}
                </p>
              )}

              <button
                className='submit-btn'
                type='submit'
                disabled={loading}
              >
                <img src={otp} alt='otp' className='btn-icon' />
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>

            <div className='note-section'>
              <p>
                <strong style={{ fontSize: "16px" }}>Note :</strong>
              </p>
              <p className='aadhaar-text'>
                <span className='star-icon'>*</span> Online account opening
                requires your number to be linked with Aadhaar. You can check if
                your mobile number is linked to Aadhaar{" "}
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

      <KycInfoSection />
    </div>
  );
};

export default Numberregistration;
