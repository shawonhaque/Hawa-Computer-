"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { formatTaka } from "@/lib/utils";
import type { Locale } from "@/lib/dictionaries";

export function CartView({
  locale,
  labels,
}: {
  locale: Locale;
  labels: {
    empty: string;
    emptyBody: string;
    browse: string;
    quantity: string;
    remove: string;
    subtotal: string;
    delivery: string;
    checkout: string;
    continue: string;
    deliveryNote: string;
  };
}) {
  const { items, ready, setQuantity, remove, subtotal } = useCart();

  if (!ready) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={22} />}
        title={labels.empty}
        body={labels.emptyBody}
        action={<Link href="/shop" className="btn btn-primary btn-sm">{labels.browse}</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.productId} className="card flex items-center gap-3 p-3">
            <Link href={`/shop/${item.slug}`} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-royal">
              <ShoppingBag size={22} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/shop/${item.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-royal">{item.name}</Link>
              <p className="mt-0.5 text-xs text-muted">{formatTaka(item.price, locale)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" className="btn btn-secondary btn-icon" aria-label="Decrease" onClick={() => setQuantity(item.productId, item.quantity - 1)}>
                <Minus size={13} />
              </button>
              <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
              <button type="button" className="btn btn-secondary btn-icon" aria-label="Increase" onClick={() => setQuantity(item.productId, item.quantity + 1)}>
                <Plus size={13} />
              </button>
            </div>
            <p className="hidden w-20 text-right text-sm font-bold sm:block">{formatTaka(item.price * item.quantity, locale)}</p>
            <button type="button" className="btn btn-ghost btn-icon text-danger" aria-label={labels.remove} onClick={() => remove(item.productId)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <Link href="/shop" className="inline-flex text-sm font-semibold text-royal">← {labels.continue}</Link>
      </div>

      <aside className="card h-fit p-5">
        <h2 className="text-base font-semibold">{labels.subtotal}</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">{labels.subtotal}</span>
            <span className="font-semibold">{formatTaka(subtotal, locale)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{labels.delivery}</span>
            <span className="text-xs text-muted">{labels.deliveryNote}</span>
          </div>
        </div>
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{labels.subtotal}</span>
            <span className="text-xl font-bold text-royal">{formatTaka(subtotal, locale)}</span>
          </div>
        </div>
        <Link href="/checkout" className="btn btn-primary mt-5 w-full">{labels.checkout}</Link>
      </aside>
    </div>
  );
}
