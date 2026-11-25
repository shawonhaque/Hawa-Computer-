"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-secondary btn-sm">
      <Printer size={14} /> {label}
    </button>
  );
}
