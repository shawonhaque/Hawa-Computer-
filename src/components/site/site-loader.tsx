"use client";

import { useEffect, useState } from "react";

export function SiteLoader({ label }: { label: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const done = () => setHidden(true);
    if (document.readyState === "complete") {
      const timer = window.setTimeout(done, 550);
      return () => window.clearTimeout(timer);
    }
    window.addEventListener("load", done, { once: true });
    const fallback = window.setTimeout(done, 2600);
    return () => {
      window.removeEventListener("load", done);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`site-loader ${hidden ? "site-loader--hidden" : ""}`}
    >
      <div className="site-loader__mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-loader.webp" alt="" width={480} height={368} />
      </div>
      <span className="site-loader__bar">
        <span />
      </span>
      <p className="site-loader__label">{label}</p>
    </div>
  );
}
