"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileQuestion, X } from "lucide-react";

export function DocChecklist({
  title,
  documents,
  label,
  heading,
  note,
}: {
  title: string;
  documents: string[];
  label: string;
  heading: string;
  note: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!documents.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-royal/25 bg-white/70 px-2.5 py-1 text-[0.7rem] font-semibold text-royal transition hover:bg-white"
      >
        <FileQuestion size={12} /> {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-[#0b1020]/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/70 bg-white/95 p-5 shadow-[0_40px_80px_-40px_rgba(11,16,32,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-royal">{heading}</p>
                <h3 className="mt-1 text-base font-bold leading-snug">{title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-royal-soft hover:text-royal"
              >
                <X size={16} />
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {documents.map((document) => (
                <li key={document} className="flex items-start gap-2 rounded-xl bg-royal-soft/60 px-3 py-2 text-sm">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-royal" />
                  <span>{document}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs leading-relaxed text-muted">{note}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
