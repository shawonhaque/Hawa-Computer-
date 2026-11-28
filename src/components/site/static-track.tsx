"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Package, Search, Truck } from "lucide-react";
import { getOrders, useLocalSession, type LocalOrder } from "@/lib/local-auth";

const STEPS = [
  { id: "pending", bn: "অর্ডার গৃহীত", en: "Order received" },
  { id: "confirmed", bn: "নিশ্চিত হয়েছে", en: "Confirmed" },
  { id: "packed", bn: "প্যাকিং সম্পন্ন", en: "Packed" },
  { id: "shipped", bn: "ডেলিভারিতে", en: "Out for delivery" },
  { id: "delivered", bn: "ডেলিভারি সম্পন্ন", en: "Delivered" },
];

function digits(value: string) {
  return value.replace(/\D/g, "").replace(/^88/, "");
}

export function StaticTrack({ en }: { en: boolean }) {
  const { session } = useLocalSession();
  const orders = useMemo<LocalOrder[]>(() => (session ? getOrders(session.userId) : []), [session]);
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [found, setFound] = useState<LocalOrder | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("orderNo") ?? "";
    const tel = params.get("phone") ?? "";
    setOrderNo(code);
    setPhone(tel || session?.phone || "");
    if (code && (tel || session?.phone)) {
      const match = getOrders().find(
        (order) => order.code.toLowerCase() === code.trim().toLowerCase() && digits(order.phone) === digits(tel || session?.phone || ""),
      );
      setSearched(true);
      setFound(match ?? null);
    }
  }, [session]);

  function lookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = orderNo.trim().toLowerCase();
    const match = getOrders().find(
      (order) => order.code.toLowerCase() === code && digits(order.phone) === digits(phone),
    );
    setSearched(true);
    setFound(match ?? null);
  }

  const stepIndex = found ? Math.max(0, STEPS.findIndex((step) => step.id === found.status)) : 0;

  return (
    <>
      <form onSubmit={lookup} data-allow-submit className="card mx-auto max-w-xl space-y-4 p-5">
        <div>
          <label htmlFor="orderNo" className="label">{en ? "Order number" : "অর্ডার নম্বর"}</label>
          <input
            id="orderNo"
            name="orderNo"
            value={orderNo}
            onChange={(event) => setOrderNo(event.target.value)}
            required
            className="input"
            placeholder="HC-281146"
          />
        </div>
        <div>
          <label htmlFor="phone" className="label">{en ? "Mobile" : "মোবাইল নম্বর"}</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            className="input"
            placeholder="01XXXXXXXXX"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          <Search size={15} /> {en ? "Track order" : "অর্ডার ট্র্যাক করুন"}
        </button>
        <p className="text-center text-[0.7rem] text-muted">
          {en
            ? "Order details appear only when the order number and the mobile number used at checkout match."
            : "শুধু অর্ডার নম্বর ও চেকআউটে দেওয়া মোবাইল নম্বর মিললেই তথ্য দেখা যাবে।"}
        </p>
      </form>

      {orders.length > 0 ? (
        <div className="mx-auto mt-4 max-w-xl rounded-xl bg-surface-2 p-4">
          <p className="text-xs font-semibold text-muted">
            {en ? "Your recent orders" : "আপনার সাম্প্রতিক অর্ডার"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {orders.slice(0, 4).map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  setOrderNo(order.code);
                  setPhone(order.phone);
                  setSearched(true);
                  setFound(order);
                }}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold hover:border-royal hover:text-royal"
              >
                {order.code}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {searched && !found ? (
        <p className="mx-auto mt-6 max-w-xl rounded-xl border border-danger/25 bg-danger/10 p-3 text-center text-sm text-danger">
          {en
            ? "No order found for this number and mobile. Check both and try again."
            : "এই নম্বর ও মোবাইলে কোনো অর্ডার পাওয়া যায়নি। দুটোই মিলিয়ে আবার চেষ্টা করুন।"}
        </p>
      ) : null}

      {found ? (
        <section className="mx-auto mt-8 max-w-2xl space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">{en ? "Shop order" : "শপ অর্ডার"}</p>
                <p className="text-lg font-bold">{found.code}</p>
                <p className="text-xs text-muted">
                  {new Date(found.createdAt).toLocaleString(en ? "en-GB" : "bn-BD")}
                </p>
              </div>
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-success">
                {STEPS[stepIndex][en ? "en" : "bn"]}
              </span>
            </div>

            <ol className="mt-5 space-y-3 border-t border-line pt-4">
              {STEPS.map((step, index) => {
                const done = index <= stepIndex;
                return (
                  <li key={step.id} className="flex items-center gap-3 text-sm">
                    {done ? (
                      <CheckCircle2 size={16} className="shrink-0 text-success" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-muted/40" />
                    )}
                    <span className={done ? "font-medium" : "text-muted"}>{step[en ? "en" : "bn"]}</span>
                  </li>
                );
              })}
            </ol>

            <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              {found.items.map((item) => (
                <li key={`${found.id}-${item.name}`} className="flex justify-between gap-2">
                  <span className="text-muted">{item.name} × {item.quantity}</span>
                  <span className="font-medium">৳{item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-semibold">
              <span>{en ? "Total" : "মোট"}</span>
              <span className="text-royal">৳{found.total}</span>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted">
              <Truck size={14} className="mt-0.5 shrink-0" /> {found.address}
            </p>
          </div>

          <p className="flex items-center justify-center gap-2 text-xs text-muted">
            <Package size={14} />
            {en
              ? "Static preview: orders and status are stored in this browser only."
              : "স্ট্যাটিক প্রিভিউ: অর্ডার ও স্ট্যাটাস শুধু এই ব্রাউজারে সংরক্ষিত থাকে।"}
          </p>
        </section>
      ) : null}

      <p className="mt-8 text-center text-xs text-muted">
        {en ? "Need the full history?" : "পুরো হিস্ট্রি দেখতে?"}{" "}
        <Link href="/my-account" className="font-semibold text-royal">
          {en ? "My account" : "আমার অ্যাকাউন্ট"}
        </Link>
      </p>
    </>
  );
}
