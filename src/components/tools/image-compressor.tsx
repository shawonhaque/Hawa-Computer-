"use client";

import { useEffect, useState } from "react";
import { Download, ImageDown, Loader2, Trash2, Upload } from "lucide-react";
import { formatBytes } from "@/lib/pdf";

type Format = "image/jpeg" | "image/webp" | "image/png";

type Result = {
  id: string;
  name: string;
  originalSize: number;
  size: number;
  width: number;
  height: number;
  url: string;
  type: string;
};

const EXTENSION: Record<Format, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/png": "png",
};

export function ImageCompressor({ en }: { en: boolean }) {
  const [files, setFiles] = useState<File[]>([]);
  const [maxWidth, setMaxWidth] = useState(1600);
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    return () => results.forEach((item) => URL.revokeObjectURL(item.url));
  }, [results]);

  const text = {
    pick: en ? "Choose images" : "ছবি বাছাই করুন",
    hint: en ? "Batch process JPG, PNG, WebP, HEIC-free images" : "একসাথে অনেক ছবি — JPG, PNG, WebP",
    width: en ? "Max width (px, 0 = keep)" : "সর্বোচ্চ প্রস্থ (px, ০ = অপরিবর্তিত)",
    quality: en ? "Quality" : "কোয়ালিটি",
    format: en ? "Output format" : "আউটপুট ফরম্যাট",
    run: en ? "Compress" : "ছবি ছোট করুন",
    clear: en ? "Clear" : "মুছুন",
    empty: en ? "Nothing selected yet." : "এখনো কিছু বাছাই করা হয়নি।",
    saved: en ? "saved" : "কমেছে",
    bigger: en ? "bigger" : "বেড়েছে",
  };

  const run = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError("");
    const next: Result[] = [];
    try {
      for (const file of files) {
        const url = URL.createObjectURL(file);
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("decode"));
          img.src = url;
        });
        const scale = maxWidth > 0 ? Math.min(1, maxWidth / image.naturalWidth) : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        if (format === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, format, format === "image/png" ? undefined : quality),
        );
        if (!blob) continue;
        next.push({
          id: `${file.name}-${Math.random().toString(36).slice(2, 8)}`,
          name: `${file.name.replace(/\.[^.]+$/, "")}.${EXTENSION[format]}`,
          originalSize: file.size,
          size: blob.size,
          width: canvas.width,
          height: canvas.height,
          url: URL.createObjectURL(blob),
          type: format,
        });
      }
      setResults((current) => {
        current.forEach((item) => URL.revokeObjectURL(item.url));
        return next;
      });
    } catch {
      setError(en ? "One image could not be processed." : "একটি ছবি প্রসেস হয়নি।");
    } finally {
      setBusy(false);
    }
  };

  const saved = results.reduce((sum, item) => sum + Math.max(0, item.originalSize - item.size), 0);

  return (
    <div className="space-y-4">
      <label className="card flex cursor-pointer flex-col items-center justify-center gap-2 border-dashed border-royal/40 p-8 text-center transition hover:border-royal">
        <Upload size={24} className="text-royal" />
        <span className="text-sm font-semibold">{text.pick}</span>
        <span className="text-xs text-muted">{text.hint}</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            setFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </label>

      {error ? <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}

      <div className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{text.width}</span>
          <input
            type="number"
            min={0}
            step={50}
            value={maxWidth}
            onChange={(event) => setMaxWidth(Math.max(0, Number(event.target.value)))}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 flex justify-between text-xs font-semibold text-muted">
            <span>{text.quality}</span>
            <span>{Math.round(quality * 100)}%</span>
          </span>
          <input
            type="range"
            min={0.3}
            max={0.95}
            step={0.05}
            value={quality}
            onChange={(event) => setQuality(Number(event.target.value))}
            className="w-full accent-[var(--royal)]"
            disabled={format === "image/png"}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{text.format}</span>
          <select value={format} onChange={(event) => setFormat(event.target.value as Format)} className="input">
            <option value="image/jpeg">JPG</option>
            <option value="image/webp">WebP</option>
            <option value="image/png">PNG</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="button" onClick={run} disabled={busy || files.length === 0} className="btn btn-primary flex-1 justify-center">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ImageDown size={16} />}
            {text.run}
          </button>
          <button
            type="button"
            onClick={() => {
              setFiles([]);
              setResults((current) => {
                current.forEach((item) => URL.revokeObjectURL(item.url));
                return [];
              });
            }}
            className="btn btn-secondary justify-center"
            aria-label={text.clear}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {files.length > 0 ? (
        <p className="text-xs text-muted">
          {files.length} {en ? "file(s) ready" : "টি ফাইল তৈরি"} · {formatBytes(files.reduce((sum, file) => sum + file.size, 0))}
        </p>
      ) : (
        <p className="text-xs text-muted">{text.empty}</p>
      )}

      {results.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
            <span>
              {results.length} {en ? "images" : "টি ছবি"}
            </span>
            <span className="text-success">
              {formatBytes(saved)} {text.saved}
            </span>
          </div>
          <ul className="divide-y divide-line">
            {results.map((item) => {
              const delta = item.originalSize - item.size;
              const percent = item.originalSize ? Math.round((delta / item.originalSize) * 100) : 0;
              return (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="size-12 shrink-0 rounded-lg border border-line object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.width}×{item.height} · {formatBytes(item.originalSize)} → {formatBytes(item.size)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold ${delta >= 0 ? "text-success" : "text-danger"}`}>
                    {delta >= 0 ? `−${percent}%` : `+${Math.abs(percent)}%`}
                  </span>
                  <a href={item.url} download={item.name} className="btn btn-secondary btn-sm shrink-0">
                    <Download size={14} />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
