"use client";

import { useEffect, useState } from "react";

const USERS_KEY = "hc_users";
const SESSION_KEY = "hc_session";
const ORDERS_KEY = "hc_orders";
const EVENT = "hc-auth-change";

export type LocalUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
};

export type LocalSession = { userId: string; name: string; email: string; phone: string };

export type LocalOrder = {
  id: string;
  code: string;
  userId: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  delivery: number;
  total: number;
  name: string;
  phone: string;
  address: string;
  note: string;
  payment: string;
  status: string;
  createdAt: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
}

async function hashPassword(password: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getUsers(): LocalUser[] {
  return readJson<LocalUser[]>(USERS_KEY, []);
}

export function getSession(): LocalSession | null {
  return readJson<LocalSession | null>(SESSION_KEY, null);
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ ok: true; user: LocalUser } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const users = getUsers();
  if (users.some((user) => user.email === email)) return { ok: false, error: "email_exists" };

  const user: LocalUser = {
    id: `u_${Date.now().toString(36)}`,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    passwordHash: await hashPassword(input.password, email),
    createdAt: new Date().toISOString(),
  };
  writeJson(USERS_KEY, [...users, user]);
  writeJson(SESSION_KEY, { userId: user.id, name: user.name, email: user.email, phone: user.phone });
  return { ok: true, user };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ ok: true; user: LocalUser } | { ok: false; error: string }> {
  const target = email.trim().toLowerCase();
  const user = getUsers().find((item) => item.email === target);
  if (!user) return { ok: false, error: "invalid_credentials" };
  const hash = await hashPassword(password, user.email);
  if (hash !== user.passwordHash) return { ok: false, error: "invalid_credentials" };
  writeJson(SESSION_KEY, { userId: user.id, name: user.name, email: user.email, phone: user.phone });
  return { ok: true, user };
}

export function logoutUser() {
  writeJson(SESSION_KEY, null);
}

export function updateProfile(input: { name?: string; phone?: string }) {
  const session = getSession();
  if (!session) return;
  const users = getUsers().map((user) =>
    user.id === session.userId
      ? { ...user, name: input.name?.trim() || user.name, phone: input.phone?.trim() || user.phone }
      : user,
  );
  writeJson(USERS_KEY, users);
  const current = users.find((user) => user.id === session.userId);
  if (current) {
    writeJson(SESSION_KEY, { userId: current.id, name: current.name, email: current.email, phone: current.phone });
  }
}

export function getOrders(userId?: string): LocalOrder[] {
  const orders = readJson<LocalOrder[]>(ORDERS_KEY, []);
  const list = userId ? orders.filter((order) => order.userId === userId) : orders;
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function placeOrder(order: Omit<LocalOrder, "id" | "code" | "createdAt" | "status">) {
  const orders = readJson<LocalOrder[]>(ORDERS_KEY, []);
  const record: LocalOrder = {
    ...order,
    id: `o_${Date.now().toString(36)}`,
    code: `HC-${Math.floor(100000 + Math.random() * 900000)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  writeJson(ORDERS_KEY, [...orders, record]);
  return record;
}

export function useLocalSession() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(getSession());
    setReady(true);
    const sync = () => setSession(getSession());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { session, ready };
}

// The static build is served from a sub-path (e.g. /Hawa-Computer-), so client-side
// redirects must reuse the prefix Next already wrote into its own asset URLs.
export function routePrefix() {
  const fromEnv = process.env.NEXT_PUBLIC_ROUTE_PREFIX || process.env.NEXT_PUBLIC_BASE_PATH;
  if (fromEnv) return fromEnv;
  if (typeof document === "undefined") return "";
  const script = document.querySelector('script[src*="/_next/"]')?.getAttribute("src") || "";
  const index = script.indexOf("/_next/");
  return index > 0 ? script.slice(0, index) : "";
}

export const STATIC_MODE = process.env.NEXT_PUBLIC_STATIC_MODE === "1";
