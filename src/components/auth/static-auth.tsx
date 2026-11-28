"use client";

import { useState } from "react";
import { AlertCircle, Loader2, LogIn, UserPlus } from "lucide-react";
import { Input, Label } from "@/components/ui/primitives";
import { loginUser, registerUser, routePrefix } from "@/lib/local-auth";

type Labels = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  consent: string;
  submit: string;
  invalid: string;
  exists: string;
  required: string;
  emailInvalid: string;
  phoneInvalid: string;
  min: string;
  mismatch: string;
  consentRequired: string;
};

function go(next?: string) {
  window.location.href = next ? `${routePrefix()}${next}` : `${routePrefix()}/my-account/`;
}

export function StaticLoginForm({ labels, next }: { labels: Labels; next?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");

    if (!email.includes("@")) return setError(labels.emailInvalid);
    if (password.length < 1) return setError(labels.required);

    setPending(true);
    setError("");
    const result = await loginUser(email, password);
    if (!result.ok) {
      setPending(false);
      setError(result.error === "invalid_credentials" ? labels.invalid : result.error);
      return;
    }
    go(next);
  }

  return (
    <form onSubmit={onSubmit} data-allow-submit className="space-y-4" noValidate>
      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div>
        <Label htmlFor="email" required>{labels.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div>
        <Label htmlFor="password" required>{labels.password}</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
        {labels.submit}
      </button>
    </form>
  );
}

export function StaticRegisterForm({ labels }: { labels: Labels }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirmPassword") || "");
    const consent = data.get("consent");

    if (name.length < 2) return setError(labels.required);
    if (!email.includes("@")) return setError(labels.emailInvalid);
    if (!/^01\d{9}$/.test(phone.replace(/[^0-9]/g, "").slice(-11))) return setError(labels.phoneInvalid);
    if (password.length < 8) return setError(labels.min);
    if (password !== confirm) return setError(labels.mismatch);
    if (!consent) return setError(labels.consentRequired);

    setPending(true);
    setError("");
    const result = await registerUser({ name, email, phone, password });
    if (!result.ok) {
      setPending(false);
      setError(result.error === "email_exists" ? labels.exists : result.error);
      return;
    }
    go();
  }

  return (
    <form onSubmit={onSubmit} data-allow-submit className="space-y-4" noValidate>
      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div>
        <Label htmlFor="name" required>{labels.name}</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email" required>{labels.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="phone" required>{labels.phone}</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="01XXXXXXXXX" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="password" required>{labels.password}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>
        <div>
          <Label htmlFor="confirmPassword" required>{labels.confirmPassword}</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <input type="checkbox" name="consent" className="mt-0.5 size-4 rounded border-line" />
        <span>{labels.consent}</span>
      </label>

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        {labels.submit}
      </button>
    </form>
  );
}
