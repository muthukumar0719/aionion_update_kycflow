import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { clearPendingPayment, savePendingPayment } from "../../../services/paymentRecovery";

import paymentImg from "../../../assets/paymentimg.png";

import KycStepper from "../../../Components/kyc/KycStepper";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayCheckout = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PaymentSummary = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const savedSchemeSelections = JSON.parse(
    localStorage.getItem("scheme_selections") || "{}",
  );

  // TEMPORARY: forced to Rs.10 to match the backend's PAYMENT_TEST_AMOUNT
  // override while testing in live mode (Rs.1 was rejected by Razorpay's
  // live pricing rules with a pricing_sdk error). Set back to 0 before
  // going live with real pricing.
  const testAmount = Number(process.env.REACT_APP_PAYMENT_TEST_AMOUNT || 10);

  const accountOpeningCharges =
    Number.isFinite(testAmount) && testAmount > 0
      ? testAmount
      : savedSchemeSelections.testing
        ? 1
        : savedSchemeSelections.annualCare
          ? 1249
          : 2499;
  const taxAmount =
    testAmount > 0 ? 0 : (accountOpeningCharges * 18) / 100;
  const total = accountOpeningCharges + taxAmount;

  useEffect(() => {
    loadRazorpayCheckout();
  }, []);

  const handlePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const scriptReady = await loadRazorpayCheckout();
      if (!scriptReady || !window.Razorpay) {
        toast.error("Unable to load the payment gateway. Please retry.");
        setIsProcessing(false);
        return;
      }

      const kycId =
        localStorage.getItem("kyc_id") ||
        localStorage.getItem("application_id");
      const userEmail = localStorage.getItem("email") || "";
      const userPhone = localStorage.getItem("mobile_number") || "";
      const userName =
        localStorage.getItem("client_name") ||
        (userEmail ? userEmail.split("@")[0] : "Client");

      if (!kycId) {
        toast.error("Missing KYC reference. Please restart the KYC flow.");
        setIsProcessing(false);
        return;
      }

      // 1) Create the order on the backend
      const { data: orderResponse } = await api.post("/payment/create-order", {
        kyc_id: kycId,
        amount: Number(total.toFixed(2)),
        currency: "INR",
        firstname: userName,
        email: userEmail,
        phone: userPhone,
        description: "Trading and Demat Account Opening",
      });

      if (!orderResponse?.success) {
        toast.error(orderResponse?.message || "Could not start payment.");
        setIsProcessing(false);
        return;
      }

      const order = orderResponse.data;

      // 2) Open Razorpay Checkout
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Aionion Capital",
        description: order.description,
        order_id: order.order_id,
        prefill: order.prefill,
        notes: { kyc_id: String(kycId) },
        theme: { color: "#0d6efd" },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info("Payment cancelled.");
          },
        },
        handler: async (response) => {
          savePendingPayment({ kyc_id: kycId, ...response });
          try {
            // 3) Verify on the backend
            const { data: verifyResponse } = await api.post("/payment/verify", {
              kyc_id: kycId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse?.success && verifyResponse.data?.payment_status === "paid") {
              clearPendingPayment(kycId);
              // Single success toast is shown on the /payment-completed page.
              navigate("/payment-completed");
            } else {
              toast.error(
                verifyResponse?.message || "Payment verification failed.",
              );
              navigate("/payment-failed", { state: { message: verifyResponse?.message, orderId: order.order_id } });
            }
          } catch (verifyError) {
            console.log(
              "VERIFY ERROR:",
              verifyError.response?.data || verifyError.message,
            );
            navigate("/payment-failed", { state: {
              message: verifyError.response?.data?.message || "Checkout finished, but payment confirmation is unavailable.",
              orderId: order.order_id,
            } });
          } finally {
            setIsProcessing(false);
          }
        },
      });

      rzp.on("payment.failed", (response) => {
        console.log("PAYMENT FAILED:", response.error);
        toast.error(response.error?.description || "Payment failed.");
        setIsProcessing(false);
        navigate("/payment-failed", { state: { message: response.error?.description, orderId: order.order_id } });
      });

      rzp.open();
    } catch (error) {
      console.log("PAYMENT ERROR:", error.response?.data || error.message);
      toast.error("Something went wrong while starting the payment.");
      setIsProcessing(false);
    }
  };

  return (
    <div className='container'>
      <KycStepper
        currentStep='complete'
        completedSteps={["contact", "identify", "personal", "scheme"]}
      />

      <div className='row'>
        {/* LEFT IMAGE */}
        <div className='col-lg-6'>
          <img src={paymentImg} alt='payment' className='paymentimg' />
        </div>

        {/* RIGHT PAYMENT SUMMARY */}
        <div className='col-lg-6'>
          <div className='payment-summary-box'>
            <h3 className='payment-title text-center'>Payment Summary</h3>

            <div className='payment-header d-flex justify-content-between fw-bold mt-4'>
              <span>Description</span>
              <span>Amount (Rs.)</span>
            </div>

            <div className='payment-row d-flex justify-content-between mt-3'>
              <span>Account Opening Charges</span>
              <span>{accountOpeningCharges.toFixed(2)}</span>
            </div>

            <div className='payment-row d-flex justify-content-between mt-3'>
              <span>18% Tax on Account Opening Charges</span>
              <span>{taxAmount.toFixed(2)}</span>
            </div>

            <hr />

            <div className='payment-total d-flex justify-content-between fw-bold'>
              <span>Total</span>
              <span>{total.toFixed(2)}</span>
            </div>
            <hr />

            <button
              type='button'
              className='payment-proceed-btn '
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Proceed to Pay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
