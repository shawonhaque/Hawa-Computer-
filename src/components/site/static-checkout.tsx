"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Copy, Loader2, LogIn, MessageCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { getSession, placeOrder, routePrefix } from "@/lib/local-auth";

const PAYMENTS = [
  { id: "cod", bn: "ক্যাশ অন ডেলিভারি", en: "Cash on delivery" },
  { id: "bkash", bn: "বিকাশ", en: "bKash" },
  { id: "nagad", bn: "নগদ", en: "Nagad" },
];

function whatsappLink(number: string, text: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function StaticCheckout({
  en,
  delivery = 0,
  whatsapp = "",
}: {
  en: boolean;
  delivery?: number;
  whatsapp?: string;
}) {
  const { items, subtotal, ready, clear } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ code: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const copySummary = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };
  const session = typeof window !== "undefined" ? getSession() : null;

  if (done) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <CheckCircle2 size={40} className="mx-auto text-success" />
        <h2 className="mt-4 text-xl font-bold">{en ? "Order placed" : "অর্ডার সম্পন্ন হয়েছে"}</h2>
        <p className="mt-2 text-sm text-muted">
          {en ? "Your order number is" : "আপনার অর্ডার নম্বর"} <strong className="text-royal">{done.code}</strong>
        </p>
        <div className="mt-6 grid gap-2">
          <p className="rounded-lg bg-warn/10 p-3 text-xs leading-relaxed text-warn">
            {en
              ? "This is the static preview, so the shop does not receive the order automatically. Send the summary on WhatsApp and we confirm it."
              : "এটি স্ট্যাটিক প্রিভিউ — অর্ডারটি দোকানে অটোমেটিক পৌঁছে না। নিচের বাটনে WhatsApp-এ সারসংক্ষেপ পাঠালেই আমরা কনফার্ম করব।"}
          </p>
          <a
            href={whatsappLink(whatsapp, done.message)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary justify-center"
          >
            <MessageCircle size={16} /> {en ? "Send on WhatsApp" : "WhatsApp-এ পাঠান"}
          </a>
          <button type="button" onClick={() => copySummary(done.message)} className="btn btn-secondary justify-center">
            {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
            {copied ? (en ? "Copied" : "কপি হয়েছে") : en ? "Copy the summary" : "সারসংক্ষেপ কপি করুন"}
          </button>
          <Link href={`/track?orderNo=${encodeURIComponent(done.code)}`} className="btn btn-secondary justify-center">{en ? "Track this order" : "অর্ডার ট্র্যাক করুন"}</Link>
          <Link href="/my-account" className="btn btn-secondary justify-center">{en ? "See my orders" : "আমার অর্ডার দেখুন"}</Link>
          <Link href="/shop" className="btn btn-secondary justify-center">{en ? "Continue shopping" : "আরও কেনাকাটা"}</Link>
        </div>
      </div>
    );
  }

  if (ready && items.length === 0) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <ShoppingBag size={36} className="mx-auto text-muted" />
        <p className="mt-4 text-sm text-muted">{en ? "Your cart is empty." : "আপনার কার্ট খালি।"}</p>
        <Link href="/shop" className="btn btn-primary mt-5 justify-center">{en ? "Browse shop" : "শপ দেখুন"}</Link>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const active = getSession();
    if (!active) {
      window.location.href = `${routePrefix()}/login/?next=%2Fcheckout`;
      return;
    }
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const address = String(data.get("address") || "").trim();
    if (!name || !phone || !address) {
      setError(en ? "Name, mobile and address are required." : "নাম, মোবাইল ও ঠিকানা দিতে হবে।");
      return;
    }
    const method = String(data.get("payment") || "cod");
    setPending(true);
    const order = placeOrder({
      userId: active.userId,
      items: items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
      subtotal,
      delivery,
      total: subtotal + delivery,
      name,
      phone,
      address,
      note: String(data.get("note") || ""),
      payment: PAYMENTS.find((payment) => payment.id === method)?.[en ? "en" : "bn"] ?? method,
    });
    const lines = [
      `${en ? "New order" : "নতুন অর্ডার"} — ${order.code}`,
      `${en ? "Name" : "নাম"}: ${name}`,
      `${en ? "Mobile" : "মোবাইল"}: ${phone}`,
      `${en ? "Address" : "ঠিকানা"}: ${address}`,
      `${en ? "Payment" : "পেমেন্ট"}: ${PAYMENTS.find((payment) => payment.id === method)?.[en ? "en" : "bn"] ?? method}`,
      "",
      ...items.map((item) => `• ${item.name} × ${item.quantity} — ৳${item.price * item.quantity}`),
      "",
      `${en ? "Subtotal" : "সাবটোটাল"}: ৳${subtotal}`,
      `${en ? "Delivery" : "ডেলিভারি"}: ৳${delivery}`,
      `${en ? "Total" : "মোট"}: ৳${subtotal + delivery}`,
    ];
    const note = String(data.get("note") || "").trim();
    if (note) lines.push("", `${en ? "Note" : "নোট"}: ${note}`);

    clear();
    setPending(false);
    setDone({ code: order.code, message: lines.join("\n") });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form onSubmit={onSubmit} data-allow-submit className="card space-y-4 p-5 sm:p-6">
        {error ? <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
        {!session ? (
          <p className="flex items-center gap-2 rounded-lg bg-royal-soft p-3 text-sm text-royal">
            <LogIn size={15} /> {en ? "You will be asked to log in first." : "চেকআউট করতে আগে লগইন করতে হবে।"}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Full name" : "পুরো নাম"}</span>
            <input name="name" className="input" defaultValue={session?.name ?? ""} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Mobile" : "মোবাইল"}</span>
            <input name="phone" className="input" defaultValue={session?.phone ?? ""} placeholder="01XXXXXXXXX" required />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Delivery address" : "ডেলিভারি ঠিকানা"}</span>
          <textarea name="address" className="input min-h-20" required />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Note (optional)" : "নোট (ঐচ্ছিক)"}</span>
          <input name="note" className="input" />
        </label>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-muted">{en ? "Payment method" : "পেমেন্ট মাধ্যম"}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {PAYMENTS.map((payment, index) => (
              <label
                key={payment.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm has-checked:border-royal has-checked:bg-royal-soft"
              >
                <input type="radio" name="payment" value={payment.id} defaultChecked={index === 0} />
                {en ? payment.en : payment.bn}
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center">
          {pending ? <Loader2 size={16} className="animate-spin" /> : null}
          {en ? "Place order" : "অর্ডার করুন"}
        </button>
      </form>

      <div className="card h-fit p-5">
        <h2 className="text-sm font-bold">{en ? "Order summary" : "অর্ডার সারাংশ"}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-2">
              <span className="truncate">{item.name} × {item.quantity}</span>
              <span className="shrink-0 font-semibold">৳{item.price * item.quantity}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <p className="flex justify-between"><span>{en ? "Subtotal" : "সাবটোটাল"}</span><span>৳{subtotal}</span></p>
          <p className="flex justify-between"><span>{en ? "Delivery" : "ডেলিভারি"}</span><span>৳{delivery}</span></p>
          <p className="flex justify-between text-base font-bold"><span>{en ? "Total" : "মোট"}</span><span className="text-royal">৳{subtotal + delivery}</span></p>
        </div>
      </div>
    </div>
  );
}
