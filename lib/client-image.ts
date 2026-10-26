/** Réduit une image dans le navigateur (≤ 1280 px, JPEG) avant l'envoi : photos de téléphone comprises. */
export async function shrinkImage(file: File, maxSide = 1280, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image illisible.");
  ctx.fillStyle = "#fff"; // les PNG transparents deviennent blancs
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Image illisible.");
  return new File([blob], "image.jpg", { type: "image/jpeg" });
}
