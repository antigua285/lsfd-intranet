"use client";

import { useState } from "react";

/** Aperçu d'une carte ; tant que l'image n'est pas déposée dans public/aviation/, un cadre indique le nom du fichier attendu. */
export function ChartThumb({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <div className="h-full w-full grid place-items-center bg-slate-100 text-[11px] text-slate-500 text-center px-3">Image manquante<br /><code>public{src}</code></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" ref={(el) => { if (el && el.complete && el.naturalWidth === 0) setBroken(true); }} onError={() => setBroken(true)} />;
}
