"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Package, Save, ShoppingBag, UserRound } from "lucide-react";
import { getOrders, logoutUser, routePrefix, updateProfile, useLocalSession, type LocalOrder } from "@/lib/local-auth";

export default function MyAccountPage() {
  const pathname = usePathname();
  const en = /(^|\/)en(\/|$)/.test(pathname || "");
  const { session, ready } = useLocalSession();
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!session) return;
    setOrders(getOrders(session.userId));
    setName(session.name);
    setPhone(session.phone);
  }, [session]);

  if (!ready) {
    return <div className="container-page py-16 text-center text-sm text-muted">{en ? "Loading…" : "লোড হচ্ছে…"}</div>;
  }

  if (!session) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-14">
        <div className="card w-full max-w-md p-6 text-center sm:p-8">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-royal-soft text-royal">
            <UserRound size={22} />
          </span>
          <h1 className="mt-4 text-xl font-bold">{en ? "Log in to continue" : "চালিয়ে যেতে লগইন করুন"}</h1>
          <p className="mt-2 text-sm text-muted">
            {en ? "Log in to see your orders and profile." : "অর্ডার ও প্রোফাইল দেখতে লগইন করুন।"}
          </p>
          <div className="mt-6 grid gap-2">
            <Link href="/login" className="btn btn-primary justify-center">{en ? "Log in" : "লগইন"}</Link>
            <Link href="/register" className="btn btn-secondary justify-center">{en ? "Create account" : "রেজিস্ট্রেশন"}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-royal">{en ? "My account" : "আমার অ্যাকাউন্ট"}</p>
          <h1 className="mt-1 text-2xl font-extrabold">{session.name}</h1>
          <p className="text-sm text-muted">{session.email} · {session.phone}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/shop" className="btn btn-secondary btn-sm">
            <ShoppingBag size={15} /> {en ? "Shop" : "শপ"}
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              logoutUser();
              window.location.href = `${routePrefix()}/`;
            }}
          >
            <LogOut size={15} /> {en ? "Log out" : "লগআউট"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Package size={16} className="text-royal" /> {en ? "My orders" : "আমার অর্ডার"}
          </h2>
          {orders.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-muted">
              {en
                ? "No orders yet. Add something to the cart and check out."
                : "এখনো কোনো অর্ডার নেই। কার্টে পণ্য নিয়ে চেকআউট করুন।"}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {orders.map((order) => (
                <li key={order.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold">{order.code}</p>
                    <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-success">
                      {order.status === "pending" ? (en ? "Pending" : "অপেক্ষমাণ") : order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(order.createdAt).toLocaleString(en ? "en-GB" : "bn-BD")} · {order.payment}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.name}`} className="flex justify-between gap-2">
                        <span className="truncate">{item.name} × {item.quantity}</span>
                        <span className="shrink-0 font-semibold">৳{item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 flex justify-between border-t border-line pt-2 text-sm font-bold">
                    <span>{en ? "Total" : "মোট"}</span>
                    <span className="text-royal">৳{order.total}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <UserRound size={16} className="text-royal" /> {en ? "Profile" : "প্রোফাইল"}
          </h2>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Name" : "নাম"}</span>
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">{en ? "Mobile" : "মোবাইল"}</span>
              <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <button
              type="button"
              className="btn btn-primary btn-sm w-full justify-center"
              onClick={() => {
                updateProfile({ name, phone });
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
              }}
            >
              <Save size={15} /> {saved ? (en ? "Saved" : "সেভ হয়েছে") : en ? "Save" : "সেভ করুন"}
            </button>
          </div>
          <p className="mt-4 text-[0.7rem] leading-relaxed text-muted">
            {en
              ? "This preview keeps your account and orders in this browser only."
              : "এই প্রিভিউতে অ্যাকাউন্ট ও অর্ডার শুধু আপনার ব্রাউজারে সংরক্ষিত থাকে।"}
          </p>
        </div>
      </div>
    </div>
  );
}
