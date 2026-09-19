import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../../services/api";

const normalizeGenderLabel = (value) => {
  const normalized = String(value || "").trim().toUpperCase();

  if (normalized === "M" || normalized === "MALE") return "Male";
  if (normalized === "F" || normalized === "FEMALE") return "Female";
  if (normalized === "T" || normalized === "TRANSGENDER") return "Transgender";

  return String(value || "").trim();
};

const KraDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const panData = location.state?.panData;

  if (!panData) {
    return (
      <div className='container py-5 text-center'>
        <h4>No KRA data found</h4>

        <button
          className='btn btn-primary mt-3'
          onClick={() => navigate("/pancard-verification")}
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleNext = async () => {
    try {
      console.log("PAN DATA:", panData);
      const kraAddress = [
        panData.address_1,
        panData.address_2,
        panData.address_3,
        panData.city,
        panData.district,
        panData.state,
        panData.pincode,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(", ");

      if (kraAddress) {
        localStorage.setItem("aadhaar_address_prefill", kraAddress);
        localStorage.setItem("aadhaar_address_prefill_source", "KRA");
      }

      const kraFatherName = String(panData.father_name || "").trim();
      if (kraFatherName) {
        localStorage.setItem("father_name_prefill", kraFatherName);
        localStorage.setItem("father_name_prefill_source", "KRA");
      }

      const kraGender = normalizeGenderLabel(panData.gender);
      if (kraGender) {
        localStorage.setItem("gender_prefill", kraGender);
        localStorage.setItem("gender_prefill_source", "KRA");
      }

      await api.post("/identify/save-kra-details", {
        kyc_id: localStorage.getItem("kyc_id"),

        ...panData,
      });

      navigate("/bankproof");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className='kra-page'>
      <div className='kra-card'>
        <div className='kra-header'>KRA Details</div>

        <div className='kra-body'>
          <div className='row g-4'>
            <div className='col-md-6'>
              <label className='kra-label'>KRA Email</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.email || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>KRA Mobile</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.mobile || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>Gender</label>

              <input
                type='text'
                className='form-control kra-input'
                value={normalizeGenderLabel(panData.gender)}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>Date of Birth</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.dob || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>Aadhaar Number</label>

              <input
                type='text'
                className='form-control kra-input'
                value={
                  panData.aadhaar_number
                    ? `XXXXXXXX${String(panData.aadhaar_number)
                        .replace(/\s/g, "")
                        .slice(-4)}`
                    : "XXXXXXXXXXXX"
                }
                readOnly
              />
            </div>

            {/* <div className='col-md-6'>
              <label className='form-label'>Aadhaar Number</label>

              <input
                type='text'
                className='form-control'
                value={maskedAadhaar}
                readOnly
              />
            </div> */}

            <div className='col-md-6'>
              <label className='kra-label'>KRA Name</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.name || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>Father Name</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.father_name || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>Address 1</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.address_1 || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>Address 2</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.address_2 || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>Address 3</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.address_3 || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>City</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.city || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>District</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.district || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>State</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.state || ""}
                readOnly
              />
            </div>

            <div className='col-md-6'>
              <label className='kra-label'>Pincode</label>

              <input
                type='text'
                className='form-control kra-input'
                value={panData.pincode || ""}
                readOnly
              />
            </div>
          </div>

          <div className='text-center mt-5'>
            <button className='kra-btn' onClick={handleNext}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KraDetails;
