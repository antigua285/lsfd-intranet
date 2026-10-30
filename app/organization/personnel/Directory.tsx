"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import type { PersonnelCard } from "@/lib/personnel";
import { EMPLOYMENT_STATUSES, labelOf } from "@/lib/personnel-shared";

export function Directory({ people }: { people: PersonnelCard[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return people.filter((p) => (!status || p.employmentStatus === status) && (!needle || `${p.firstName} ${p.lastName} ${p.grade} ${p.station}`.toLowerCase().includes(needle)));
  }, [people, q, status]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input aria-label="Rechercher une personne" data-testid="pers-search" placeholder="Rechercher (nom, rang, station)…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-56 border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-900 bg-white" />
        <select aria-label="Filtrer par statut" value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-900 bg-white">
          <option value="">Tous les statuts</option>
          {EMPLOYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <p className="text-[12px] text-slate-500 mb-2">{shown.length} personne(s)</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.userId}>
            <Link href={`/organization/personnel/${p.userId}`} data-testid="pers-card" className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 bg-white hover:border-[#0d2644] transition-colors">
              <Avatar src={p.avatarUrl} firstName={p.firstName} lastName={p.lastName} className="w-14 h-14 text-lg" />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-slate-900 truncate">{p.firstName} {p.lastName}</p>
                <p className="text-[12px] text-slate-700 truncate">{p.grade}</p>
                <p className="text-[12px] text-slate-500 truncate">{p.station}{p.employmentStatus !== "actif" ? ` · ${labelOf(EMPLOYMENT_STATUSES, p.employmentStatus)}` : ""}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
