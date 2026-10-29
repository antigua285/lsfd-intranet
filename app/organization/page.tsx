import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { isMissingTableError, listOrgNodes } from "@/lib/org";
import { buildRows, type OrgNode } from "@/lib/org-types";
import { importOrgTemplateAction } from "./actions";
import { OrgTable } from "./OrgTable";

export const metadata = { title: "Organization & Personnel Directory | LSFD Intranet" };

export default function OrganizationPage() {
  return (
    <div className="max-w-5xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <OrganizationContent />
      </Suspense>
    </div>
  );
}

async function OrganizationContent() {
  const me = await requireUser();

  let nodes: OrgNode[] = [];
  let missingTable = false;
  try {
    nodes = await listOrgNodes();
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    missingTable = true;
  }
  const rows = buildRows(nodes);

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 uppercase">
            ORGANISATION
          </h1>
          <p className="text-sm text-slate-500">
            Organisation actuelle du département et affectation du personnel.
          </p>
        </div>
        {me.isAdmin && !missingTable && (
          <Link
            href="/organization/edit"
            className="shrink-0 bg-[#0d2644] text-white text-[13px] font-bold uppercase tracking-wide rounded px-4 py-2 hover:bg-[#143a66] transition-colors"
          >
            Edit page
          </Link>
        )}
      </div>

      {missingTable ? (
        <Notice title="Base de données à mettre à jour">
          {me.isAdmin ? (
            <>
              Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC
              (une seule fois), puis recharge cette page.
            </>
          ) : (
            "Cette page n'est pas encore disponible. Un modérateur doit finir l'installation."
          )}
        </Notice>
      ) : rows.length === 0 ? (
        <Notice title="L'organigramme est vide">
          {me.isAdmin ? (
            <form action={importOrgTemplateAction} className="flex flex-col gap-3 items-start">
              <span>
                Tu peux importer l&apos;organigramme actuel (celui du PDF), puis le modifier depuis
                « Edit page ». Ou commencer de zéro depuis « Edit page ».
              </span>
              <button
                type="submit"
                className="bg-[#0d2644] text-white text-[13px] font-bold rounded px-4 py-2 hover:bg-[#143a66] transition-colors"
              >
                Importer l&apos;organigramme du PDF
              </button>
            </form>
          ) : (
            "Un modérateur n'a pas encore renseigné l'organigramme."
          )}
        </Notice>
      ) : (
        <OrgTable rows={rows} />
      )}
    </>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 bg-slate-50 rounded p-5">
      <p className="text-[14px] font-bold text-slate-700 mb-2">{title}</p>
      <div className="text-[13px] text-slate-600">{children}</div>
    </div>
  );
}
