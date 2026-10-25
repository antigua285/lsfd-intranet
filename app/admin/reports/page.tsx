import { Suspense } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { countDeletedFormSubmissions, countForms, isMissingFormsTableError, listForms, listSubmissions } from "@/lib/forms";
import { UUID_PATTERN } from "@/lib/validation";

export const metadata = { title: "Rapports reçus | LSFD Intranet" };

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

export default function AdminReportsPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="max-w-6xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <h1 className="text-xl font-bold text-slate-800 uppercase">Administration</h1>
      <p className="text-sm text-slate-500 mb-4">Rapports reçus, classés par formulaire. Réservé aux modérateurs.</p>
      <AdminNav current="/admin/reports" />
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Content({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const formParam = first(sp.form);
  const form = formParam === "deleted" || UUID_PATTERN.test(formParam) ? formParam : "";
  const status = first(sp.status) === "new" ? "new" : first(sp.status) === "reviewed" ? "reviewed" : undefined;
  const search = first(sp.q).trim().slice(0, 100);
  const oldestFirst = first(sp.sort) === "oldest";

  let data;
  try {
    data = await Promise.all([
      listForms(), countForms(), countDeletedFormSubmissions(),
      listSubmissions({ form: form || undefined, status, search: search || undefined, oldestFirst }),
    ]);
  } catch (error) {
    if (!isMissingFormsTableError(error)) throw error;
    return (
      <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
        <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
        Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC (une seule fois), puis recharge cette page.
      </div>
    );
  }
  const [forms, counts, deleted, rows] = data;
  {
    const byForm = new Map(counts.map((c) => [c.formId, c]));
    const totalAll = counts.reduce((n, c) => n + c.submissions, 0) + deleted;

    const href = (patch: Record<string, string | undefined>) => {
      const p = new URLSearchParams();
      const next = { form, status: status ?? "", q: search, sort: oldestFirst ? "oldest" : "", ...patch };
      for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
      const s = p.toString();
      return s ? `/admin/reports?${s}` : "/admin/reports";
    };
    const tab = (active: boolean) =>
      `flex items-center justify-between gap-2 rounded px-3 py-2 text-[13px] ${active ? "bg-[#0d2644] text-white font-bold" : "hover:bg-slate-100 text-slate-700"}`;

    return (
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <nav aria-label="Formulaires" className="flex flex-col gap-1">
          <Link href={href({ form: "" })} className={tab(!form)}><span>Tous les formulaires</span><span>{totalAll}</span></Link>
          {forms.map((f) => {
            const c = byForm.get(f.id);
            return (
              <Link key={f.id} href={href({ form: f.id })} className={tab(form === f.id)}>
                <span className="truncate">{f.title}</span>
                <span className="shrink-0">{c?.unread ? `${c.unread} / ` : ""}{c?.submissions ?? 0}</span>
              </Link>
            );
          })}
          {deleted > 0 && (
            <Link href={href({ form: "deleted" })} className={tab(form === "deleted")}><span>Formulaire supprimé</span><span>{deleted}</span></Link>
          )}
        </nav>

        <section>
          <form method="get" action="/admin/reports" className="flex flex-wrap items-end gap-2 mb-3 text-[13px]">
            {form && <input type="hidden" name="form" value={form} />}
            <label>Recherche
              <input name="q" defaultValue={search} className="block border border-slate-300 rounded px-2 py-1.5" placeholder="Nom, contenu…" />
            </label>
            <label>État
              <select name="status" defaultValue={status ?? ""} className="block border border-slate-300 rounded px-2 py-1.5">
                <option value="">Tous</option><option value="new">Nouveaux</option><option value="reviewed">Traités</option>
              </select>
            </label>
            <label>Tri
              <select name="sort" defaultValue={oldestFirst ? "oldest" : ""} className="block border border-slate-300 rounded px-2 py-1.5">
                <option value="">Plus récents d&apos;abord</option><option value="oldest">Plus anciens d&apos;abord</option>
              </select>
            </label>
            <button className="bg-[#0d2644] text-white text-[12px] font-bold uppercase rounded px-4 py-2">Filtrer</button>
          </form>

          {rows.length === 0 ? (
            <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucun rapport.</p>
          ) : (
            <table className="w-full text-[13px] border border-slate-200">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-600">
                <tr><th className="p-2">Date</th><th className="p-2">Formulaire</th><th className="p-2">Auteur</th><th className="p-2">Résumé</th><th className="p-2">État</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} data-testid="report-row" className="hover:bg-slate-50">
                    <td className="p-2 whitespace-nowrap">
                      <Link href={`/reports/${r.id}`} className="text-[#0d2644] font-bold hover:underline">
                        {new Date(r.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </Link>
                    </td>
                    <td className="p-2">{r.formTitle}</td>
                    <td className="p-2">{r.submitterName}</td>
                    <td className="p-2 text-slate-500 max-w-[280px] truncate">{r.summary}</td>
                    <td className="p-2"><span className={`text-[11px] font-bold rounded px-2 py-0.5 ${r.status === "new" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{r.status === "new" ? "Nouveau" : "Traité"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    );
  }
}
