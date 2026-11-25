export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "cyan";

const tones: Record<string, Tone> = {
  PENDING: "warning",
  PAYMENT_PENDING: "warning",
  PROCESSING: "info",
  NEED_MORE_INFO: "warning",
  IN_REVIEW: "info",
  COMPLETED: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
  CONFIRMED: "info",
  PACKED: "info",
  SHIPPED: "cyan",
  RETURNED: "danger",
  UNPAID: "danger",
  PARTIAL: "warning",
  PAID: "success",
  REFUNDED: "neutral",
  VERIFIED: "success",
  REJECTED: "danger",
  ACTIVE: "success",
  SUSPENDED: "danger",
  OPEN: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
  ISSUED: "info",
  OVERDUE: "danger",
  PRESENT: "success",
  ABSENT: "danger",
  LATE: "warning",
  NEW: "info",
  READ: "neutral",
  REPLIED: "success",
  PENDING_VERIFICATION: "warning",
  DROPPED: "neutral",
};

export function toneFor(status: string): Tone {
  return tones[status] ?? "neutral";
}

export const SERVICE_STATUSES = [
  "PENDING",
  "PAYMENT_PENDING",
  "PROCESSING",
  "NEED_MORE_INFO",
  "IN_REVIEW",
  "COMPLETED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

export const ENROLLMENT_STATUSES = ["PENDING", "ACTIVE", "COMPLETED", "DROPPED", "CANCELLED"] as const;
