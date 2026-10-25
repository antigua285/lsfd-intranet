import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { isMissingTableError, listOrgNodes } from "@/lib/org";
import { buildRows, type OrgNode } from "@/lib/org-types";
import { listUsers } from "@/lib/users";
import { OrgEditor, type Member } from "./OrgEditor";

export const metadata = { title: "Modifier l'organigramme | LSFD Intranet" };

export default function EditOrganizationPage() {
  return (
    <div className="max-w-6xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <h1 className="text-xl font-bold text-slate-800 uppercase">Modifier l&apos;organigramme</h1>
      <p className="text-sm text-slate-500 mb-5">
        Réservé aux modérateurs. La couleur d&apos;une ligne dépend de son niveau : noir, orange, gris,
        gras, puis normal.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <EditContent />
      </Suspense>
    </div>
  );
}

async function EditContent() {
  await requireAdmin();

  let nodes: OrgNode[] = [];
  try {
    nodes = await listOrgNodes();
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return (
      <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
        <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
        Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC (une
        seule fois), puis recharge cette page.
      </div>
    );
  }

  const members: Member[] = (await listUsers()).map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    grade: user.grade,
    station: user.station,
    avatarUrl: user.avatarUrl,
  }));

  return <OrgEditor rows={buildRows(nodes)} members={members} />;
}
