"use client";

import { useState } from "react";

interface AvatarProps {
  src: string | null;
  firstName: string;
  lastName: string;
  /** Classes de taille, ex. "w-8 h-8 text-xs" */
  className?: string;
}

/** Photo de profil, avec les initiales si pas de photo ou si l'URL ne charge pas. */
export function Avatar({ src, firstName, lastName, className = "w-8 h-8 text-xs" }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const showImage = src !== null && failedSrc !== src;

  return (
    <div
      className={`bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-slate-600 font-bold overflow-hidden shrink-0 ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${firstName} ${lastName}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
