"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitContactMessage, type ContactState } from "@/actions/support";
import { Input, Label, Textarea } from "@/components/ui/primitives";

export function ContactForm({
  labels,
}: {
  labels: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    submit: string;
    success: string;
    error: string;
    invalidEmail: string;
    invalidPhone: string;
    required: string;
  };
}) {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(submitContactMessage, null);

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-success/25 bg-success/10 p-8 text-center">
        <CheckCircle2 size={28} className="text-success" />
        <p className="text-sm font-semibold text-success">{labels.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.error && state.error !== "invalid_input" ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger">{labels.error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" required>{labels.name}</Label>
          <Input id="name" name="name" required aria-invalid={!!state?.fieldErrors?.name} />
          {state?.fieldErrors?.name ? <p className="field-error">{labels.required}</p> : null}
        </div>
        <div>
          <Label htmlFor="email" required>{labels.email}</Label>
          <Input id="email" name="email" type="email" required aria-invalid={!!state?.fieldErrors?.email} />
          {state?.fieldErrors?.email ? <p className="field-error">{labels.invalidEmail}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">{labels.phone}</Label>
          <Input id="phone" name="phone" type="tel" placeholder="01XXXXXXXXX" aria-invalid={!!state?.fieldErrors?.phone} />
          {state?.fieldErrors?.phone ? <p className="field-error">{labels.invalidPhone}</p> : null}
        </div>
        <div>
          <Label htmlFor="subject" required>{labels.subject}</Label>
          <Input id="subject" name="subject" required aria-invalid={!!state?.fieldErrors?.subject} />
          {state?.fieldErrors?.subject ? <p className="field-error">{labels.required}</p> : null}
        </div>
      </div>

      <div>
        <Label htmlFor="message" required>{labels.message}</Label>
        <Textarea id="message" name="message" rows={5} required aria-invalid={!!state?.fieldErrors?.message} />
        {state?.fieldErrors?.message ? <p className="field-error">{labels.required}</p> : null}
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto">
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {labels.submit}
      </button>
    </form>
  );
}
