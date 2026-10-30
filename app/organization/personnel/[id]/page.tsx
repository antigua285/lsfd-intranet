import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getAccessContext } from "@/lib/access";
import { todayKey } from "@/lib/calendar-shared";
import { getSheet, isMissingPersonnelTableError } from "@/lib/personnel";
import { STAFF_FLAG, type Perms, type Sheet } from "@/lib/personnel-shared";
import { isMissingRankTableError, listRanks } from "@/lib/ranks";
import { UUID_PATTERN } from "@/lib/validation";
import { SheetEditor } from "./SheetEditor";

export const metadata = { title: "Fiche du personnel | LSFD Intranet" };

export default function SheetPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Organization & Personnel Directory", href: "/organization" }, { label: "Personnel", href: "/organization/personnel" }, { label: "Fiche" }]} />
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  const isStaff = ctx.user.isAdmin || ctx.flags.includes(STAFF_FLAG);
  const isSelf = ctx.user.id === id;
  const perms: Perms = { isSelf, isStaff, canConfidential: isSelf || isStaff };
  let sheet: Sheet | null = null;
  try {
    sheet = await getSheet(id, perms.canConfidential);
  } catch (error) {
    if (!isMissingPersonnelTableError(error)) throw error;
    return <p className="text-[13px] text-slate-600 mt-4">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</p>;
  }
  if (!sheet) notFound();
  let ranks: { id: string; name: string }[] = [];
  if (isStaff) {
    try {
      ranks = (await listRanks()).map((r) => ({ id: r.id, name: r.name }));
    } catch (error) {
      if (!isMissingRankTableError(error)) throw error;
    }
  }
  return <SheetEditor sheet={sheet} perms={perms} ranks={ranks} today={todayKey()} />;
}
