export type PdfPageInput = {
  jpeg: Uint8Array;
  imageWidth: number;
  imageHeight: number;
  pageWidth: number;
  pageHeight: number;
  drawWidth: number;
  drawHeight: number;
  x: number;
  y: number;
};

const encoder = new TextEncoder();

function bytes(text: string) {
  return encoder.encode(text);
}

/** Builds a PDF where every page holds one JPEG, using the DCTDecode filter. */
export function buildImagePdf(pages: PdfPageInput[]): Blob {
  if (pages.length === 0) throw new Error("no pages");

  const parts: BlobPart[] = [];
  const offsets: number[] = [];
  let offset = 0;

  const push = (chunk: Uint8Array) => {
    parts.push(chunk as unknown as BlobPart);
    offset += chunk.length;
  };

  const writeObject = (id: number, body: string) => {
    offsets[id] = offset;
    push(bytes(`${id} 0 obj\n${body}\nendobj\n`));
  };

  push(bytes("%PDF-1.4\n"));
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const kids = pages.map((_, index) => `${3 + index * 3} 0 R`).join(" ");
  writeObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  writeObject(2, `<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>`);

  pages.forEach((page, index) => {
    const pageId = 3 + index * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;

    writeObject(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.pageWidth} ${page.pageHeight}] ` +
        `/Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );

    const content = `q\n${page.drawWidth} 0 0 ${page.drawHeight} ${page.x} ${page.y} cm\n/Im0 Do\nQ`;
    writeObject(contentId, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

    offsets[imageId] = offset;
    push(
      bytes(
        `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.imageWidth} /Height ${page.imageHeight} ` +
          `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
      ),
    );
    push(page.jpeg);
    push(bytes("\nendstream\nendobj\n"));
  });

  const maxId = 2 + pages.length * 3;
  const xrefStart = offset;
  let xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= maxId; id += 1) {
    xref += `${String(offsets[id] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  push(bytes(xref));
  push(bytes(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`));

  return new Blob(parts, { type: "application/pdf" });
}

export const PAGE_SIZES = {
  a4: { width: 595, height: 842, labelBn: "A4", labelEn: "A4" },
  letter: { width: 612, height: 792, labelBn: "Letter", labelEn: "Letter" },
  legal: { width: 612, height: 1008, labelBn: "Legal", labelEn: "Legal" },
} as const;

export type PageSizeKey = keyof typeof PAGE_SIZES;

export function decodeJpeg(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image decode failed"));
    image.src = source;
  });
}

/** Fits an image inside a box, keeping the aspect ratio. */
export function fitInside(imageWidth: number, imageHeight: number, boxWidth: number, boxHeight: number) {
  const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  return { width: imageWidth * scale, height: imageHeight * scale };
}

export async function imageFileToJpeg(file: File, quality = 0.9) {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    return {
      jpeg: decodeJpeg(canvas.toDataURL("image/jpeg", quality)),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
