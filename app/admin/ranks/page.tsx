import { Suspense } from "react";
import { AdminNav } from "@/components/AdminNav";
import { isMissingAccessTableError, listFlags } from "@/lib/access";
import { requireAdmin } from "@/lib/auth";
import { isMissingRankTableError, listRanks, type Rank } from "@/lib/ranks";
import { RankManager } from "./RankManager";

export const metadata = { title: "Rangs | LSFD Intranet" };

export default function AdminRanksPage() {
  return (
    <div className="max-w-5xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <h1 className="text-xl font-bold text-slate-800 uppercase">Administration</h1>
      <p className="text-sm text-slate-500 mb-4">Rangs du département : création, ordre hiérarchique et flags liés. Réservé aux modérateurs.</p>
      <AdminNav current="/admin/ranks" />
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireAdmin();
  let ranks: Rank[] = [];
  let missing = false;
  try {
    ranks = await listRanks();
  } catch (error) {
    if (!isMissingRankTableError(error)) throw error;
    missing = true;
  }
  if (missing) {
    return <p className="text-[13px] text-slate-600">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC (une seule fois), puis recharge cette page.</p>;
  }
  let flags: { code: string; name: string }[] = [];
  try {
    flags = (await listFlags()).map((f) => ({ code: f.code, name: f.name }));
  } catch (error) {
    if (!isMissingAccessTableError(error)) throw error;
  }
  return <RankManager ranks={ranks} flags={flags} />;
}
