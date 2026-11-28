"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Eraser, Loader2, PenTool, Upload } from "lucide-react";

const PRESETS = [
  { id: "epassport", bn: "ই-পাসপোর্ট ৩০০×৮০", en: "e-Passport 300×80", w: 300, h: 80 },
  { id: "nid", bn: "এনআইডি ৩০০×৬০", en: "NID 300×60", w: 300, h: 60 },
  { id: "form", bn: "ফরম ৪০০×১০০", en: "Form 400×100", w: 400, h: 100 },
] as const;

type PresetId = (typeof PRESETS)[number]["id"];

/** Otsu threshold on the luminance histogram: keeps the ink, drops the paper. */
function otsuThreshold(data: Uint8ClampedArray) {
  const histogram = new Array(256).fill(0) as number[];
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[lum] += 1;
  }
  const total = data.length / 4;
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * histogram[i];
  let sumB = 0;
  let weightB = 0;
  let best = 0;
  let bestVariance = -1;
  for (let t = 0; t < 256; t += 1) {
    weightB += histogram[t];
    if (weightB === 0) continue;
    const weightF = total - weightB;
    if (weightF === 0) break;
    sumB += t * histogram[t];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const variance = weightB * weightF * (meanB - meanF) ** 2;
    if (variance > bestVariance) {
      bestVariance = variance;
      best = t;
    }
  }
  return Math.min(245, Math.max(80, best));
}

