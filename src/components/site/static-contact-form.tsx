"use client";

import { useState } from "react";
import { CheckCircle2, Mail, MessageSquare, Send } from "lucide-react";

export function StaticContactForm({
  en,
  email,
  whatsapp,
}: {
  en: boolean;
  email: string;
  whatsapp: string;
}) {
  const [sent, setSent] = useState<"mail" | "wa" | null>(null);
  const [error, setError] = useState("");

  function collect(form: HTMLFormElement) {
    const data = new FormData(form);
    return {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      subject: String(data.get("subject") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };
  }

  function handle(channel: "mail" | "wa") {
    return (event: React.MouseEvent<HTMLButtonElement>) => {
      const form = event.currentTarget.closest("form");
      if (!form) return;
      const value = collect(form);
      if (!value.name || !value.email || !value.subject || !value.message) {
        event.preventDefault();
        setError(en ? "Name, email, subject and message are required." : "নাম, ইমেইল, বিষয় ও বার্তা লিখুন।");
        return;
      }
      setError("");
      const body = [
        `${en ? "Name" : "নাম"}: ${value.name}`,
        `${en ? "Email" : "ইমেইল"}: ${value.email}`,
        `${en ? "Mobile" : "মোবাইল"}: ${value.phone || "-"}`,
        "",
        value.message,
      ].join("\n");

      const target =
        channel === "mail"
          ? `mailto:${email}?subject=${encodeURIComponent(value.subject)}&body=${encodeURIComponent(body)}`
          : `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`*${value.subject}*\n\n${body}`)}`;

      setSent(channel);
      window.open(target, channel === "mail" ? "_self" : "_blank", "noopener");
    };
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-success/25 bg-success/10 p-8 text-center">
        <CheckCircle2 size={28} className="text-success" />
        <p className="text-sm font-semibold text-success">
          {sent === "mail"
            ? en
              ? "Your email app is opening with the message ready to send."
              : "আপনার ইমেইল অ্যাপে বার্তাটি সাজানো হয়েছে — শুধু পাঠিয়ে দিন।"
            : en
              ? "WhatsApp is opening with your message."
              : "WhatsApp-এ আপনার বার্তা সাজানো হয়েছে।"}
        </p>
        <button type="button" onClick={() => setSent(null)} className="text-xs font-semibold text-royal">
          {en ? "Write another message" : "আরেকটি বার্তা লিখুন"}
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Full name" : "পুরো নাম"} *</span>
          <input name="name" required className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Email" : "ইমেইল"} *</span>
          <input name="email" type="email" required className="input" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Mobile" : "মোবাইল নম্বর"}</span>
          <input name="phone" type="tel" placeholder="01XXXXXXXXX" className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Subject" : "বিষয়"} *</span>
          <input name="subject" required className="input" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Message" : "আপনার বার্তা"} *</span>
        <textarea name="message" rows={5} required className="input" />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={handle("mail")} className="btn btn-primary flex-1 justify-center">
          <Send size={15} /> {en ? "Send message" : "বার্তা পাঠান"}
        </button>
        <button type="button" onClick={handle("wa")} className="btn btn-secondary flex-1 justify-center">
          <MessageSquare size={15} /> WhatsApp
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-[0.7rem] text-muted">
        <Mail size={12} />
        {en
          ? `The message opens in your own email app addressed to ${email}.`
          : `বার্তাটি আপনার ইমেইল অ্যাপে ${email} ঠিকানায় খুলবে।`}
      </p>
    </form>
  );
}
