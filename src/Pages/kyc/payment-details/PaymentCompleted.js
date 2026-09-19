import React, { useEffect } from "react";

import { useNavigate } from "react-router-dom";

import Congratulations from "../../../assets/Congratulations.png";

import KycStepper from "../../../Components/kyc/KycStepper";
import { toast } from "react-toastify";
const PaymentCompleted = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // toastId dedupes the double-fire from React StrictMode / re-mounts, so
    // only one popup shows.
    toast.success("Payment completed successfully", {
      toastId: "payment-completed",
    });
  }, []);

  return (
    <div className='container'>
      <KycStepper
        currentStep='complete'
        completedSteps={["contact", "identify", "personal", "scheme"]}
      />

      <div className='Payment-card'>
        <img
          src={Congratulations}
          alt='Congratulations'
          className='Congratulationimg'
        />

        <h3 className='text-center'>Congratulations</h3>

        <p className='text-center'>You have successfully completed payment</p>
        <button
          type='button'
          className='submit-btn'
          onClick={() => navigate("/photoverify")}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default PaymentCompleted;
