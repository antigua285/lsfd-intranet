"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUserFlagsAction } from "./access/actions";

type Props = { userId: string; current: string[]; allFlags: { code: string; name: string }[] };

/** Cases à cocher des flags d'un compte (un modérateur a de toute façon accès à tout). */
export function UserFlagsEditor({ userId, current, allFlags }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(current);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = selected.length !== current.length || selected.some((f) => !current.includes(f));

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await setUserFlagsAction(userId, selected);
      setMessage(result.ok ? { ok: true, text: "Flags enregistrés." } : { ok: false, text: result.error });
      if (result.ok) router.refresh();
    } catch {
      setMessage({ ok: false, text: "L'enregistrement a échoué (session expirée ?)." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset className="pt-3" data-testid="user-flags">
      <legend className="text-[12px] font-bold uppercase tracking-wide text-slate-600">Flags d&apos;accès</legend>
      {allFlags.length === 0 ? (
        <p className="text-[12px] text-slate-500 mt-1">Aucun flag n&apos;existe (Accès &amp; flags).</p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[13px]">
          {allFlags.map((f) => (
            <label key={f.code} className="flex items-center gap-1.5" title={f.name}>
              <input type="checkbox" checked={selected.includes(f.code)}
                onChange={(e) => setSelected((p) => (e.target.checked ? [...p, f.code] : p.filter((c) => c !== f.code)))} />
              {f.code}
            </label>
          ))}
          <button type="button" disabled={busy || !dirty} onClick={save}
            className="border border-slate-300 text-slate-700 text-[12px] font-bold rounded px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40">
            Enregistrer les flags
          </button>
        </div>
      )}
      {message && <p role={message.ok ? "status" : "alert"} className={`text-[12px] mt-1 ${message.ok ? "text-emerald-700" : "text-[#c00d0d]"}`}>{message.text}</p>}
    </fieldset>
  );
}
