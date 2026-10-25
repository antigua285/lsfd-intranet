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

async function renderCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import("html-to-image");
  return toCanvas(el, { pixelRatio: SCALE, backgroundColor: "#ffffff", cacheBust: true });
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

export async function downloadPng(el: HTMLElement, baseName: string) {
  const canvas = await renderCanvas(el);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Impossible de créer l'image.");
  download(blob, `${baseName}.png`);
}

export async function downloadPdf(el: HTMLElement, baseName: string) {
  const canvas = await renderCanvas(el);
  const { jsPDF } = await import("jspdf");
  const box = el.getBoundingClientRect();
  const rows = [...el.querySelectorAll<HTMLElement>("[data-row]")].map((r) => {
    const b = r.getBoundingClientRect();
    return { top: b.top - box.top, bottom: b.bottom - box.top };
  });
  const pages = planPages(rows, el.scrollHeight);
  const ratio = canvas.width / PAPER_WIDTH;

  const pdf = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  pages.forEach((page, index) => {
    if (index > 0) pdf.addPage();
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
