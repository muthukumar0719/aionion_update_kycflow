import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../../services/api";

import digilocker from "../../assets/digilocker.png";
import Aadhaarcard from "../../assets/Aadhaarcard.png";
import correct from "../../assets/correct.png";
import verification from "../../assets/verification.png";

const normalizeGenderLabel = (value) => {
  const normalized = String(value || "").trim().toUpperCase();

  if (normalized === "M" || normalized === "MALE") return "Male";
  if (normalized === "F" || normalized === "FEMALE") return "Female";
  if (normalized === "T" || normalized === "TRANSGENDER") return "Transgender";

  return String(value || "").trim();
};

const DigilockerDetails = () => {
  const location = useLocation();

  const navigate = useNavigate();

  const data = location.state?.digilockerData;
  console.log("DIGILOCKER DATA:", data);

  if (!data) {
    return (
      <div className='container py-5 text-center'>
        <h4>No DigiLocker data found</h4>
      </div>
    );
  }

  const maskedAadhaar = data?.maskedNumber || "";
  const address = data?.address || {};

  // DigiLocker / Setu Aadhaar address does not have a plain "city" field - the
  // town/city sits in vtc (Village/Town/City), sometimes subDistrict / locality.
  const city =
    address.city ||
    address.vtc ||
    address.subDistrict ||
    address.sub_district ||
    address.locality ||
    address.postOffice ||
    address.po ||
    "";

  const fullAddress = `
  ${address.house || ""}
  ${address.street || ""}
  ${address.landmark || ""}
  ${city || ""}
  ${address.district || ""}
  ${address.state || ""}
  ${address.country || ""}
  ${address.pin || ""}
`
    .replace(/\s+/g, " ")
    .trim();
  const addressLine1 = [address.house, address.street, address.landmark]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
  const addressLine2 = [city, address.district]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");

  const rawCareOf = data?.address?.careOf || "";

  const fatherName = rawCareOf
    .replace(/^(S\/O|D\/O|C\/O|W\/O)\s*:?\s*/i, "")
    .trim();

  const photoUrl = data?.photo ? `data:image/jpeg;base64,${data.photo}` : "";

  const handleProceed = async () => {
    try {
      localStorage.setItem("aadhaar_address_prefill", fullAddress);
      localStorage.setItem("aadhaar_address_prefill_source", "DIGILOCKER");
      if (fatherName) {
        localStorage.setItem("father_name_prefill", fatherName);
        localStorage.setItem("father_name_prefill_source", "DIGILOCKER");
      }
      if (data?.gender) {
        localStorage.setItem(
          "gender_prefill",
          normalizeGenderLabel(data.gender),
        );
        localStorage.setItem("gender_prefill_source", "DIGILOCKER");
      }

      const kycId =
        localStorage.getItem("kyc_id") ||
        localStorage.getItem("application_id") ||
        "";

      if (!kycId) {
        console.log("Missing kyc_id/application_id in localStorage");
        alert("Your session reference is missing. Please restart the KYC flow.");
        return;
      }

      const payload = {
        kyc_id: kycId,
        application_id: kycId,

        aadhaar_number_masked: maskedAadhaar,

        name: data?.name,

        father_name: fatherName,

        gender: normalizeGenderLabel(data?.gender),

        dob: data?.dateOfBirth,

        address: `
        ${address.house || ""}
        ${address.street || ""}
        ${address.landmark || ""}
        ${address.district || ""}
        ${address.state || ""}
        ${address.country || ""}
        ${address.pin || ""}
      `
          .replace(/\s+/g, " ")
          .trim(),

        address_1: addressLine1,

        address_2: addressLine2,

        city: city || "",

        district: address.district || "",

        state: address.state || "",

        pincode: address.pin || "",

        photo_base64: photoUrl,

        provider: "digilocker",

        provider_ref: localStorage.getItem("digilocker_id"),
      };

      console.log("SAVE PAYLOAD:", payload);

      const saveResp = await api.post("/identify/save-details", payload);
      console.log("Data saved successfully", saveResp?.data);

      navigate("/bankproof", {
        state: {
          customerData: {
            ...data,
          },
        },
      });
    } catch (error) {
      const apiMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to save DigiLocker details";
      console.log("SAVE DETAILS ERROR:", error.response?.data || error.message);
      alert(apiMsg);
    }
  };

  return (
    <div className='container'>
      <div className='row'>
        <div className='col-lg-6 col-md-6 col-sm-12'>
          <div className='digilocker-card'>
            <img src={digilocker} alt='digilocker' className='digilockerimg' />

            <img
              src={Aadhaarcard}
              alt='Aadhaarcard'
              className='Aadhaarcardimg'
            />

            <div className='d-flex gap-2'>
              <img src={correct} alt='correct' className='correctimg' />
              <p>Identity Verified Successfully.</p>
            </div>

            <div className='d-flex gap-2'>
              <img src={correct} alt='correct' className='correctimg' />
              <p>
                Your details have been fetched Successfully from your official
                digilocker account
              </p>
            </div>

            <div className='verificationcard d-flex gap-2'>
              <img
                src={verification}
                alt='verification'
                className='verificationimg'
              />
              <p>Government Backed Verification</p>
            </div>
          </div>
        </div>

        <div className='col-lg-6 col-md-6 col-sm-12'>
          <div className='digilocker-result-card'>
            <h3 className='digilocker-title'>Confirm your Details</h3>

            <p className='digilocker-subtitle'>
              Please verify the details fetched via DigiLocker
            </p>

            {/* PHOTO TOP */}
            <div className='profile-photo-wrap'>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt='Aadhaar Profile'
                  className='profile-photo'
                />
              ) : (
                <div className='profile-photo no-photo'>No Photo</div>
              )}
            </div>

            <div className='details-form'>
              <div className='input-box input-box-full'>
                <label>
                  Aadhaar Number <span>*</span>
                </label>
                <input type='text' value={maskedAadhaar} readOnly />
              </div>

              <div className='input-box'>
                <label>
                  Full Name <span>*</span>
                </label>
                <input type='text' value={data?.name || ""} readOnly />
              </div>

              <div className='input-box'>
                <label>
                  Father’s Name <span>*</span>
                </label>
                <input type='text' value={fatherName || ""} readOnly />
              </div>

              <div className='input-box'>
                <label>
                  DOB <span>*</span>
                </label>
                <input type='text' value={data?.dateOfBirth || ""} readOnly />
              </div>

              <div className='input-box'>
                <label>
                  Gender <span>*</span>
                </label>
                <input
                  type='text'
                  value={normalizeGenderLabel(data?.gender)}
                  readOnly
                />
              </div>

              <div className='input-box'>
                <label>
                  City <span>*</span>
                </label>
                <input type='text' value={city || ""} readOnly />
              </div>

              <div className='input-box'>
                <label>
                  District <span>*</span>
                </label>
                <input type='text' value={address.district || ""} readOnly />
              </div>

              <div className='input-box'>
                <label>
                  State <span>*</span>
                </label>
                <input type='text' value={address.state || ""} readOnly />
              </div>

              <div className='input-box'>
                <label>
                  Pincode <span>*</span>
                </label>
                <input type='text' value={address.pin || ""} readOnly />
              </div>

              <div className='input-box input-box-full address-box'>
                <label>
                  Address <span>*</span>
                </label>
                <textarea value={fullAddress} readOnly />
              </div>
            </div>

            <div className='confirm-btn-wrap'>
              <button className='confirm-btn' onClick={handleProceed}>
                Confirm & Proceed <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigilockerDetails;
