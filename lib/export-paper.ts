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

/** Attend que les images d'une page soient chargées (ou en échec), 8 s au maximum. */
async function waitForImages(els: HTMLElement[]) {
  const imgs = els.flatMap((el) => [...el.querySelectorAll<HTMLImageElement>("img")]);
  imgs.forEach((img) => {
    img.loading = "eager";
  });
  const pending = imgs.filter((img) => !img.complete).map(
    (img) =>
      new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      })
  );
  if (pending.length) await Promise.race([Promise.all(pending), new Promise((r) => setTimeout(r, 8000))]);
  await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => undefined) : undefined)));
}

/** Rend une page (un élément Letter déjà découpé à l'écran) en canvas, avec « Page i / n » si plusieurs pages. */
async function renderPage(el: HTMLElement, index: number, total: number): Promise<HTMLCanvasElement> {
  const canvas = await renderCanvas(el);
  if (total > 1) {
    const ctx = canvas.getContext("2d")!;
    const ratio = canvas.width / PAPER_WIDTH;
    ctx.fillStyle = "#555";
    ctx.font = `${11 * ratio}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`Page ${index + 1} / ${total}`, canvas.width / 2, canvas.height - 20 * ratio);
  }
  return canvas;
}

/** PNG : une image par page (le navigateur peut demander d'autoriser plusieurs téléchargements). */
export async function downloadPng(pageEls: HTMLElement[], baseName: string) {
  await waitForImages(pageEls);
  for (let i = 0; i < pageEls.length; i++) {
    const canvas = await renderPage(pageEls[i], i, pageEls.length);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Impossible de créer l'image.");
    download(blob, pageEls.length > 1 ? `${baseName}-page-${i + 1}.png` : `${baseName}.png`);
    if (i < pageEls.length - 1) await new Promise((r) => setTimeout(r, 400));
  }
}

export async function downloadPdf(pageEls: HTMLElement[], baseName: string) {
  await waitForImages(pageEls);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  for (let i = 0; i < pageEls.length; i++) {
    const canvas = await renderPage(pageEls[i], i, pageEls.length); // une page à la fois : pas de canvas géant
    if (i > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, pageH, undefined, "FAST");
  }
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
