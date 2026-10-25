"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { levelStyle } from "@/lib/org-levels";
import { MAX_DEPTH, type OrgRow } from "@/lib/org-types";
import {
  addOrgNodeAction,
  assignOrgHolderAction,
  deleteOrgNodeAction,
  importOrgTemplateAction,
  moveOrgNodeAction,
  saveOrgNodeAction,
  type OrgActionResult,
} from "../actions";

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  station: string;
  avatarUrl: string | null;
};

/** Type de données échangé pendant un glisser-déposer de membre. */
const MEMBER_DRAG = "application/x-lsfd-member";
const NEW_NODE_TITLE = "Nouvel élément";

type Run = (task: () => Promise<OrgActionResult>) => void;

const inputClass =
  "border border-slate-300 rounded px-2 py-1 text-[12px] text-slate-800 focus:outline-none focus:border-slate-500 bg-white";
const iconButton =
  "border border-slate-300 text-slate-600 text-[12px] font-bold rounded w-7 h-7 flex items-center justify-center hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent";

export function OrgEditor({ rows, members }: { rows: OrgRow[]; members: Member[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hidePlaced, setHidePlaced] = useState(false);

  const run: Run = (task) => {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (result.error) setError(result.error);
    });
  };

  const placed = new Map<string, number>();
  for (const row of rows) {
    if (row.holderUserId) placed.set(row.holderUserId, (placed.get(row.holderUserId) ?? 0) + 1);
  }

  const needle = search.trim().toLowerCase();
  const visibleMembers = members.filter((member) => {
    if (hidePlaced && placed.has(member.id)) return false;
    if (!needle) return true;
    return `${member.firstName} ${member.lastName} ${member.grade} ${member.station}`
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Link href="/organization" className="text-[13px] font-bold text-[#0d2644] hover:underline">
          ← Retour à l&apos;organigramme
        </Link>
        <span className="text-[12px] text-slate-500" aria-live="polite">
          {pending ? "Enregistrement…" : "Chaque action est enregistrée immédiatement."}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-[#c00d0d] bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* ----------------------------- Lignes ----------------------------- */}
        <div className="flex-1 min-w-0 w-full">
          {rows.length === 0 ? (
            <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600 flex flex-col gap-3 items-start">
              <p>L&apos;organigramme est vide.</p>
              <form action={importOrgTemplateAction}>
                <button
                  type="submit"
                  className="bg-[#0d2644] text-white text-[13px] font-bold rounded px-4 py-2 hover:bg-[#143a66] transition-colors"
                >
                  Importer l&apos;organigramme du PDF
                </button>
              </form>
              <p>ou commencer de zéro :</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {rows.map((row) => (
                <EditorRow
                  key={`${row.id}|${row.title}|${row.role}|${row.holderName ?? ""}|${row.note ?? ""}|${row.holderUserId ?? ""}`}
                  row={row}
                  members={members}
                  isDropTarget={dropTarget === row.id}
                  setDropTarget={setDropTarget}
                  run={run}
                  busy={pending}
                />
              ))}
            </ul>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => addOrgNodeAction(null, NEW_NODE_TITLE))}
            className="mt-3 border border-dashed border-slate-400 text-slate-600 text-[12px] font-bold rounded px-4 py-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            + Ajouter un élément tout en haut
          </button>
        </div>

        {/* ---------------------------- Membres ----------------------------- */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-0 border border-slate-200 rounded bg-white shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 rounded-t">
            <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
              Membres ({members.length})
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Glisse un membre sur une ligne pour l&apos;affecter.
            </p>
          </div>
          <div className="p-3 flex flex-col gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher…"
              aria-label="Rechercher un membre"
              className={`${inputClass} w-full`}
            />
            <label className="flex items-center gap-2 text-[12px] text-slate-600">
              <input
                type="checkbox"
                checked={hidePlaced}
                onChange={(event) => setHidePlaced(event.target.checked)}
              />
              Masquer ceux déjà placés
            </label>
            <ul className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
              {visibleMembers.map((member) => (
                <li
                  key={member.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(MEMBER_DRAG, member.id);
                    event.dataTransfer.setData("text/plain", `${member.lastName}, ${member.firstName}`);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  onDragEnd={() => setDropTarget(null)}
                  data-member={member.id}
                  className="flex items-center gap-2 border border-slate-200 rounded px-2 py-1.5 cursor-grab active:cursor-grabbing hover:bg-slate-50"
                >
                  <Avatar
                    src={member.avatarUrl}
                    firstName={member.firstName}
                    lastName={member.lastName}
                    className="w-7 h-7 text-[10px]"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12px] font-bold text-slate-800 truncate">
                      {member.lastName}, {member.firstName}
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      {member.grade} | {member.station}
                    </span>
                  </span>
                  {placed.has(member.id) && (
                    <span
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5"
                      title="Déjà placé dans l'organigramme"
                    >
                      ✓ {placed.get(member.id)}
                    </span>
                  )}
                </li>
              ))}
              {visibleMembers.length === 0 && (
                <li className="text-[12px] text-slate-400 px-1 py-2">Aucun membre.</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------ Une ligne ------------------------------ */

function EditorRow({
  row,
  members,
  isDropTarget,
  setDropTarget,
  run,
  busy,
}: {
  row: OrgRow;
  members: Member[];
  isDropTarget: boolean;
  setDropTarget: (id: string | null) => void;
  run: Run;
  busy: boolean;
}) {
  const style = levelStyle(row.depth);
  const [title, setTitle] = useState(row.title);
  const [role, setRole] = useState(row.role);
  const [holderName, setHolderName] = useState(row.holderName ?? "");
  const [note, setNote] = useState(row.note ?? "");
  const [showNote, setShowNote] = useState(false);

  const dirty =
    title !== row.title ||
    role !== row.role ||
    holderName !== (row.holderName ?? "") ||
    note !== (row.note ?? "");

  const linkedMember = row.holderUserId
    ? members.find((member) => member.id === row.holderUserId)
    : undefined;
  const linkedName = linkedMember
    ? `${linkedMember.lastName}, ${linkedMember.firstName}`
    : [row.holderLastName, row.holderFirstName].filter(Boolean).join(", ");

  return (
    <li
      data-row={row.id}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(MEMBER_DRAG)) return;
        event.preventDefault(); // autorise le dépôt
        event.dataTransfer.dropEffect = "copy";
        setDropTarget(row.id);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null);
      }}
      onDrop={(event) => {
        const memberId = event.dataTransfer.getData(MEMBER_DRAG);
        if (!memberId) return;
        event.preventDefault();
        setDropTarget(null);
        run(() => assignOrgHolderAction(row.id, memberId));
      }}
      style={{ marginLeft: Math.min(row.depth, MAX_DEPTH) * 18 }}
      className={`rounded border bg-white transition-shadow ${
        isDropTarget ? "border-[#c00d0d] ring-2 ring-[#c00d0d]/30" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 p-2">
        <span
          className={`w-3 h-8 rounded-sm shrink-0 ${style.swatch}`}
          title={`Niveau ${row.depth + 1} : ${style.name}`}
        />

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          aria-label="Titre"
          className={`${inputClass} flex-1 min-w-[180px] font-bold`}
        />
        <input
          value={role}
          onChange={(event) => setRole(event.target.value)}
          maxLength={100}
          placeholder="Poste (ex. Battalion Chief)"
          aria-label="Poste"
          className={`${inputClass} w-48`}
        />

        {row.holderUserId ? (
          <span className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 rounded pl-1.5 pr-1 py-0.5">
            <Avatar
              src={row.holderAvatarUrl}
              firstName={row.holderFirstName ?? "?"}
              lastName={row.holderLastName ?? "?"}
              className="w-5 h-5 text-[9px]"
            />
            <span className="text-[12px] font-bold text-slate-800">{linkedName}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => assignOrgHolderAction(row.id, null))}
              aria-label="Retirer le compte lié"
              title="Retirer ce membre du poste"
              className="text-slate-500 hover:text-[#c00d0d] text-[13px] px-1 disabled:opacity-40"
            >
              ✕
            </button>
          </span>
        ) : (
          <>
            <input
              value={holderName}
              onChange={(event) => setHolderName(event.target.value)}
              maxLength={100}
              placeholder="Titulaire (ou glisse un membre ici)"
              aria-label="Titulaire sans compte"
              className={`${inputClass} w-60`}
            />
            <select
              value=""
              disabled={busy}
              onChange={(event) => {
                if (event.target.value) run(() => assignOrgHolderAction(row.id, event.target.value));
              }}
              aria-label="Lier un compte"
              className={`${inputClass} w-36`}
            >
              <option value="">Lier un compte…</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.lastName}, {member.firstName}
                </option>
              ))}
            </select>
          </>
        )}

        <span className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            disabled={busy || row.index === 0}
            onClick={() => run(() => moveOrgNodeAction(row.id, "up"))}
            aria-label="Monter"
            title="Monter"
            className={iconButton}
          >
            ↑
          </button>
          <button
            type="button"
            disabled={busy || row.index >= row.siblingCount - 1}
            onClick={() => run(() => moveOrgNodeAction(row.id, "down"))}
            aria-label="Descendre"
            title="Descendre"
            className={iconButton}
          >
            ↓
          </button>
          <button
            type="button"
            disabled={busy || row.depth === 0}
            onClick={() => run(() => moveOrgNodeAction(row.id, "outdent"))}
            aria-label="Remonter d'un niveau"
            title="Remonter d'un niveau (le sortir de son groupe)"
            className={iconButton}
          >
            ←
          </button>
          <button
            type="button"
            disabled={busy || !row.canIndent}
            onClick={() => run(() => moveOrgNodeAction(row.id, "indent"))}
            aria-label="Descendre d'un niveau"
            title="Descendre d'un niveau (le ranger sous l'élément du dessus)"
            className={iconButton}
          >
            →
          </button>
          <button
            type="button"
            onClick={() => setShowNote((value) => !value)}
            aria-label="Note"
            title={showNote ? "Masquer la note" : "Ajouter / voir la note"}
            className={`${iconButton} ${note ? "text-[#c00d0d] border-[#c00d0d]/40" : ""}`}
          >
            ✎
          </button>
          <button
            type="button"
            disabled={busy || row.depth >= MAX_DEPTH}
            onClick={() => run(() => addOrgNodeAction(row.id, NEW_NODE_TITLE))}
            title="Ajouter un sous-élément dans cet élément"
            className={`${iconButton} w-auto px-2`}
          >
            + Sous
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => addOrgNodeAction(row.parentId, NEW_NODE_TITLE))}
            title="Ajouter un élément au même niveau"
            className={`${iconButton} w-auto px-2`}
          >
            + Même niv.
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const extra =
                row.descendantCount > 0
                  ? ` ainsi que ses ${row.descendantCount} sous-élément(s)`
                  : "";
              if (window.confirm(`Supprimer « ${row.title} »${extra} ?`)) {
                run(() => deleteOrgNodeAction(row.id));
              }
            }}
            aria-label="Supprimer"
            title="Supprimer (avec tout ce qu'il contient)"
            className={`${iconButton} text-[#c00d0d] border-red-200 hover:bg-red-50`}
          >
            🗑
          </button>
        </span>
      </div>

      {showNote && (
        <div className="px-2 pb-2">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1500}
            rows={3}
            placeholder="Note affichée en bas de page (explique le rôle de cette unité). Laisse vide pour aucune note."
            aria-label="Note"
            className={`${inputClass} w-full`}
          />
        </div>
      )}

      {dirty && (
        <div className="px-2 pb-2 flex items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => saveOrgNodeAction(row.id, { title, role, holderName, note }))}
            className="bg-[#0d2644] text-white text-[12px] font-bold rounded px-3 py-1.5 hover:bg-[#143a66] transition-colors disabled:opacity-60"
          >
            Enregistrer cette ligne
          </button>
          <span className="text-[11px] text-slate-500">Modifications non enregistrées</span>
        </div>
      )}
    </li>
  );
}
