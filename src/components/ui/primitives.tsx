import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("card", className)} {...props} />;
}

export function Label({ className, children, required, ...props }: ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label className={cn("label", className)} {...props}>
      {children}
      {required ? <span className="text-danger"> *</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("input", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("textarea", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn("select", className)} {...props}>
      {children}
    </select>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="field-error">{children}</p>;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center", className)}>
      {icon ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">{icon}</div> : null}
      <div>
        <p className="text-base font-semibold">{title}</p>
        {body ? <p className="mt-1 max-w-md text-sm text-muted">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} />;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", align === "center" && "sm:flex-col sm:items-center")}>
      <div className={cn("max-w-2xl", align === "center" && "text-center")}>
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-royal">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "royal",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "royal" | "cyan" | "success" | "warning" | "danger" | "navy";
}) {
  const toneMap = {
    royal: "from-royal/15 to-cyan/10 text-royal",
    cyan: "from-cyan/15 to-royal/10 text-cyan",
    success: "from-success/15 to-success/5 text-success",
    warning: "from-warning/15 to-warning/5 text-warning",
    danger: "from-danger/15 to-danger/5 text-danger",
    navy: "from-navy/10 to-royal/5 text-navy",
  } as const;
  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        {icon ? (
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br", toneMap[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Rating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
          fill={i < Math.round(value) ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth="1.6"
          className={i < Math.round(value) ? "text-warning" : "text-line-strong"}>
          <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3Z" />
        </svg>
      ))}
    </span>
  );
}

export function Prose({ html, className }: { html: string; className?: string }) {
  return <div className={cn("prose-cms", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
