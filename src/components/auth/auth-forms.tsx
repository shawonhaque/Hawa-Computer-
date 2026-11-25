"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, LogIn, UserPlus } from "lucide-react";
import { login, register, type AuthState } from "@/actions/auth";
import { Input, Label } from "@/components/ui/primitives";

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
  rateLimited: string;
  suspended: string;
  setup: string;
};

function errorText(code: string | undefined, labels: Labels) {
  switch (code) {
    case "invalid_credentials":
      return labels.invalid;
    case "email_exists":
      return labels.exists;
    case "rate_limited":
      return labels.rateLimited;
    case "account_suspended":
      return labels.suspended;
    case "setup_incomplete":
      return labels.setup;
    default:
      return code ?? "";
  }
}

function fieldError(code: string | undefined, labels: Labels) {
  if (!code) return undefined;
  if (code === "invalid_phone" || code === "invalid_string") return labels.phoneInvalid;
  if (code === "invalid_email" || code === "invalid_format") return labels.emailInvalid;
  if (code === "password_min") return labels.min;
  if (code === "password_mismatch") return labels.mismatch;
  if (code === "consent_required") return labels.consentRequired;
  return labels.required;
}

export function LoginForm({ labels, next }: { labels: Labels; next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, null);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state?.error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{errorText(state.error, labels)}</span>
        </div>
      ) : null}

      <div>
        <Label htmlFor="email" required>{labels.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!state?.fieldErrors?.email} />
        {state?.fieldErrors?.email ? <p className="field-error">{fieldError(state.fieldErrors.email, labels)}</p> : null}
      </div>

      <div>
        <Label htmlFor="password" required>{labels.password}</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!state?.fieldErrors?.password} />
        {state?.fieldErrors?.password ? <p className="field-error">{fieldError(state.fieldErrors.password, labels)}</p> : null}
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
        {labels.submit}
      </button>
    </form>
  );
}

export function RegisterForm({ labels }: { labels: Labels }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(register, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{errorText(state.error, labels)}</span>
        </div>
      ) : null}

      <div>
        <Label htmlFor="name" required>{labels.name}</Label>
        <Input id="name" name="name" autoComplete="name" required aria-invalid={!!fe.name} />
        {fe.name ? <p className="field-error">{fieldError(fe.name, labels)}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email" required>{labels.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!fe.email} />
          {fe.email ? <p className="field-error">{fieldError(fe.email, labels)}</p> : null}
        </div>
        <div>
          <Label htmlFor="phone" required>{labels.phone}</Label>
          <Input id="phone" name="phone" type="tel" placeholder="01XXXXXXXXX" autoComplete="tel" required aria-invalid={!!fe.phone} />
          {fe.phone ? <p className="field-error">{fieldError(fe.phone, labels)}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="password" required>{labels.password}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={!!fe.password} />
          {fe.password ? <p className="field-error">{fieldError(fe.password, labels)}</p> : null}
        </div>
        <div>
          <Label htmlFor="confirmPassword" required>{labels.confirmPassword}</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required aria-invalid={!!fe.confirmPassword} />
          {fe.confirmPassword ? <p className="field-error">{fieldError(fe.confirmPassword, labels)}</p> : null}
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-muted">
        <input type="checkbox" name="consent" className="checkbox" required />
        <span>{labels.consent}</span>
      </label>
      {fe.consent ? <p className="field-error">{fieldError(fe.consent, labels)}</p> : null}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        {labels.submit}
      </button>
    </form>
  );
}
