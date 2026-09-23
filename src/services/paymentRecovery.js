const key = (kycId) => `pending_payment_verification:${kycId}`;

export const savePendingPayment = (payload) => {
  try { sessionStorage.setItem(key(payload.kyc_id), JSON.stringify(payload)); } catch (_) {}
};

export const getPendingPayment = (kycId) => {
  try {
    const payment = JSON.parse(sessionStorage.getItem(key(kycId)));
    return String(payment?.kyc_id) === String(kycId) ? payment : null;
  } catch (_) { return null; }
};

export const clearPendingPayment = (kycId) => {
  try { sessionStorage.removeItem(key(kycId)); } catch (_) {}
};

export const isPaymentComplete = (payment, expectedOrderId) =>
  payment?.payment_status === "paid" &&
  (!expectedOrderId || payment.payment_order_id === expectedOrderId);
