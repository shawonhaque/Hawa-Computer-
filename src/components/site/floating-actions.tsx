"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Phone } from "lucide-react";

export function FloatingActions({
  phone,
  whatsapp,
  labels,
}: {
  phone: string;
  whatsapp: string;
  labels: { whatsapp: string; call: string; top: string };
}) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2.5 sm:bottom-5 sm:right-5">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={labels.top}
        title={labels.top}
        className={`grid size-10 place-items-center rounded-full border border-white/70 bg-white/70 text-[#4a4759] shadow-[0_14px_30px_-18px_rgba(29,27,49,0.6)] backdrop-blur transition-all duration-300 hover:text-royal ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <ArrowUp size={17} />
      </button>

      <a
        href={`tel:${phone.replace(/\s/g, "")}`}
        aria-label={labels.call}
        title={labels.call}
        className="group hidden items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-2.5 text-sm font-semibold text-[#4a4759] shadow-[0_14px_30px_-18px_rgba(29,27,49,0.6)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-royal sm:flex"
      >
        <Phone size={17} className="text-royal" />
        <span>{labels.call}</span>
      </a>

      {whatsapp ? (
        <a
          href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={labels.whatsapp}
          title={labels.whatsapp}
          className="flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_18px_36px_-16px_rgba(37,211,102,0.8)] transition hover:-translate-y-0.5 hover:scale-105"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.68-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.19 5.07 4.47.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.35c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.17 8.21Z" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
