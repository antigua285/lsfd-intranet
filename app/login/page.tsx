import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Connexion | LSFD Intranet" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <div className="min-h-full flex items-center justify-center p-6 font-['Calibri','Arial',sans-serif]">
      <div className="w-full max-w-sm bg-white border border-slate-300 rounded shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 rounded-t">
          <h1 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
            LSFD Intranet — Connexion
          </h1>
        </div>
        <div className="p-5">
          <p className="text-[13px] text-slate-500 mb-4">
            Accès réservé au personnel. Les comptes sont créés par les modérateurs.
          </p>
          <Suspense fallback={<div className="h-40" />}>
            <LoginContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // Déjà connecté ? Inutile de se reconnecter.
  if (await getCurrentUser()) redirect("/");

  const { next } = await searchParams;
  const target = safeNextPath(Array.isArray(next) ? next[0] : next);
  return <LoginForm next={target} />;
}
