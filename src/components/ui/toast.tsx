"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info" | "warning";
type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };

const ToastContext = createContext<{ push: (t: Omit<ToastItem, "id">) => void } | null>(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: TriangleAlert,
};

const styles: Record<ToastTone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  error: "border-danger/30 bg-danger/10 text-danger",
  info: "border-royal/30 bg-royal/10 text-royal",
  warning: "border-warning/30 bg-warning/10 text-warning",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 5200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {items.map((toast) => {
          const Icon = icons[toast.tone];
          return (
            <div
              key={toast.id}
              role="status"
              className="toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-lg"
            >
              <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", styles[toast.tone])}>
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-0.5 text-xs text-muted">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setItems((prev) => prev.filter((t) => t.id !== toast.id))}
                className="rounded-md p-1 text-muted hover:bg-surface-2"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { push: () => undefined };
  return ctx;
}
