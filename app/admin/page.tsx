import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { WidgetWrapper } from "@/components/WidgetWrapper";
import { requireAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/users";
import { CreateUserForm } from "./CreateUserForm";
import { UserActions } from "./UserActions";

export const metadata = { title: "Administration | LSFD Intranet" };

export default function AdminPage() {
  return (
    <div className="max-w-5xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <h1 className="text-xl font-bold text-slate-800 uppercase">Administration</h1>
      <p className="text-sm text-slate-500 mb-6">
        Création et gestion des comptes. Réservé aux modérateurs.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <AdminContent />
      </Suspense>
    </div>
  );
}

async function AdminContent() {
  const me = await requireAdmin();
  const users = await listUsers();

  return (
    <div className="flex flex-col gap-4">
      <WidgetWrapper title="Créer un compte">
        <CreateUserForm />
      </WidgetWrapper>

      <WidgetWrapper title={`Comptes (${users.length})`}>
        <ul className="divide-y divide-slate-100 -my-1">
          {users.map((user) => (
            <li key={user.id}>
              <details className="group">
                <summary className="flex items-center gap-4 py-2.5 cursor-pointer list-none hover:bg-slate-50 -mx-2 px-2 rounded">
                  <Avatar
                    src={user.avatarUrl}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    className="w-9 h-9 text-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-800 truncate">
                      {user.firstName} {user.lastName}
                      {user.id === me.id && (
                        <span className="ml-2 text-[11px] font-normal text-slate-400">(toi)</span>
                      )}
                    </p>
                    <p className="text-[12px] text-slate-500 truncate">
                      {user.grade} | {user.station}
                    </p>
                  </div>
                  <span className="text-[12px] text-slate-500 hidden sm:block">{user.username}</span>
                  <span
                    className={`text-[11px] font-bold rounded px-2 py-0.5 ${
                      user.isAdmin ? "bg-[#0d2644] text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.isAdmin ? "Modérateur" : "Utilisateur"}
                  </span>
                  <span className="text-[12px] text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <UserActions
                  userId={user.id}
                  profile={{
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    grade: user.grade,
                    station: user.station,
                    avatarUrl: user.avatarUrl,
                    phone: user.phone,
                  }}
                  isAdmin={user.isAdmin}
                  isSelf={user.id === me.id}
                />
              </details>
            </li>
          ))}
        </ul>
      </WidgetWrapper>
    </div>
  );
}
