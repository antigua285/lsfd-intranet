import { Suspense } from "react";
import { APP_MODULES } from "@/config/navigation";
import { AdminNav } from "@/components/AdminNav";
import { isMissingAccessTableError, listFlags, listModuleRules, type Flag } from "@/lib/access";
import { moduleKey, orderModules, type ModuleRule } from "@/lib/access-rules";
import { requireAdmin } from "@/lib/auth";
import { FlagsManager, ModulesManager } from "./AccessManager";

export const metadata = { title: "Accès & flags | LSFD Intranet" };

export default function AdminAccessPage() {
  return (
    <div className="max-w-5xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <h1 className="text-xl font-bold text-slate-800 uppercase">Administration</h1>
      <p className="text-sm text-slate-500 mb-4">Flags d&apos;accès, accès et ordre des catégories. Réservé aux modérateurs.</p>
      <AdminNav current="/admin/access" />
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireAdmin();
  let flags: Flag[] = [];
  let rules = new Map<string, ModuleRule>();
  try {
    [flags, rules] = await Promise.all([listFlags(), listModuleRules()]);
  } catch (error) {
    if (!isMissingAccessTableError(error)) throw error;
    return (
      <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
        <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
        Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC (une seule fois), puis recharge cette page.
      </div>
    );
  }
  const modules = orderModules(APP_MODULES, rules).map((m) => ({
    key: moduleKey(m),
    title: m.title,
    desc: m.desc,
    link: m.link,
    flags: rules.get(moduleKey(m))?.flags ?? [],
  }));
  const flagRows = flags.map((f) => ({ code: f.code, name: f.name, description: f.description }));
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600 mb-1">Flags</h2>
        <p className="text-[12px] text-slate-500 mb-3">
          Un flag est une permission (ex. ACTS). Attribue-les aux comptes depuis Comptes ; exige-les sur une catégorie ou un formulaire.
          Un modérateur a accès à tout, sans flag.
        </p>
        <FlagsManager flags={flagRows} />
      </section>
      <section>
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600 mb-1">Catégories du dashboard</h2>
        <p className="text-[12px] text-slate-500 mb-3">
          Choisis qui voit chaque catégorie et dans quel ordre elles s&apos;affichent. Sans flag coché, la catégorie est ouverte à tous.
          Les formulaires se règlent dans leur créateur.
        </p>
        <ModulesManager modules={modules} flags={flagRows} />
      </section>
    </div>
  );
}
