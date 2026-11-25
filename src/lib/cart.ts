"use client";

import { useEffect, useState } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
  stock: number;
  sku?: string;
};

const KEY = "hc_cart";
const EVENT = "hc-cart-change";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartItem[]).filter((i) => i && i.productId) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read());
    setReady(true);
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function add(item: Omit<CartItem, "quantity">, quantity = 1) {
    const current = read();
    const existing = current.find((i) => i.productId === item.productId);
    const next = existing
      ? current.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + quantity, Math.max(1, i.stock)) }
            : i,
        )
      : [...current, { ...item, quantity: Math.min(quantity, Math.max(1, item.stock)) }];
    write(next);
    setItems(next);
  }

  function setQuantity(productId: string, quantity: number) {
    const next = read()
      .map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, Math.max(1, i.stock))) }
          : i,
      )
      .filter((i) => i.quantity > 0);
    write(next);
    setItems(next);
  }

  function remove(productId: string) {
    const next = read().filter((i) => i.productId !== productId);
    write(next);
    setItems(next);
  }

  function clear() {
    write([]);
    setItems([]);
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return { items, ready, add, setQuantity, remove, clear, count, subtotal };
}
