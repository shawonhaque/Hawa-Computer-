"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast, type ToastTone } from "@/components/ui/toast";

const messages: Record<string, { title: string; tone: ToastTone }> = {
  order_placed: { title: "Order placed successfully", tone: "success" },
  application_submitted: { title: "Application submitted", tone: "success" },
  payment_submitted: { title: "Payment submitted for verification", tone: "success" },
  saved: { title: "Saved", tone: "success" },
  updated: { title: "Updated", tone: "success" },
  deleted: { title: "Deleted", tone: "success" },
  ticket_created: { title: "Support ticket created", tone: "success" },
  message_sent: { title: "Message sent", tone: "success" },
  review_submitted: { title: "Review submitted for moderation", tone: "success" },
  logged_in: { title: "Welcome back", tone: "success" },
  registered: { title: "Account created", tone: "success" },
  logged_out: { title: "Signed out", tone: "info" },
  invalid_credentials: { title: "Email or password is incorrect", tone: "error" },
  email_exists: { title: "That email is already registered", tone: "error" },
  invalid_input: { title: "Please check the highlighted fields", tone: "error" },
  forbidden: { title: "You do not have permission to do that", tone: "error" },
  rate_limited: { title: "Too many attempts, please wait a moment", tone: "error" },
  not_found: { title: "We could not find that record", tone: "error" },
  upload_failed: { title: "The file could not be uploaded", tone: "error" },
  coupon_invalid: { title: "That coupon is not valid", tone: "error" },
};

export function Flash() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useToast();

  useEffect(() => {
    const key = params.get("flash");
    const detail = params.get("detail");
    if (!key) return;
    const message = messages[key] ?? { title: key, tone: "info" as ToastTone };
    push({ title: message.title, description: detail ?? undefined, tone: message.tone });

    const next = new URLSearchParams(params.toString());
    next.delete("flash");
    next.delete("detail");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [params, pathname, push, router]);

  return null;
}
