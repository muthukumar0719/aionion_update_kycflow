import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../../services/api";

import exclamatory from "../../../assets/exclamatory.png";
import bankproofs from "../../../assets/bankproofs.png";

import correct from "../../../assets/correct.png";
import verification from "../../../assets/verification.png";

import KycStepper from "../../../Components/kyc/KycStepper";
import KycInfoSection from "../../../Components/kyc/KycInfoSection";

const Bankproof = () => {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState("");

  const verificationMethod = localStorage.getItem("bank_verification_method");

  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscVerified, setIfscVerified] = useState(false);

  const [accountFocused, setAccountFocused] = useState(false);
  const [confirmAccountFocused, setConfirmAccountFocused] = useState(false);
  const [accountMatched, setAccountMatched] = useState(false);

  const [formData, setFormData] = useState({
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountType: "",
  });

  const [bankInfo, setBankInfo] = useState({
    bank_name: "",
    branch_name: "",
    bank_address: "",
  });

  const [errors, setErrors] = useState({
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountType: "",
    general: "",
  });

  useEffect(() => {
    const savedApplicationId = localStorage.getItem("application_id");

    if (!savedApplicationId) {
      navigate("/numberregistration");
      return;
    }

    setApplicationId(savedApplicationId);
  }, [navigate]);

  const maskFullAccountNumber = (accountNumber) => {
    if (!accountNumber) return "";
    return "X".repeat(accountNumber.length);
  };

  const clearBankLookup = () => {
    setBankInfo({
      bank_name: "",
      branch_name: "",
      bank_address: "",
    });

    setIfscVerified(false);
  };

  const checkAccountMatch = (accountNumber, confirmAccountNumber) => {
    if (!accountNumber || !confirmAccountNumber) {
      setAccountMatched(false);
      return false;
    }

    if (accountNumber !== confirmAccountNumber) {
      setAccountMatched(false);
      return false;
    }

    setAccountMatched(true);
    return true;
  };

  useEffect(() => {
    const ifsc = formData.ifscCode;

    setIfscVerified(false);

    if (!accountMatched) {
      clearBankLookup();
      return;
    }

    if (ifsc.length !== 11) {
      clearBankLookup();
      return;
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!ifscRegex.test(ifsc)) {
      setErrors((prev) => ({
        ...prev,
        ifscCode: "Enter valid IFSC code",
      }));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIfscLoading(true);

        const response = await api.get(`/bank-details/ifsc/${ifsc}`);

        if (response.data?.success) {
          setBankInfo({
            bank_name: response.data.data.bank_name,
            branch_name: response.data.data.branch_name,
            bank_address: response.data.data.bank_address,
          });

          setIfscVerified(true);

          setErrors((prev) => ({
            ...prev,
            ifscCode: "",
            general: "",
          }));
        }
      } catch (error) {
        clearBankLookup();

        setErrors((prev) => ({
          ...prev,
          ifscCode: error.response?.data?.message || "Invalid IFSC Code",
        }));
      } finally {
        setIfscLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.ifscCode, accountMatched]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;

    if (name === "accountNumber" || name === "confirmAccountNumber") {
      updatedValue = value.replace(/\D/g, "").slice(0, 18);
    }

    if (name === "ifscCode") {
      if (!accountMatched) {
        setErrors((prev) => ({
          ...prev,
          ifscCode: "Please enter matching account numbers first",
        }));
        return;
      }

      updatedValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11);
    }

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: updatedValue,
      };

      if (name === "accountNumber" || name === "confirmAccountNumber") {
        const accountNumber = next.accountNumber;
        const confirmAccountNumber = next.confirmAccountNumber;

        const bothEntered = accountNumber && confirmAccountNumber;
        const matched = bothEntered && accountNumber === confirmAccountNumber;

        setAccountMatched(Boolean(matched));

        if (!matched) {
          next.ifscCode = "";
          clearBankLookup();
        }

        if (bothEntered && !matched) {
          setErrors((prevErr) => ({
            ...prevErr,
            confirmAccountNumber: "Account numbers do not match",
            ifscCode: "",
            general: "",
          }));
        } else {
          setErrors((prevErr) => ({
            ...prevErr,
            accountNumber: "",
            confirmAccountNumber: "",
            general: "",
          }));
        }
      } else {
        setErrors((prevErr) => ({
          ...prevErr,
          [name]: "",
          general: "",
        }));
      }

      return next;
    });
  };

  const handleAccountMatch = () => {
    const matched = checkAccountMatch(
      formData.accountNumber,
      formData.confirmAccountNumber,
    );

    if (!formData.accountNumber || !formData.confirmAccountNumber) {
      return;
    }

    if (!matched) {
      setFormData((prev) => ({
        ...prev,
        ifscCode: "",
      }));

      clearBankLookup();

      setErrors((prev) => ({
        ...prev,
        confirmAccountNumber: "Account numbers do not match",
        ifscCode: "",
      }));

      return;
    }

    setErrors((prev) => ({
      ...prev,
      confirmAccountNumber: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      accountType: "",
      general: "",
    };

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    } else if (formData.accountNumber.length < 6) {
      newErrors.accountNumber = "Enter valid account number";
    }

    if (!formData.confirmAccountNumber.trim()) {
      newErrors.confirmAccountNumber = "Confirm account number required";
    } else if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = "Account numbers do not match";
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!accountMatched) {
      newErrors.confirmAccountNumber = "Account numbers do not match";
      newErrors.ifscCode = "Please enter matching account numbers first";
    } else if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = "IFSC code is required";
    } else if (!ifscRegex.test(formData.ifscCode)) {
      newErrors.ifscCode = "Enter valid IFSC code";
    }

    if (!formData.accountType) {
      newErrors.accountType = "Select account type";
    }

    if (!applicationId) {
      newErrors.general = "Application ID missing";
    }

    setErrors(newErrors);

    return (
      !newErrors.accountNumber &&
      !newErrors.confirmAccountNumber &&
      !newErrors.ifscCode &&
      !newErrors.accountType &&
      !newErrors.general
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    handleAccountMatch();

    if (!validateForm()) return;

    if (!accountMatched) {
      setErrors((prev) => ({
        ...prev,
        confirmAccountNumber: "Account numbers do not match",
      }));
      return;
    }

    if (!bankInfo.bank_name) {
      setErrors((prev) => ({
        ...prev,
        ifscCode: "Please enter valid IFSC code and wait for bank details",
      }));
      return;
    }

    try {
      setLoading(true);

      const verifyResponse = await api.post("/bank-details/verify-bank", {
        kyc_id: localStorage.getItem("kyc_id") || applicationId,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
      });

      console.log("VERIFY RESPONSE:", verifyResponse.data);

      if (!verifyResponse.data?.verified) {
        setErrors((prev) => ({
          ...prev,
          general: verifyResponse.data?.message || "Bank verification failed",
        }));
        return;
      }

      const response = await api.post("/bank-details/save", {
        application_id: Number(applicationId),
        accountNumber: formData.accountNumber,
        confirmAccountNumber: formData.confirmAccountNumber,
        ifscCode: formData.ifscCode,
        accountType: formData.accountType,
        verificationType: verificationMethod,
        verificationStatus: "VERIFIED",
        bankVerified: true,
        verificationAmount: verifyResponse.data?.data?.amount || null,
        bankResponse: verifyResponse.data?.data || null,
      });

      console.log("SAVE RESPONSE:", response.data);

      if (response.data?.success) {
        localStorage.setItem("bank_details_completed", "true");

        setBankInfo({
          bank_name: response.data.data.bank_name,
          branch_name: response.data.data.branch_name,
          bank_address: response.data.data.bank_address,
        });

        localStorage.setItem("bankInfo", JSON.stringify(response.data.data));

        navigate("/personaldetails");
      } else {
        setErrors((prev) => ({
          ...prev,
          general: response.data?.message || "Failed to save bank details",
        }));
      }
    } catch (error) {
      console.log("BANK DETAILS ERROR:", error.response?.data || error.message);

      setErrors((prev) => ({
        ...prev,
        general:
          error.response?.data?.message || "Failed to process bank details",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container'>
      <KycStepper currentStep='identify' completedSteps={["contact"]} />

      <div className='row'>
        <div className='col-lg-6 col-md-6 col-sm-12'>
          <div className='bank-entry-card'>
            <img src={bankproofs} alt='Bankproof' className='bankproofimg' />

            <div className='bank-info-text'>
              <p>
                <strong>Link Account:</strong> Enter your account number and
                IFSC code.
              </p>

              <p>
                <strong>Instant Check:</strong> The system verifies your details
                with your bank in real-time.
              </p>
            </div>

            <div className='d-flex gap-2 bank-instruction-text'>
              <img src={correct} alt='correct' className='correctimg-bank' />
              <p>
                Link your bank account seamlessly to enable instant verification
                and hassle-free transactions.
              </p>
            </div>

            <div className='d-flex gap-2 bank-instruction-text'>
              <img src={correct} alt='correct' className='correctimg-bank' />
              <p>Your data is fully encrypted and protected.</p>
            </div>

            <div className='verificationcard-bank d-flex gap-2'>
              <img
                src={verification}
                alt='verification'
                className='verificationimg'
              />
              <p>Safe. Secure. Seamless</p>
            </div>

            <p className='bank-para'>
              We partner with India's leading banks to ensure your financial
              onboarding is smooth and fully compliant with regulatory
              standards. Your account details are protected using
              industry-leading security protocols.
            </p>
          </div>
        </div>

        <div className='col-lg-6 col-md-6 col-sm-12'>
          <div className='bank-right-card'>
            <h2 className='text-center'>Enter Your Bank Details</h2>

            <p className='text-center'>
              ₹1 will be debited and refunded instantly for secure bank
              verification.
            </p>

            <form onSubmit={handleSubmit}>
              <div className='floating-group mb-3'>
                <input
                  type='text'
                  name='accountNumber'
                  className='floating-input'
                  placeholder='Enter Account Number'
                  value={
                    accountFocused
                      ? formData.accountNumber
                      : maskFullAccountNumber(formData.accountNumber)
                  }
                  onFocus={() => setAccountFocused(true)}
                  onBlur={() => {
                    setAccountFocused(false);
                    handleAccountMatch();
                  }}
                  onChange={handleChange}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  inputMode='numeric'
                  autoComplete='off'
                />

                <label>
                  Account Number <span>*</span>
                </label>
              </div>

              {errors.accountNumber && (
                <p className='error-text'>{errors.accountNumber}</p>
              )}

              <div className='floating-group mb-3'>
                <input
                  type='text'
                  name='confirmAccountNumber'
                  className='floating-input'
                  placeholder='Confirm Account Number'
                  value={
                    confirmAccountFocused
                      ? formData.confirmAccountNumber
                      : maskFullAccountNumber(formData.confirmAccountNumber)
                  }
                  onFocus={() => setConfirmAccountFocused(true)}
                  onBlur={() => {
                    setConfirmAccountFocused(false);
                    handleAccountMatch();
                  }}
                  onChange={handleChange}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  inputMode='numeric'
                  autoComplete='off'
                />

                <label>
                  Confirm Account Number <span>*</span>
                </label>
              </div>

              {errors.confirmAccountNumber && (
                <p className='error-text'>{errors.confirmAccountNumber}</p>
              )}

              <div className='floating-group mb-3'>
                <input
                  type='text'
                  name='ifscCode'
                  className='floating-input'
                  placeholder={
                    accountMatched
                      ? "Enter IFSC"
                      : "Confirm account number first"
                  }
                  value={formData.ifscCode}
                  onChange={handleChange}
                  disabled={!accountMatched}
                />

                <label>
                  IFSC Code <span>*</span>
                </label>
              </div>

              {ifscLoading && (
                <p className='ifsc-loading'>Fetching bank details...</p>
              )}

              {bankInfo.bank_name && (
                <p className='bank-short-info'>
                  {bankInfo.bank_name} - {bankInfo.branch_name},{" "}
                  {bankInfo.bank_address}
                </p>
              )}

              {errors.ifscCode && (
                <p className='error-text'>{errors.ifscCode}</p>
              )}

              {/* ACCOUNT TYPE */}

              <div className='floating-group'>
                <select
                  name='accountType'
                  className='floating-select'
                  value={formData.accountType}
                  onChange={handleChange}
                >
                  <option value='' disabled hidden>
                    Select Account Type
                  </option>

                  <option value='Savings'>Savings</option>
                  <option value='Current'>Current</option>
                </select>

                <label>
                  Account Type <span>*</span>
                </label>
              </div>

              {errors.accountType && (
                <p className='error-text'>{errors.accountType}</p>
              )}

              {errors.general && <p className='error-text'>{errors.general}</p>}

              <button
                type='submit'
                className='bank-submit-btn'
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <KycInfoSection />
    </div>
  );
};

export default Bankproof;
