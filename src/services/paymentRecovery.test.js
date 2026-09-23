import { clearPendingPayment, getPendingPayment, isPaymentComplete, savePendingPayment } from "./paymentRecovery";

beforeEach(() => sessionStorage.clear());

test("retains checkout verification for the same application without creating a new order", () => {
  const payload = { kyc_id: "12", razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "signature" };
  savePendingPayment(payload);
  expect(getPendingPayment("12")).toEqual(payload);
  expect(getPendingPayment("13")).toBeNull();
  clearPendingPayment("12");
  expect(getPendingPayment("12")).toBeNull();
});

test("requires confirmed payment for the expected order", () => {
  expect(isPaymentComplete({ payment_status: "paid", payment_order_id: "order_1" }, "order_1")).toBe(true);
  expect(isPaymentComplete({ payment_status: "paid", payment_order_id: "order_other" }, "order_1")).toBe(false);
  for (const payment_status of ["created", "authorized", "source_blocked", "failed", "signature_failed"]) {
    expect(isPaymentComplete({ payment_status, payment_order_id: "order_1" }, "order_1")).toBe(false);
  }
  expect(isPaymentComplete(null)).toBe(false);
});

test("ignores corrupt saved verification", () => {
  sessionStorage.setItem("pending_payment_verification:12", "invalid json");
  expect(getPendingPayment("12")).toBeNull();
});
