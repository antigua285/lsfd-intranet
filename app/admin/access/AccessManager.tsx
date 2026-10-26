"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFlagAction,
  deleteFlagAction,
  moveModuleAction,
  saveModuleFlagsAction,
  updateFlagAction,
  type AccessResult,
} from "./actions";

export type FlagRow = { code: string; name: string; description: string };
export type ModuleRow = { key: string; title: string; desc: string; link: string; flags: string[] };

const INPUT = "border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#0d2644]";
const BTN = "border border-slate-300 text-slate-700 text-[12px] font-bold rounded px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40";

function useRunner() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  async function run(work: () => Promise<AccessResult>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await work();
      setMessage(result.ok ? { ok: true, text: success } : { ok: false, text: result.error });
      if (result.ok) router.refresh();
      return result.ok;
    } catch {
      setMessage({ ok: false, text: "L'action a échoué (session expirée ?)." });
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, message, run };
}

function Message({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <p role={message.ok ? "status" : "alert"} className={`text-[13px] ${message.ok ? "text-green-700" : "text-red-700"}`}>
      {message.text}
    </p>
  );
}

export function FlagsManager({ flags }: { flags: FlagRow[] }) {
  const { busy, message, run } = useRunner();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (await run(() => createFlagAction({ code, name, description }), `Flag ${code.toUpperCase()} créé.`)) {
      setCode(""); setName(""); setDescription("");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={add} className="flex flex-wrap items-end gap-2" aria-label="Créer un flag">
        <label className="text-[12px]">Code
          <input aria-label="Code du flag" className={`${INPUT} block w-32 uppercase`} value={code} maxLength={24} placeholder="ACTS" onChange={(e) => setCode(e.target.value)} />
        </label>
        <label className="text-[12px] flex-1 min-w-[200px]">Nom
          <input aria-label="Nom du flag" className={`${INPUT} block w-full`} value={name} maxLength={80} placeholder="Arson Counter Terrorism Section" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-[12px] flex-1 min-w-[200px]">Description
          <input aria-label="Description du flag" className={`${INPUT} block w-full`} value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit" disabled={busy} className="bg-[#0d2644] text-white text-[12px] font-bold uppercase rounded px-4 py-2 disabled:opacity-50">Créer le flag</button>
      </form>
      <Message message={message} />
      {flags.length === 0 ? (
        <p className="text-[13px] text-slate-500">Aucun flag pour l&apos;instant.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded">
          {flags.map((flag) => (
            <FlagLine key={flag.code} flag={flag} busy={busy} run={run} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FlagLine({ flag, busy, run }: { flag: FlagRow; busy: boolean; run: ReturnType<typeof useRunner>["run"] }) {
  const [name, setName] = useState(flag.name);
  const [description, setDescription] = useState(flag.description);
  const dirty = name !== flag.name || description !== flag.description;
  return (
    <li data-testid="flag-row" className="flex flex-wrap items-center gap-2 p-2">
      <span className="font-mono text-[13px] font-bold w-28">{flag.code}</span>
      <input aria-label={`Nom de ${flag.code}`} className={`${INPUT} flex-1 min-w-[160px]`} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      <input aria-label={`Description de ${flag.code}`} className={`${INPUT} flex-1 min-w-[160px]`} value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
      <button type="button" className={BTN} disabled={busy || !dirty} onClick={() => run(() => updateFlagAction({ code: flag.code, name, description }), "Flag mis à jour.")}>Enregistrer</button>
      <button type="button" className={`${BTN} text-red-700`} disabled={busy}
        onClick={() => window.confirm(`Supprimer le flag ${flag.code} ? Il sera retiré de tous les comptes.`) && run(() => deleteFlagAction(flag.code), `Flag ${flag.code} supprimé.`)}>Supprimer</button>
    </li>
  );
}

export function ModulesManager({ modules, flags }: { modules: ModuleRow[]; flags: FlagRow[] }) {
  const { busy, message, run } = useRunner();
  return (
    <div className="flex flex-col gap-3">
      <Message message={message} />
      <ul className="flex flex-col gap-2">
        {modules.map((mod, index) => (
          <ModuleLine key={mod.key} mod={mod} flags={flags} busy={busy} run={run} first={index === 0} last={index === modules.length - 1} />
        ))}
      </ul>
    </div>
  );
}

function ModuleLine({ mod, flags, busy, run, first, last }: {
  mod: ModuleRow; flags: FlagRow[]; busy: boolean; run: ReturnType<typeof useRunner>["run"]; first: boolean; last: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(mod.flags);
  const dirty = selected.length !== mod.flags.length || selected.some((f) => !mod.flags.includes(f));
  return (
    <li data-testid="module-row" data-key={mod.key} className="border border-slate-200 rounded p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-slate-800 truncate">{mod.title}</p>
          <p className="text-[12px] text-slate-500 truncate">{mod.link} · {mod.desc}</p>
        </div>
        <button type="button" className={BTN} disabled={busy || first} aria-label={`Monter ${mod.title}`} onClick={() => run(() => moveModuleAction(mod.key, "up"), "Ordre enregistré.")}>↑</button>
        <button type="button" className={BTN} disabled={busy || last} aria-label={`Descendre ${mod.title}`} onClick={() => run(() => moveModuleAction(mod.key, "down"), "Ordre enregistré.")}>↓</button>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        <span className="text-[12px] text-slate-500">Accès :</span>
        {flags.length === 0 && <span className="text-[12px] text-slate-500">crée d&apos;abord des flags ci-dessus</span>}
        {flags.map((f) => (
          <label key={f.code} className="flex items-center gap-1.5" title={f.name}>
            <input type="checkbox" checked={selected.includes(f.code)}
              onChange={(e) => setSelected((p) => (e.target.checked ? [...p, f.code] : p.filter((c) => c !== f.code)))} />
            {f.code}
          </label>
        ))}
        <span className="text-[12px] text-slate-500">{selected.length === 0 ? "(ouvert à tous)" : "(au moins un de ces flags)"}</span>
        <button type="button" className={BTN} disabled={busy || !dirty}
          onClick={() => run(() => saveModuleFlagsAction(mod.key, selected), `Accès de « ${mod.title} » enregistré.`)}>Enregistrer l&apos;accès</button>
      </div>
    </li>
  );
}
