import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { clearPendingPayment, getPendingPayment, isPaymentComplete } from "../../../services/paymentRecovery";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const kycId = localStorage.getItem("kyc_id") || localStorage.getItem("application_id");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState(state?.message || "Your payment has not been confirmed yet.");
  const pending = getPendingPayment(kycId);
  const expectedOrderId = state?.orderId || pending?.razorpay_order_id;

  const checkStatus = useCallback(async () => {
    if (!kycId) {
      setMessage("Your application reference is missing. Please contact support with your payment reference.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.get(`/payment/status/${encodeURIComponent(kycId)}`);
      if (!data?.success) throw new Error("Status unavailable");
      if (isPaymentComplete(data.data, expectedOrderId)) {
        clearPendingPayment(kycId);
        navigate("/payment-completed", { replace: true });
        return;
      }
      if (expectedOrderId && data.data?.payment_order_id !== expectedOrderId) {
        setMessage("This payment does not match the latest application order. Please contact support with your payment reference.");
        return;
      }
      const payment = data.data;
      setStatus(payment?.payment_status || "");
      if (payment?.payment_status === "source_blocked") {
        setMessage(payment.payment_source_note || "Your payment needs review because the payment source could not be accepted. Please contact support.");
      } else if (payment?.payment_status === "failed") {
        setMessage(payment.payment_error_description || "The gateway reported a failed payment. If money was debited, contact support before paying again.");
      } else {
        setMessage(state?.message || "Payment confirmation is pending. Check again shortly or retry verification if available.");
      }
    } catch (_) {
      setMessage("We could not check your payment status. Please check again shortly. This does not mean your payment failed.");
    } finally { setBusy(false); }
  }, [kycId, expectedOrderId, navigate, state?.message]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const retryVerification = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post("/payment/verify", pending);
      if (data?.success && data.data?.payment_status === "paid") {
        clearPendingPayment(kycId);
        navigate("/payment-completed", { replace: true });
      } else {
        setMessage(data?.message || "Payment confirmation is still pending.");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Verification is unavailable. Please check the payment status again shortly.");
    } finally { setBusy(false); }
  };

  return (
    <div className='container text-center mt-5'>
      <h1>{status === "failed" ? "Payment Failed" : status === "source_blocked" ? "Payment Needs Review" : "Payment Confirmation"}</h1>
      <p role='status'>{busy ? "Checking your payment…" : message}</p>
      <p>If money has been debited, please do not pay again until this payment is confirmed or reviewed by support.</p>
      {pending?.razorpay_payment_id && <p>Payment reference: {pending.razorpay_payment_id}</p>}
      <button className='btn btn-primary m-2' disabled={busy || !kycId} onClick={checkStatus}>Check payment status</button>
      {pending && pending.razorpay_order_id === expectedOrderId && status !== "source_blocked" && (
        <button className='btn btn-outline-primary m-2' disabled={busy} onClick={retryVerification}>Retry verification</button>
      )}
    </div>
  );
};

export default PaymentFailed;
