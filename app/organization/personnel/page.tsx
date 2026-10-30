import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { requireUser } from "@/lib/auth";
import { listPersonnel } from "@/lib/personnel";
import { Directory } from "./Directory";

export const metadata = { title: "Personnel | LSFD Intranet" };

export default function PersonnelPage() {
  return (
    <div className="max-w-5xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Organization & Personnel Directory", href: "/organization" }, { label: "Personnel" }]} />
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Personnel</h1>
      <p className="text-sm text-slate-500 mb-5">Fiche de personnel interne</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireUser();
  const people = await listPersonnel();
  return <Directory people={people} />;
}
