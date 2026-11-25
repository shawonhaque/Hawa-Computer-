"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function AddToCart({
  product,
  label,
  addedLabel,
  outOfStockLabel,
  variant = "primary",
  size = "sm",
  withIcon = true,
  className,
}: {
  product: Omit<CartItem, "quantity">;
  label: string;
  addedLabel: string;
  outOfStockLabel?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md";
  withIcon?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  const { push } = useToast();
  const [done, setDone] = useState(false);
  const disabled = product.stock <= 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(product, 1);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
        push({ title: addedLabel, description: product.name, tone: "success" });
      }}
      className={cn("btn", `btn-${disabled ? "secondary" : variant}`, size === "sm" && "btn-sm", className)}
    >
      {withIcon ? done ? <Check size={15} /> : <ShoppingCart size={15} /> : null}
      {disabled ? outOfStockLabel ?? label : done ? addedLabel : label}
    </button>
  );
}
