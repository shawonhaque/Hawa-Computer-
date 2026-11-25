import "server-only";

/**
 * Outbound messaging adapters. Nothing is sent unless the relevant provider
 * credentials are configured, and every skip is logged so operations can see
 * exactly what would have gone out.
 */
export type OutboundMessage = { to: string; subject?: string; body: string };

export async function sendSms(message: OutboundMessage) {
  if (!process.env.SMS_API_KEY || !process.env.SMS_API_URL) {
    console.info(`[sms:skipped] to=${message.to} body=${message.body.slice(0, 80)}`);
    return { sent: false, reason: "not_configured" as const };
  }
  try {
    const response = await fetch(process.env.SMS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SMS_API_KEY}` },
      body: JSON.stringify({ to: message.to, message: message.body }),
    });
    return { sent: response.ok, reason: response.ok ? ("sent" as const) : ("provider_error" as const) };
  } catch (error) {
    console.error("[sms:error]", error);
    return { sent: false, reason: "network_error" as const };
  }
}

export async function sendEmail(message: OutboundMessage) {
  if (!process.env.EMAIL_API_KEY || !process.env.EMAIL_API_URL || !process.env.EMAIL_FROM) {
    console.info(`[email:skipped] to=${message.to} subject=${message.subject ?? ""}`);
    return { sent: false, reason: "not_configured" as const };
  }
  try {
    const response = await fetch(process.env.EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.EMAIL_API_KEY}` },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.body,
      }),
    });
    return { sent: response.ok, reason: response.ok ? ("sent" as const) : ("provider_error" as const) };
  } catch (error) {
    console.error("[email:error]", error);
    return { sent: false, reason: "network_error" as const };
  }
}
