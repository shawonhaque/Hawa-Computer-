"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileDown, Images, Loader2, Trash2 } from "lucide-react";
import {
  PAGE_SIZES,
  buildImagePdf,
  fitInside,
  formatBytes,
  imageFileToJpeg,
  type PageSizeKey,
} from "@/lib/pdf";

type Item = {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
};

export function PdfBuilder({ en }: { en: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeKey>("a4");
  const [margin, setMargin] = useState(18);
  const [quality, setQuality] = useState(0.85);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const label = useMemo(
    () => ({
      add: en ? "Choose images" : "ছবি বাছাই করুন",
      empty: en ? "No images yet — pick a few JPG or PNG files." : "এখনো কোনো ছবি নেই — JPG বা PNG ফাইল বাছাই করুন।",
      page: en ? "Page size" : "পেজ সাইজ",
      margin: en ? "Margin" : "মার্জিন",
      quality: en ? "Image quality" : "ছবির কোয়ালিটি",
      build: en ? "Make PDF" : "PDF বানান",
      download: en ? "Download PDF" : "PDF নামান",
      reset: en ? "Clear" : "সব মুছুন",
      up: en ? "Move up" : "উপরে",
      down: en ? "Move down" : "নিচে",
      remove: en ? "Remove" : "বাদ দিন",
      pages: en ? "pages" : "পৃষ্ঠা",
    }),
    [en],
  );

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError("");
      const accepted: Item[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const preview = URL.createObjectURL(file);
        try {
          const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
            image.onerror = () => reject(new Error("decode"));
            image.src = preview;
          });
          accepted.push({
            id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            preview,
            ...dims,
          });
        } catch {
          URL.revokeObjectURL(preview);
          setError(en ? "One file could not be read." : "একটি ফাইল পড়া যায়নি।");
        }
      }
      if (accepted.length) setItems((current) => [...current, ...accepted]);
    },
    [en],
  );

  const move = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (id: string) => {
    setItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const build = async () => {
    if (items.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const page = PAGE_SIZES[pageSize];
      const pages = [];
      for (const item of items) {
        const jpeg = await imageFileToJpeg(item.file, quality);
        const boxWidth = page.width - margin * 2;
        const boxHeight = page.height - margin * 2;
        const fitted = fitInside(jpeg.width, jpeg.height, boxWidth, boxHeight);
        pages.push({
          jpeg: jpeg.jpeg,
          imageWidth: jpeg.width,
          imageHeight: jpeg.height,
          pageWidth: page.width,
          pageHeight: page.height,
          drawWidth: Math.round(fitted.width * 100) / 100,
          drawHeight: Math.round(fitted.height * 100) / 100,
          x: Math.round((page.width - fitted.width) / 2),
          y: Math.round((page.height - fitted.height) / 2),
        });
      }
      const blob = buildImagePdf(pages);
      setResult({ url: URL.createObjectURL(blob), size: blob.size });
    } catch {
      setError(en ? "Could not build the PDF. Try smaller images." : "PDF তৈরি হয়নি। ছোট ছবি দিয়ে আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  };

  const clearAll = () => {
    items.forEach((item) => URL.revokeObjectURL(item.preview));
    setItems([]);
    setResult(null);
  };

  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <label className="card flex cursor-pointer flex-col items-center justify-center gap-2 border-dashed border-royal/40 p-8 text-center transition hover:border-royal">
          <Images size={26} className="text-royal" />
          <span className="text-sm font-semibold">{label.add}</span>
          <span className="text-xs text-muted">
            {en ? "JPG, PNG or WebP · files never leave your device" : "JPG, PNG বা WebP · ফাইল আপনার ডিভাইসেই থাকে"}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>

        {error ? <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}

        {items.length === 0 ? (
          <p className="card p-6 text-center text-sm text-muted">{label.empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={item.id} className="card flex items-center gap-3 p-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-royal-soft text-xs font-bold text-royal">
                  {index + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt="" className="size-12 shrink-0 rounded-lg border border-line object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.file.name}</p>
                  <p className="text-xs text-muted">
                    {item.width}×{item.height} · {formatBytes(item.file.size)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={label.up}
                    className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-royal disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label={label.down}
                    className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-royal disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={label.remove}
                    className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="card h-fit space-y-4 p-5">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{label.page}</span>
          <select value={pageSize} onChange={(event) => setPageSize(event.target.value as PageSizeKey)} className="input">
            {(Object.keys(PAGE_SIZES) as PageSizeKey[]).map((key) => (
              <option key={key} value={key}>
                {en ? PAGE_SIZES[key].labelEn : PAGE_SIZES[key].labelBn} ({PAGE_SIZES[key].width}×
                {PAGE_SIZES[key].height} pt)
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 flex justify-between text-xs font-semibold text-muted">
            <span>{label.margin}</span>
            <span>{margin} pt</span>
          </span>
          <input
            type="range"
            min={0}
            max={56}
            step={2}
            value={margin}
            onChange={(event) => setMargin(Number(event.target.value))}
            className="w-full accent-[var(--royal)]"
          />
        </label>

        <label className="block">
          <span className="mb-1 flex justify-between text-xs font-semibold text-muted">
            <span>{label.quality}</span>
            <span>{Math.round(quality * 100)}%</span>
          </span>
          <input
            type="range"
            min={0.4}
            max={0.95}
            step={0.05}
            value={quality}
            onChange={(event) => setQuality(Number(event.target.value))}
            className="w-full accent-[var(--royal)]"
          />
        </label>

        <div className="rounded-lg bg-surface-2/70 p-3 text-xs text-muted">
          {items.length} {label.pages} · {formatBytes(totalBytes)}
        </div>

        <button type="button" onClick={build} disabled={busy || items.length === 0} className="btn btn-primary w-full justify-center">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {label.build}
        </button>

        {result ? (
          <div className="space-y-2 rounded-lg border border-success/40 bg-success/10 p-3">
            <p className="text-xs font-semibold text-success">
              {en ? "PDF ready" : "PDF তৈরি"} · {formatBytes(result.size)}
            </p>
            <a href={result.url} download={`hawa-computer-${Date.now()}.pdf`} className="btn btn-primary btn-sm w-full justify-center">
              <Download size={14} /> {label.download}
            </a>
            <button type="button" onClick={clearAll} className="btn btn-secondary btn-sm w-full justify-center">
              {label.reset}
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
