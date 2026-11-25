"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { createShopOrder } from "@/actions/orders";
import { Input, Label, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatTaka } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/dictionaries";

export function CheckoutForm({
  locale,
  labels,
  deliveryInside,
  deliveryOutside,
  freeDeliveryAbove,
  defaultName,
  defaultPhone,
}: {
  locale: Locale;
  labels: {
    receiver: string;
    phone: string;
    address: string;
    city: string;
    zone: string;
    inside: string;
    outside: string;
    notes: string;
    coupon: string;
    apply: string;
    payment: string;
    placeOrder: string;
    submitting: string;
    empty: string;
    browse: string;
    items: string;
    subtotal: string;
    delivery: string;
    discount: string;
    total: string;
    freeDelivery: string;
    cash: string;
    cod: string;
  };
  deliveryInside: number;
  deliveryOutside: number;
  freeDeliveryAbove: number;
  defaultName?: string;
  defaultPhone?: string;
}) {
  const { items, subtotal, ready } = useCart();
  const [zone, setZone] = useState<"INSIDE" | "OUTSIDE">("INSIDE");
  const [method, setMethod] = useState("BKASH");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const baseDelivery = zone === "INSIDE" ? deliveryInside : deliveryOutside;
  const delivery = subtotal >= freeDeliveryAbove ? 0 : baseDelivery;
  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount + delivery);

  function applyCoupon() {
    setCouponError(null);
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    // Client-side preview only; the server re-validates the coupon on submit.
    if (code === "WELCOME10" && subtotal >= 500) {
      setAppliedCoupon({ code, discount: Math.round(subtotal * 0.1) });
    } else {
      setAppliedCoupon(null);
      setCouponError(locale === "bn" ? "কুপনটি সঠিক নয় বা শর্ত পূরণ হয়নি" : "Coupon is invalid or conditions are not met");
    }
  }

  if (!ready) return <div className="skeleton h-40 w-full" />;

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-muted">{labels.empty}</p>
        <Link href="/shop" className="btn btn-primary btn-sm mt-4">{labels.browse}</Link>
      </div>
    );
  }

  const methods = [
    { value: "BKASH", label: "bKash" },
    { value: "NAGAD", label: "Nagad" },
    { value: "ROCKET", label: "Rocket" },
    { value: "CASH", label: labels.cash },
    { value: "COD", label: labels.cod },
  ];

  return (
    <form action={createShopOrder} className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity })))} />
      <input type="hidden" name="coupon" value={appliedCoupon?.code ?? ""} />

      <div className="card space-y-4 p-5">
        <h2 className="text-base font-semibold">{labels.receiver}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="receiverName" required>{labels.receiver}</Label>
            <Input id="receiverName" name="receiverName" defaultValue={defaultName} required autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="phone" required>{labels.phone}</Label>
            <Input id="phone" name="phone" defaultValue={defaultPhone} required type="tel" placeholder="01XXXXXXXXX" autoComplete="tel" />
          </div>
        </div>
        <div>
          <Label htmlFor="address" required>{labels.address}</Label>
          <Textarea id="address" name="address" rows={2} required autoComplete="street-address" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="city" required>{labels.city}</Label>
            <Input id="city" name="city" required autoComplete="address-level2" />
          </div>
          <div>
            <Label required>{labels.zone}</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["INSIDE", "OUTSIDE"] as const).map((option) => (
                <label
                  key={option}
                  className={cn(
                    "cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition",
                    zone === option ? "border-royal bg-royal-soft text-royal" : "border-line-strong bg-surface text-muted",
                  )}
                >
                  <input type="radio" name="zone" value={option} checked={zone === option} onChange={() => setZone(option)} className="sr-only" />
                  {option === "INSIDE" ? labels.inside : labels.outside}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="notes">{labels.notes}</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
        <div>
          <Label htmlFor="coupon">{labels.coupon}</Label>
          <div className="flex gap-2">
            <Input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="WELCOME10" />
            <button type="button" className="btn btn-secondary btn-sm shrink-0" onClick={applyCoupon}>{labels.apply}</button>
          </div>
          {appliedCoupon ? (
            <p className="mt-1 text-xs font-medium text-success">{appliedCoupon.code} — {formatTaka(appliedCoupon.discount, locale)}</p>
          ) : null}
          {couponError ? <p className="field-error">{couponError}</p> : null}
        </div>

        <div>
          <Label required>{labels.payment}</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {methods.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium transition",
                  method === option.value ? "border-royal bg-royal-soft text-royal" : "border-line-strong bg-surface text-muted",
                )}
              >
                <input type="radio" name="paymentMethod" value={option.value} checked={method === option.value} onChange={() => setMethod(option.value)} className="sr-only" />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <aside className="card h-fit p-5">
        <h2 className="text-base font-semibold">{labels.items}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-2">
              <span className="min-w-0 truncate text-muted">{item.name} × {item.quantity}</span>
              <span className="shrink-0 font-medium">{formatTaka(item.price * item.quantity, locale)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{labels.subtotal}</dt>
            <dd>{formatTaka(subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{labels.delivery}</dt>
            <dd>{delivery === 0 ? <span className="text-success">{labels.freeDelivery}</span> : formatTaka(delivery, locale)}</dd>
          </div>
          {discount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted">{labels.discount}</dt>
              <dd className="text-success">−{formatTaka(discount, locale)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-semibold">{labels.total}</span>
          <span className="text-xl font-bold text-royal">{formatTaka(total, locale)}</span>
        </div>
        <SubmitButton className="mt-5 w-full" size="lg" pendingLabel={labels.submitting}>{labels.placeOrder}</SubmitButton>
      </aside>
    </form>
  );
}
