import "server-only";
import type { Locale } from "@/lib/dictionaries";

export function paymentMethods(locale: Locale) {
  const bn = locale === "bn";
  return [
    { value: "BKASH", label: "bKash", number: process.env.BKASH_MERCHANT_NUMBER ?? "" },
    { value: "NAGAD", label: "Nagad", number: process.env.NAGAD_MERCHANT_NUMBER ?? "" },
    { value: "ROCKET", label: "Rocket", number: process.env.ROCKET_MERCHANT_NUMBER ?? "" },
    { value: "CASH", label: bn ? "দোকানে নগদ" : "Cash at shop", number: "" },
  ];
}

export const paymentLabels = (locale: Locale) => {
  const bn = locale === "bn";
  return {
    method: bn ? "পেমেন্ট মাধ্যম" : "Payment method",
    sendTo: bn ? "টাকা পাঠান" : "Send money to",
    trxId: bn ? "ট্রানজেকশন আইডি" : "Transaction ID",
    payerNumber: bn ? "যে নম্বর থেকে পাঠিয়েছেন" : "Number you paid from",
    screenshot: bn ? "পেমেন্ট স্ক্রিনশট (ঐচ্ছিক)" : "Payment screenshot (optional)",
    submit: bn ? "পেমেন্ট জমা দিন" : "Submit payment",
    submitting: bn ? "জমা হচ্ছে…" : "Submitting…",
    amount: bn ? "পরিমাণ" : "Amount",
    note: bn
      ? "পেমেন্ট পাঠানোর পর ট্রানজেকশন আইডি দিন। আমাদের টিম যাচাই করে নিশ্চিত করবে — শুধু স্ক্রিনশট দেখে পেমেন্ট নিশ্চিত করা হয় না।"
      : "Send money, then submit the transaction ID. Our team verifies it — a screenshot alone never marks a payment as paid.",
  };
};
