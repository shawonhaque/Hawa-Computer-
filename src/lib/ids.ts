import { randomBytes, randomInt } from "crypto";

function stamp() {
  const d = new Date();
  return [
    d.getFullYear().toString().slice(2),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("");
}

function suffix(len = 4) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

export const newOrderNo = () => `HC-${stamp()}-${suffix(5)}`;
export const newTrackingId = () => `APP-${stamp()}-${suffix(6)}`;
export const newInvoiceNo = () => `INV-${stamp()}-${suffix(5)}`;
export const newTicketNo = () => `TKT-${stamp()}-${suffix(4)}`;
export const newMemberNo = () => `LIB-${stamp()}-${suffix(4)}`;
export const newCertificateNo = () => `HC-CERT-${new Date().getFullYear()}-${suffix(6)}`;
export const newPaymentRef = () => `PAY-${stamp()}-${suffix(6)}`;
export const newPurchaseRef = () => `PUR-${stamp()}-${suffix(4)}`;
export const randomToken = (bytes = 24) => randomBytes(bytes).toString("hex");
