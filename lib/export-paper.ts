import { PAPER_HEIGHT, PAPER_MARGIN, PAPER_WIDTH } from "@/components/FormPaper";

/** Télécharge un Blob sous un nom de fichier. */
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const SCALE = 2; // 2 pixels écran = 1 pixel d'image : texte net à l'impression

// Image transparente de remplacement : si une image (lien externe, sceau…) ne se charge pas, l'export continue sans elle.
const BLANK_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

async function renderCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import("html-to-image");
  return toCanvas(el, { pixelRatio: SCALE, backgroundColor: "#ffffff", cacheBust: true, imagePlaceholder: BLANK_PIXEL });
}

/** Coupe le document en pages Letter, de préférence entre deux lignes (jamais au milieu d'un champ). */
export function planPages(rows: { top: number; bottom: number }[], totalHeight: number): { from: number; to: number }[] {
  const usable = PAPER_HEIGHT - 2 * PAPER_MARGIN;
  const pages: { from: number; to: number }[] = [];
  let from = 0;
  let limit = PAPER_HEIGHT - PAPER_MARGIN; // la 1re page contient déjà sa marge haute
  while (from < totalHeight - 1) {
    if (totalHeight <= limit) {
      pages.push({ from, to: totalHeight });
      break;
    }
    const fitting = rows.map((r) => r.bottom).filter((b) => b <= limit && b > from + 1);
    const to = fitting.length ? Math.max(...fitting) : limit; // ligne plus haute qu'une page : coupe franche
    pages.push({ from, to });
    const nextTops = rows.map((r) => r.top).filter((t) => t >= to - 1);
    from = nextTops.length ? Math.min(...nextTops) : totalHeight;
    limit = from + usable;
  }
  return pages;
}

/** Découpe le rendu complet en pages Letter (une image canvas par page), avec « Page i / n » en bas si plusieurs pages. */
function slicePages(el: HTMLElement, canvas: HTMLCanvasElement): HTMLCanvasElement[] {
  const box = el.getBoundingClientRect();
  const rows = [...el.querySelectorAll<HTMLElement>("[data-row]")].map((r) => {
    const b = r.getBoundingClientRect();
    return { top: b.top - box.top, bottom: b.bottom - box.top };
  });
  const pages = planPages(rows, el.scrollHeight);
  const ratio = canvas.width / PAPER_WIDTH;
  return pages.map((page, index) => {
    const slice = document.createElement("canvas");
    slice.width = PAPER_WIDTH * ratio;
    slice.height = PAPER_HEIGHT * ratio;
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    const sy = page.from * ratio;
    const sh = Math.min((page.to - page.from) * ratio, canvas.height - sy);
    const dy = index === 0 ? 0 : PAPER_MARGIN * ratio;
    ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, dy, canvas.width, sh);
    if (pages.length > 1) {
      ctx.fillStyle = "#555";
      ctx.font = `${11 * ratio}px Arial, Helvetica, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${index + 1} / ${pages.length}`, slice.width / 2, slice.height - 20 * ratio);
    }
    return slice;
  });
}

/** PNG : une image par page (le navigateur peut demander d'autoriser plusieurs téléchargements). */
export async function downloadPng(el: HTMLElement, baseName: string) {
  const canvas = await renderCanvas(el);
  const pages = slicePages(el, canvas);
  for (let i = 0; i < pages.length; i++) {
    const blob = await new Promise<Blob | null>((resolve) => pages[i].toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Impossible de créer l'image.");
    download(blob, pages.length > 1 ? `${baseName}-page-${i + 1}.png` : `${baseName}.png`);
    if (i < pages.length - 1) await new Promise((r) => setTimeout(r, 400));
  }
}

export async function downloadPdf(el: HTMLElement, baseName: string) {
  const canvas = await renderCanvas(el);
  const { jsPDF } = await import("jspdf");
  const pages = slicePages(el, canvas);
  const pdf = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pages.forEach((slice, index) => {
    if (index > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH, undefined, "FAST");
  });
  pdf.save(`${baseName}.pdf`);
}

export function fileBaseName(title: string, id: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return `${slug || "report"}-${id.slice(0, 8)}`;
}