export function SignatureCutter({ en }: { en: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<{ width: number; height: number; data: Uint8ClampedArray } | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [threshold, setThreshold] = useState(180);
  const [autoThreshold, setAutoThreshold] = useState(true);
  const [preset, setPreset] = useState<PresetId>("epassport");
  const [error, setError] = useState("");

  const text = {
    pick: en ? "Choose a signature photo" : "স্বাক্ষরের ছবি বাছাই করুন",
    hint: en ? "Shoot on plain paper, then let the tool erase the background" : "সাদা কাগজে ছবি তুলুন, টুল ব্যাকগ্রাউন্ড মুছে দেবে",
    threshold: en ? "Background cut-off" : "ব্যাকগ্রাউন্ড কাট-অফ",
    size: en ? "Output size" : "আউটপুট সাইজ",
    download: en ? "Download PNG" : "PNG নামান",
    auto: en ? "Auto detect" : "অটো ডিটেক্ট",
  };

  const render = () => {
    const canvas = canvasRef.current;
    const source = sourceRef.current;
    if (!canvas || !source) return;
    const presetValue = PRESETS.find((entry) => entry.id === preset) ?? PRESETS[0];
    const { data } = source;
    const width = source.width;
    const height = source.height;

    const working = document.createElement("canvas");
    working.width = width;
    working.height = height;
    const ctx = working.getContext("2d");
    if (!ctx) return;
    const copy = ctx.createImageData(width, height);
    copy.data.set(data);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const lum = 0.299 * copy.data[index] + 0.587 * copy.data[index + 1] + 0.114 * copy.data[index + 2];
        const alpha = Math.max(0, Math.min(255, ((threshold - lum) / 42) * 255));
        copy.data[index + 3] = alpha;
        if (alpha > 40) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    ctx.putImageData(copy, 0, 0);

    canvas.width = presetValue.w;
    canvas.height = presetValue.h;
    const target = canvas.getContext("2d");
    if (!target) return;
    target.clearRect(0, 0, canvas.width, canvas.height);
    if (maxX < 0) return;

    const pad = 4;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(width - cropX, maxX - minX + pad * 2);
    const cropH = Math.min(height - cropY, maxY - minY + pad * 2);
    const scale = Math.min(presetValue.w / cropW, presetValue.h / cropH);
    const drawW = cropW * scale;
    const drawH = cropH * scale;
    target.drawImage(
      working,
      cropX,
      cropY,
      cropW,
      cropH,
      (presetValue.w - drawW) / 2,
      (presetValue.h - drawH) / 2,
      drawW,
      drawH,
    );
  };

  useEffect(() => {
    if (loaded) render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, threshold, preset]);

  const load = async (file: File) => {
    setBusy(true);
    setError("");
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("decode"));
        img.src = url;
      });
      const limit = 1400;
      const scale = Math.min(1, limit / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.round(image.naturalWidth * scale);
      const height = Math.round(image.naturalHeight * scale);
      const scratch = document.createElement("canvas");
      scratch.width = width;
      scratch.height = height;
      const ctx = scratch.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(image, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height);
      sourceRef.current = { width, height, data: new Uint8ClampedArray(data.data) };
      if (autoThreshold) setThreshold(otsuThreshold(data.data));
      setLoaded(true);
      render();
    } catch {
      setError(en ? "That file could not be read." : "ফাইলটি পড়া যায়নি।");
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
    }
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `signature-${preset}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    }, "image/png");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="card flex w-full cursor-pointer flex-col items-center justify-center gap-2 border-dashed border-royal/40 p-8 text-center transition hover:border-royal"
        >
          {busy ? <Loader2 size={24} className="animate-spin text-royal" /> : <Upload size={24} className="text-royal" />}
          <span className="text-sm font-semibold">{text.pick}</span>
          <span className="text-xs text-muted">{text.hint}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void load(file);
            event.target.value = "";
          }}
        />

        {error ? <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}

        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <PenTool size={15} className="text-royal" />
            {en ? "Result" : "ফলাফল"}
          </div>
          <div
            className="mt-3 grid place-items-center rounded-xl border border-line p-4"
            style={{
              backgroundImage:
                "linear-gradient(45deg, rgba(120,120,140,0.12) 25%, transparent 25%, transparent 75%, rgba(120,120,140,0.12) 75%), linear-gradient(45deg, rgba(120,120,140,0.12) 25%, transparent 25%, transparent 75%, rgba(120,120,140,0.12) 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
            }}
          >
            <canvas ref={canvasRef} className="max-h-40 w-auto max-w-full" />
          </div>
          {!loaded ? (
            <p className="mt-3 text-center text-xs text-muted">{en ? "Upload a signature to preview." : "স্বাক্ষরের ছবি দিলে এখানে দেখা যাবে।"}</p>
          ) : null}
        </div>
      </div>

      <aside className="card h-fit space-y-4 p-5">
        <label className="flex items-center justify-between gap-2 text-xs font-semibold text-muted">
          <span>{text.auto}</span>
          <input
            type="checkbox"
            checked={autoThreshold}
            onChange={(event) => {
              setAutoThreshold(event.target.checked);
              if (event.target.checked && sourceRef.current) setThreshold(otsuThreshold(sourceRef.current.data));
            }}
            className="size-4 accent-[var(--royal)]"
          />
        </label>

        <label className="block">
          <span className="mb-1 flex justify-between text-xs font-semibold text-muted">
            <span>{text.threshold}</span>
            <span>{threshold}</span>
          </span>
          <input
            type="range"
            min={90}
            max={245}
            step={1}
            value={threshold}
            disabled={!loaded}
            onChange={(event) => {
              setAutoThreshold(false);
              setThreshold(Number(event.target.value));
            }}
            className="w-full accent-[var(--royal)]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{text.size}</span>
          <select value={preset} onChange={(event) => setPreset(event.target.value as PresetId)} className="input">
            {PRESETS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {en ? entry.en : entry.bn}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={download} disabled={!loaded} className="btn btn-primary w-full justify-center">
          <Download size={15} /> {text.download}
        </button>

        <p className="flex items-start gap-2 rounded-lg bg-surface-2/70 p-3 text-xs text-muted">
          <Eraser size={14} className="mt-0.5 shrink-0 text-royal" />
          {en
            ? "The background becomes transparent, so the signature sits cleanly on any form."
            : "ব্যাকগ্রাউন্ড স্বচ্ছ হয়ে যায়, তাই যেকোনো ফরমে স্বাক্ষর পরিষ্কার বসে।"}
        </p>
      </aside>
    </div>
  );
}
