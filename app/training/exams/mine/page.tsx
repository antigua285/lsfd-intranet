import { Suspense } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access";
import { closeExpiredAttempts, isMissingExamsTableError, listAttemptsByUser } from "@/lib/exams";
import { STATUS_LABEL, VERDICT_LABEL, type AttemptSummary } from "@/lib/exams-types";

export const metadata = { title: "Mes examens | LSFD Intranet" };

export default function MyExamsPage() {
  return (
    <div className="max-w-3xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Breadcrumb items={[{ label: "Formation", href: "/training" }, { label: "Examens", href: "/training/exams" }, { label: "Mes examens" }]} />
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Mes examens</h1>
      <p className="text-sm text-slate-500 mb-6">Tes passages et leurs résultats, une fois corrigés et envoyés.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  let attempts: AttemptSummary[] = [];
  try {
    await closeExpiredAttempts();
    attempts = await listAttemptsByUser(ctx.user.id);
  } catch (error) {
    if (!isMissingExamsTableError(error)) throw error;
  }
  if (attempts.length === 0) return <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Tu n&apos;as passé aucun examen.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {attempts.map((a) => (
        <li key={a.id}>
          <Link data-testid="my-attempt" href={a.status === "in_progress" ? `/training/exams/take/${a.id}` : `/training/exams/attempt/${a.id}`} className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-3 hover:bg-slate-50">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-slate-800 truncate">{a.examTitle}</p>
              <p className="text-[12px] text-slate-500">{new Date(a.startedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
            </div>
            <span className="text-[12px] text-slate-600">{a.status === "in_progress" ? "En cours — reprendre" : STATUS_LABEL[a.status]}</span>
            {a.status === "sent" && a.verdict && (
              <span className={`text-[11px] font-bold rounded px-2 py-0.5 ${a.verdict === "pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{VERDICT_LABEL[a.verdict]}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
