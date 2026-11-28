"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ImagePlus, Loader2, RotateCw, Sparkles, Trash2 } from "lucide-react";

const PRESETS = [
  { id: "passport", bn: "পাসপোর্ট ৪০×৫০", en: "Passport 40×50", w: 472, h: 591 },
  { id: "visa", bn: "ভিসা ৩৫×৪৫", en: "Visa 35×45", w: 413, h: 531 },
  { id: "nid", bn: "এনআইডি ২৫×৩০", en: "NID 25×30", w: 295, h: 354 },
  { id: "stamp", bn: "স্ট্যাম্প ২০×২৫", en: "Stamp 20×25", w: 236, h: 295 },
] as const;

type Preset = (typeof PRESETS)[number];

export default function PhotoEditorPage() {
  const bn = true;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [hasImage, setHasImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [padding, setPadding] = useState(0);
  const [rotation, setRotation] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = preset.w;
    canvas.height = preset.h;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, preset.w, preset.h);

    const img = imgRef.current;
    if (!img) return;

    const pad = Math.round((preset.w * padding) / 100);
    const boxW = preset.w - pad * 2;
    const boxH = preset.h - pad * 2;
    const rotated = rotation % 180 !== 0;
    const sourceW = rotated ? img.height : img.width;
    const sourceH = rotated ? img.width : img.height;

    const scale = Math.max(boxW / sourceW, boxH / sourceH) * zoom;
    const drawW = sourceW * scale;
    const drawH = sourceH * scale;
    const centerX = preset.w / 2 + (offsetX / 100) * Math.max(0, (drawW - boxW) / 2);
    const centerY = preset.h / 2 + (offsetY / 100) * Math.max(0, (drawH - boxH) / 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(pad, pad, boxW, boxH);
    ctx.clip();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [preset, zoom, offsetX, offsetY, brightness, contrast, saturation, padding, rotation]);

  useEffect(() => {
    draw();
  }, [draw]);

  const loadFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setHasImage(true);
      setBusy(false);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setRotation(0);
    };
    img.onerror = () => setBusy(false);
    img.src = url;
  }, []);

  const saveBlob = (canvas: HTMLCanvasElement, name: string) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    }, "image/jpeg", 0.94);
  };

  const downloadSingle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    out.getContext("2d")?.drawImage(canvas, 0, 0);
    saveBlob(out, `hawa-${preset.id}-photo.jpg`);
  };

  const downloadSheet = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sheet = document.createElement("canvas");
    sheet.width = 1800;
    sheet.height = 1200;
    const ctx = sheet.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sheet.width, sheet.height);

    const gap = 24;
    const cols = Math.max(1, Math.floor((sheet.width - gap) / (canvas.width + gap)));
    const rows = Math.max(1, Math.floor((sheet.height - gap) / (canvas.height + gap)));
    const totalW = cols * canvas.width + (cols - 1) * gap;
    const totalH = rows * canvas.height + (rows - 1) * gap;
    const startX = (sheet.width - totalW) / 2;
    const startY = (sheet.height - totalH) / 2;

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = startX + c * (canvas.width + gap);
        const y = startY + r * (canvas.height + gap);
        ctx.drawImage(canvas, x, y);
        ctx.strokeStyle = "#d4d4d8";
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 0.5, y - 0.5, canvas.width + 1, canvas.height + 1);
      }
    }
    saveBlob(sheet, `hawa-${preset.id}-print-sheet-4x6.jpg`);
  };

  const reset = () => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setPadding(0);
    setRotation(0);
  };

  const removeImage = () => {
    imgRef.current = null;
    setHasImage(false);
    reset();
    draw();
  };

  return (
    <div className="bg-[#faf9fe]">
      <div className="container-page py-6 sm:py-10">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm font-semibold text-royal">
          <ArrowLeft size={15} /> {bn ? "সব টুলস" : "All tools"}
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-royal">
              {bn ? "ফটো এডিটর" : "Photo editor"}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              {bn ? "পাসপোর্ট সাইজ ছবি, এক ক্লিকে" : "Passport size photo, in one click"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {bn
                ? "ছবি আপলোড করুন, সাইজ বেছে নিন, উজ্জ্বলতা ঠিক করুন — তারপর প্রিন্ট-রেডি JPG নামিয়ে নিন। ফাইল আপনার ব্রাউজারেই থাকে, কোথাও আপলোড হয় না।"
                : "Upload a photo, pick the size, tune the light and download a print-ready JPG. Files stay in your browser."}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-primary btn-sm">
              <ImagePlus size={15} /> {bn ? "ছবি আপলোড" : "Upload photo"}
            </button>
            {hasImage ? (
              <button type="button" onClick={removeImage} className="btn btn-ghost btn-sm">
                <Trash2 size={15} /> {bn ? "মুছুন" : "Remove"}
              </button>
            ) : null}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => loadFile(event.target.files?.[0])}
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div
            className="card grid place-items-center p-4 sm:p-6"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              loadFile(event.dataTransfer.files?.[0]);
            }}
          >
            {hasImage ? (
              <div className="w-full">
                <canvas
                  ref={canvasRef}
                  className="mx-auto h-auto w-full max-w-[380px] rounded-lg border border-line shadow-sm"
                />
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={downloadSingle} className="btn btn-primary btn-sm">
                    <Download size={15} /> {bn ? "JPG ডাউনলোড" : "Download JPG"}
                  </button>
                  <button type="button" onClick={downloadSheet} className="btn btn-ghost btn-sm">
                    <Download size={15} /> {bn ? "৪×৬ প্রিন্ট শিট" : "4×6 print sheet"}
                  </button>
                  <button type="button" onClick={() => setRotation((value) => (value + 90) % 360)} className="btn btn-ghost btn-sm">
                    <RotateCw size={15} /> {bn ? "ঘোরান" : "Rotate"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="grid w-full place-items-center gap-3 rounded-xl border-2 border-dashed border-line-strong px-6 py-16 text-center transition hover:border-royal"
              >
                {busy ? <Loader2 size={28} className="animate-spin text-royal" /> : <ImagePlus size={28} className="text-royal" />}
                <span className="text-sm font-semibold">{bn ? "ছবি টেনে এনে ছাড়ুন বা ক্লিক করুন" : "Drag a photo here or click"}</span>
                <span className="text-xs text-muted">{bn ? "JPG / PNG — সর্বোচ্চ ১০ MB" : "JPG / PNG — up to 10 MB"}</span>
              </button>
            )}
          </div>

          <div className="card space-y-5 p-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{bn ? "সাইজ" : "Size"}</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreset(item)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      preset.id === item.id
                        ? "border-royal bg-royal-soft text-royal"
                        : "border-line text-muted hover:border-royal"
                    }`}
                  >
                    {bn ? item.bn : item.en}
                  </button>
                ))}
              </div>
            </div>

            <Slider label={bn ? "জুম" : "Zoom"} value={zoom} min={1} max={3} step={0.01} onChange={setZoom} />
            <Slider label={bn ? "ডানে-বামে" : "Left / right"} value={offsetX} min={-100} max={100} step={1} onChange={setOffsetX} />
            <Slider label={bn ? "উপরে-নিচে" : "Up / down"} value={offsetY} min={-100} max={100} step={1} onChange={setOffsetY} />
            <Slider label={bn ? "উজ্জ্বলতা" : "Brightness"} value={brightness} min={50} max={160} step={1} onChange={setBrightness} />
            <Slider label={bn ? "কনট্রাস্ট" : "Contrast"} value={contrast} min={50} max={160} step={1} onChange={setContrast} />
            <Slider label={bn ? "রঙের গাঢ়ত্ব" : "Saturation"} value={saturation} min={0} max={200} step={1} onChange={setSaturation} />
            <Slider label={bn ? "সাদা বর্ডার" : "White border"} value={padding} min={0} max={15} step={1} onChange={setPadding} />

            <button type="button" onClick={reset} className="btn btn-ghost btn-sm w-full justify-center">
              {bn ? "রিসেট" : "Reset"}
            </button>

            <div className="rounded-lg bg-surface-2 p-3 text-[0.72rem] leading-relaxed text-muted">
              <Sparkles size={13} className="mr-1 inline text-royal" />
              {bn
                ? "টিপস: ছবি ৩০০ DPI তে তৈরি হয়, তাই প্রিন্টে ঝকঝকে আসবে। চোখ-কান সমান রাখতে জুম ও উপরে-নিচে স্লাইডার ব্যবহার করুন।"
                : "Tip: output is rendered at 300 DPI for crisp printing. Use zoom and the up/down slider to keep eyes level."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-semibold text-muted">
        {label}
        <span className="text-royal">{step < 1 ? value.toFixed(2) : Math.round(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[var(--royal)]"
      />
    </label>
  );
}
