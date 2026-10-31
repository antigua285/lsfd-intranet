"use client";

import { useState } from "react";

/** Logo d'une division ; tant que le fichier n'est pas déposé, un écusson avec les initiales le remplace. */
export function DivisionLogo({ src, initials, className = "w-16 h-16" }: { src: string; initials: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className={`${className} grid place-items-center rounded-full border-2 border-white/70 bg-white/10 text-white font-bold tracking-wider text-[15px]`} aria-hidden>
        {initials}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`${className} object-contain drop-shadow`}
      ref={(el) => { if (el && el.complete && el.naturalWidth === 0) setBroken(true); }}
      onError={() => setBroken(true)}
    />
  );
}
