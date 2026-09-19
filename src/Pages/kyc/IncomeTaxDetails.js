import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../../services/api";

import incomedepartment from "../../assets/incomedepartment.png";
import samplepancard from "../../assets/samplepancard.png";
import correct from "../../assets/correct.png";
import verification from "../../assets/verification.png";

const IncomeTaxDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const responseData = location.state?.incomeTaxData;

  const panNumber = location.state?.pan_number;

  const dob = location.state?.dob;

  const panData = responseData?.data;

  if (!panData) {
    return (
      <div className='container py-5 text-center'>
        <h4>No Income Tax data found</h4>
      </div>
    );
  }

  const handleContinue = async () => {
    try {
      const response = await api.post("/digilocker/start");
      console.log("FULL RESPONSE:", response.data);

      const loginUrl = response.data.url;

      const requestId = response.data.id;

      localStorage.setItem("digilocker_id", requestId);

      console.log("PAN DATA:", panData);

      await api.post("/identify/save-details", {
        kyc_id: localStorage.getItem("kyc_id"),

        pan_number: panNumber,
        full_name: panData?.full_name,
        first_name: panData?.first_name,
        middle_name: panData?.middle_name,
        last_name: panData?.last_name,
        category: panData?.category,
        aadhaar_seeding_status: panData?.aadhaar_seeding_status,
        provider: "income_tax",
      });

      console.log("PAN DATA SAVED");

      await api.post("/identify/save-details", {
        kyc_id: localStorage.getItem("kyc_id"),

        provider: "digilocker",
        provider_ref: requestId,
      });

      console.log("DIGILOCKER INITIAL DATA SAVED");

      if (loginUrl) {
        window.location.href = loginUrl;
      }
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  };

  return (
    <div className='container'>
      <div className='row'>
        <div className='col-lg-6 col-md-6 col-sm-12'>
          <div className='Income-card'>
            <img
              src={incomedepartment}
              alt='Incomedepartment'
              className='Incomedepartmentimg'
            />

            <img
              src={samplepancard}
              alt='pancardartment'
              className='samplepancardimg'
            />

            <div className='d-flex gap-2'>
              <img src={correct} alt='correct' className='correctimg' />
              <p>Identity Verified Successfully.</p>
            </div>

            <div className='d-flex gap-2'>
              <img src={correct} alt='correct' className='correctimg' />
              <p>
                Your details have been fetched Successfully from your official
                ITD account.
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
          <div className='Income-result-card'>
            <h3 className='text-center'>Confirm your Details</h3>

            <p className='text-center'>
              Please verify the details fetched via ITD (Income Tax Department)
            </p>

            <div className='input-box'>
              <label>
                PAN Number <span>*</span>
              </label>
              <input type='text' value={panNumber || ""} readOnly />
            </div>

            <div className='input-box'>
              <label>
                Full Name <span>*</span>
              </label>

              <input type='text' value={panData?.full_name || ""} readOnly />
            </div>

            <div className='input-box'>
              <label>Aadhaar Linked</label>
              <input
                type='text'
                value={panData?.aadhaar_seeding_status || ""}
                readOnly
              />
            </div>

            <div className='input-box'>
              <label>DOB</label>
              <input type='text' value={dob || ""} readOnly />
            </div>

            <div className='text-center mt-4'>
             <button
                className='income-tax-button px-5'
                onClick={handleContinue}
              >
                Confirm & Proceed
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeTaxDetails;
