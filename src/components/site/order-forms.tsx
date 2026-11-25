"use client";

import { useMemo, useState } from "react";
import { FileUp, Info, ShieldCheck } from "lucide-react";
import { createServiceOrder, submitPayment } from "@/actions/orders";
import { createApplication } from "@/actions/applications";
import { Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatTaka } from "@/lib/utils";
import type { Locale } from "@/lib/dictionaries";
import { cn } from "@/lib/utils";

export type FieldDef = {
  name: string;
  labelBn: string;
  labelEn: string;
  type: string;
  required: boolean;
  options?: string[];
};

function fieldLabel(field: FieldDef, locale: Locale) {
  return locale === "bn" ? field.labelBn : field.labelEn;
}

function DynamicField({ field, locale }: { field: FieldDef; locale: Locale }) {
  const label = fieldLabel(field, locale);
  const id = `field-${field.name}`;

  if (field.type === "textarea") {
    return (
      <div className="sm:col-span-2">
        <Label htmlFor={id} required={field.required}>{label}</Label>
        <Textarea id={id} name={field.name} required={field.required} rows={3} />
      </div>
    );
  }
  if (field.type === "select" && field.options?.length) {
    return (
      <div>
        <Label htmlFor={id} required={field.required}>{label}</Label>
        <Select id={id} name={field.name} required={field.required} defaultValue="">
          <option value="" disabled>—</option>
          {field.options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
      </div>
    );
  }
  return (
    <div>
      <Label htmlFor={id} required={field.required}>{label}</Label>
      <Input
        id={id}
        name={field.name}
        type={field.type === "date" ? "date" : field.type === "tel" ? "tel" : field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
        required={field.required}
      />
    </div>
  );
}

export function ServiceOrderForm({
  service,
  locale,
  labels,
  loggedIn,
}: {
  service: {
    id: string;
    slug: string;
    price: number;
    nameBn: string;
    nameEn: string;
    kind: string;
    requiresConsent: boolean;
    formFields: FieldDef[];
    documents: string[];
  };
  locale: Locale;
  labels: {
    quantity: string;
    total: string;
    instructions: string;
    pickup: string;
    delivery: string;
    address: string;
    upload: string;
    uploadHint: string;
    consent: string;
    submit: string;
    submitting: string;
    loginToOrder: string;
    sizeGuide: string;
  };
  loggedIn: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [delivery, setDelivery] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [consent, setConsent] = useState(!service.requiresConsent);

  const total = useMemo(() => service.price * Math.max(1, quantity), [quantity, service.price]);
  const name = locale === "bn" ? service.nameBn : service.nameEn;

  return (
    <form action={createServiceOrder} className="space-y-5" encType="multipart/form-data">
      <input type="hidden" name="serviceId" value={service.id} />
      <input type="hidden" name="slug" value={service.slug} />

      {service.formFields.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {service.formFields.map((field) => (
            <DynamicField key={field.name} field={field} locale={locale} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="quantity" required>{labels.quantity}</Label>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-secondary btn-sm h-10 w-10" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              max={500}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              className="text-center"
            />
            <button type="button" className="btn btn-secondary btn-sm h-10 w-10" onClick={() => setQuantity((q) => Math.min(500, q + 1))} aria-label="Increase">+</button>
          </div>
          <p className="mt-1 text-[0.7rem] text-muted">{labels.sizeGuide}</p>
        </div>

        <div>
          <Label required>{labels.delivery}</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["PICKUP", "DELIVERY"] as const).map((option) => (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                  delivery === option ? "border-royal bg-royal-soft text-royal" : "border-line-strong bg-surface text-muted",
                )}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={option}
                  checked={delivery === option}
                  onChange={() => setDelivery(option)}
                  className="sr-only"
                />
                {option === "PICKUP" ? labels.pickup : labels.delivery}
              </label>
            ))}
          </div>
        </div>
      </div>

      {delivery === "DELIVERY" ? (
        <div>
          <Label htmlFor="deliveryAddress" required>{labels.address}</Label>
          <Textarea id="deliveryAddress" name="deliveryAddress" rows={2} required />
        </div>
      ) : null}

      <div>
        <Label htmlFor="instructions">{labels.instructions}</Label>
        <Textarea id="instructions" name="instructions" rows={3} placeholder={labels.instructions} />
      </div>

      <div>
        <Label htmlFor="files">{labels.upload}</Label>
        <label
          htmlFor="files"
          className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-surface-2/60 px-4 py-6 text-center transition hover:border-royal/50"
        >
          <FileUp size={20} className="text-royal" />
          <span className="text-sm font-medium">{labels.upload}</span>
          <span className="text-[0.7rem] text-muted">{labels.uploadHint}</span>
        </label>
        <input id="files" name="files" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" />
      </div>

      <div className="rounded-xl border border-line bg-surface-2 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{labels.quantity} × {formatTaka(service.price, locale)}</span>
          <span className="text-lg font-bold text-royal">{formatTaka(total, locale)}</span>
        </div>
      </div>

      {service.requiresConsent ? (
        <label className="flex items-start gap-2 text-xs leading-relaxed text-muted">
          <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="checkbox" />
          <span>{labels.consent}</span>
        </label>
      ) : null}

      {loggedIn ? (
        <SubmitButton size="lg" className="w-full" pendingLabel={labels.submitting} disabled={!consent}>
          {labels.submit} — {name}
        </SubmitButton>
      ) : (
        <a href={`/login?next=${encodeURIComponent(`/services/${service.slug}`)}`} className="btn btn-primary btn-lg w-full">
          {labels.loginToOrder}
        </a>
      )}
    </form>
  );
}

export function ApplicationForm({
  service,
  locale,
  labels,
  loggedIn,
}: {
  service: {
    id: string;
    slug: string;
    nameBn: string;
    nameEn: string;
    price: number;
    formFields: FieldDef[];
    documents: string[];
    requiresConsent: boolean;
  };
  locale: Locale;
  labels: {
    documents: string;
    uploadDoc: string;
    note: string;
    consent: string;
    submit: string;
    submitting: string;
    loginToApply: string;
  };
  loggedIn: boolean;
}) {
  const [consent, setConsent] = useState(false);
  const name = locale === "bn" ? service.nameBn : service.nameEn;

  return (
    <form action={createApplication} className="space-y-5" encType="multipart/form-data">
      <input type="hidden" name="serviceId" value={service.id} />
      <input type="hidden" name="slug" value={service.slug} />

      <div className="grid gap-4 sm:grid-cols-2">
        {service.formFields.map((field) => (
          <DynamicField key={field.name} field={field} locale={locale} />
        ))}
      </div>

      {service.documents.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">{labels.documents}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {service.documents.map((doc, index) => (
              <div key={doc}>
                <Label htmlFor={`doc-${index}`}>{doc}</Label>
                <input
                  id={`doc-${index}`}
                  name={`doc:${doc}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="block w-full cursor-pointer rounded-xl border border-line-strong bg-surface px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-royal-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-royal"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <Label htmlFor="customerNote">{labels.note}</Label>
        <Textarea id="customerNote" name="customerNote" rows={3} />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-royal/20 bg-royal/5 p-3 text-xs leading-relaxed text-muted">
        <Info size={15} className="mt-0.5 shrink-0 text-royal" />
        <p>
          {locale === "bn"
            ? "আমরা একটি স্বাধীন সহায়তা কেন্দ্র। আবেদন সরকারি পোর্টালে জমা হয় এবং অনুমোদনের নিশ্চয়তা দেওয়া হয় না।"
            : "We are an independent assistance centre. Applications are submitted on official portals and approval is never guaranteed."}
        </p>
      </div>

      <label className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="checkbox" />
        <span>{labels.consent}</span>
      </label>

      {loggedIn ? (
        <SubmitButton size="lg" className="w-full" pendingLabel={labels.submitting} disabled={!consent}>
          {labels.submit} — {name}
        </SubmitButton>
      ) : (
        <a href={`/login?next=${encodeURIComponent(`/applications/${service.slug}`)}`} className="btn btn-primary btn-lg w-full">
          {labels.loginToApply}
        </a>
      )}
    </form>
  );
}

export function PaymentForm({
  labels,
  orderId,
  serviceOrderId,
  applicationId,
  amount,
  returnTo,
  methods,
}: {
  locale: Locale;
  labels: {
    method: string;
    sendTo: string;
    trxId: string;
    payerNumber: string;
    screenshot: string;
    submit: string;
    submitting: string;
    note: string;
    amount: string;
  };
  orderId?: string;
  serviceOrderId?: string;
  applicationId?: string;
  amount: number;
  returnTo: string;
  methods: { value: string; label: string; number?: string }[];
}) {
  const [method, setMethod] = useState(methods[0]?.value ?? "BKASH");
  const selected = methods.find((m) => m.value === method);

  return (
    <form action={submitPayment} className="space-y-4" encType="multipart/form-data">
      <input type="hidden" name="returnTo" value={returnTo} />
      {orderId ? <input type="hidden" name="orderId" value={orderId} /> : null}
      {serviceOrderId ? <input type="hidden" name="serviceOrderId" value={serviceOrderId} /> : null}
      {applicationId ? <input type="hidden" name="applicationId" value={applicationId} /> : null}

      <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/8 p-3 text-xs leading-relaxed text-muted">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-warning" />
        <p>{labels.note}</p>
      </div>

      <div>
        <Label required>{labels.method}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {methods.map((option) => (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium transition",
                method === option.value ? "border-royal bg-royal-soft text-royal" : "border-line-strong bg-surface text-muted",
              )}
            >
              <input
                type="radio"
                name="method"
                value={option.value}
                checked={method === option.value}
                onChange={() => setMethod(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {selected?.number ? (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
          <span className="text-muted">{labels.sendTo}: </span>
          <span className="font-semibold tracking-wide">{selected.number}</span>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="amount" required>{labels.amount}</Label>
          <Input id="amount" name="amount" type="number" min={1} defaultValue={amount} required />
        </div>
        <div>
          <Label htmlFor="trxId">{labels.trxId}</Label>
          <Input id="trxId" name="trxId" placeholder="e.g. 9F7A2B1C3D" />
        </div>
      </div>

      <div>
        <Label htmlFor="payerNumber">{labels.payerNumber}</Label>
        <Input id="payerNumber" name="payerNumber" type="tel" placeholder="01XXXXXXXXX" />
      </div>

      <div>
        <Label htmlFor="screenshot">{labels.screenshot}</Label>
        <input
          id="screenshot"
          name="screenshot"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full cursor-pointer rounded-xl border border-line-strong bg-surface px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-royal-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-royal"
        />
      </div>

      <SubmitButton className="w-full" pendingLabel={labels.submitting}>{labels.submit}</SubmitButton>
    </form>
  );
}
