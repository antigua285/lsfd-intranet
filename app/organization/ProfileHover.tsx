"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/Avatar";

export type ProfileCardData = {
  firstName: string;
  lastName: string;
  grade: string;
  station: string;
  phone: string | null;
  avatarUrl: string | null;
  /** Poste occupé dans l'organigramme, ex. "Battalion Chief" (peut être vide) */
  role: string;
  /** Intitulé de la ligne, ex. "ADMINISTRATIVE SECTION" */
  unit: string;
};

const CARD_WIDTH = 288;
const GAP = 6;
const MARGIN = 8;
const CLOSE_DELAY_MS = 150;

/**
 * Entoure le nom d'un titulaire : au survol (souris) ou au clic / toucher /
 * touche Entrée, une fiche de profil s'affiche.
 *  - survol : la fiche se ferme quand on s'éloigne ;
 *  - clic : la fiche reste ouverte jusqu'à un nouveau clic, un clic ailleurs ou Échap.
 * La fiche est affichée dans le <body> pour ne jamais être coupée par le tableau.
 */
export function ProfileHover({ data, children }: { data: ProfileCardData; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardId = useId();

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  const closeNow = useCallback(() => {
    cancelClose();
    setOpen(false);
    setPinned(false);
    setPosition(null);
  }, [cancelClose]);
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(closeNow, CLOSE_DELAY_MS);
  }, [cancelClose, closeNow]);

  // Place la fiche sous le nom (ou au-dessus s'il manque de la place), dans l'écran.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !cardRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const cardHeight = cardRef.current.offsetHeight;
    const left = Math.max(MARGIN, Math.min(trigger.left, window.innerWidth - CARD_WIDTH - MARGIN));
    let top = trigger.bottom + GAP;
    if (top + cardHeight > window.innerHeight - MARGIN && trigger.top - GAP - cardHeight > MARGIN) {
      top = trigger.top - GAP - cardHeight;
    }
    setPosition({ top, left });
  }, [open]);

  // Fermeture : Échap, clic ailleurs, défilement ou redimensionnement.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNow();
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !cardRef.current?.contains(target)) closeNow();
    };
    const onViewportChange = () => closeNow();
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [open, closeNow]);

  useEffect(() => cancelClose, [cancelClose]);

  const fullName = `${data.firstName} ${data.lastName}`;
  const dialPhone = data.phone?.replace(/[^0-9+]/g, "") ?? "";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? cardId : undefined}
        title={`Voir le profil de ${fullName}`}
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={() => {
          if (!pinned) scheduleClose();
        }}
        onClick={() => {
          if (open && pinned) {
            closeNow();
          } else {
            cancelClose();
            setOpen(true);
            setPinned(true);
          }
        }}
        className="inline-flex items-center gap-1.5 text-left cursor-pointer rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c00d0d]"
      >
        {children}
      </button>

      {open &&
        createPortal(
          <div
            ref={cardRef}
            id={cardId}
            role="dialog"
            aria-label={`Profil de ${fullName}`}
            onMouseEnter={cancelClose}
            onMouseLeave={() => {
              if (!pinned) scheduleClose();
            }}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              width: CARD_WIDTH,
              visibility: position ? "visible" : "hidden",
            }}
            className="fixed z-50 bg-white text-slate-800 border border-slate-300 rounded shadow-lg font-['Calibri','Arial',sans-serif]"
          >
            <div className="flex items-center gap-4 p-4 border-b border-slate-100">
              <Avatar
                src={data.avatarUrl}
                firstName={data.firstName}
                lastName={data.lastName}
                className="w-20 h-20 text-2xl"
              />
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-slate-900 leading-tight break-words">
                  {fullName}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">{data.grade}</p>
              </div>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-4 py-3 text-[13px]">
              <dt className="text-slate-500">Grade</dt>
              <dd className="font-bold">{data.grade}</dd>
              <dt className="text-slate-500">Station</dt>
              <dd className="font-bold">{data.station}</dd>
              <dt className="text-slate-500">Téléphone</dt>
              <dd className="font-bold">
                {data.phone ? (
                  dialPhone ? (
                    <a href={`tel:${dialPhone}`} className="text-[#0d2644] hover:underline">
                      {data.phone}
                    </a>
                  ) : (
                    data.phone
                  )
                ) : (
                  <span className="font-normal italic text-slate-400">Non renseigné</span>
                )}
              </dd>
              <dt className="text-slate-500">Poste</dt>
              <dd className="font-bold">
                {data.role || <span className="font-normal italic text-slate-400">—</span>}
                <span className="block font-normal text-[12px] text-slate-500">{data.unit}</span>
              </dd>
            </dl>
          </div>,
          document.body
        )}
    </>
  );
}
