import { Suspense } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { WidgetWrapper } from "@/components/WidgetWrapper";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata = { title: "Mon profil | LSFD Intranet" };

export default function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <h1 className="text-xl font-bold text-slate-800 uppercase mb-6">Mon profil</h1>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

async function ProfileContent() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-4">
      <WidgetWrapper title="Informations">
        <div className="flex items-center gap-5">
          <Avatar
            src={user.avatarUrl}
            firstName={user.firstName}
            lastName={user.lastName}
            className="w-20 h-20 text-2xl"
          />
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[14px]">
            <dt className="text-slate-500">Nom</dt>
            <dd className="font-bold text-slate-800">
              {user.firstName} {user.lastName}
            </dd>
            <dt className="text-slate-500">Grade</dt>
            <dd className="text-slate-800">{user.grade}</dd>
            <dt className="text-slate-500">Station</dt>
            <dd className="text-slate-800">{user.station}</dd>
            <dt className="text-slate-500">Identifiant</dt>
            <dd className="text-slate-800">{user.username}</dd>
            <dt className="text-slate-500">Rôle</dt>
            <dd className="text-slate-800">{user.isAdmin ? "Modérateur" : "Utilisateur"}</dd>
          </dl>
        </div>
        <p className="text-[12px] text-slate-400 mt-4">
          Pour modifier ces informations (grade, station, photo), contacte un modérateur.
        </p>
      </WidgetWrapper>

      {user.isAdmin && (
        <WidgetWrapper title="Administration">
          <Link
            href="/admin"
            className="inline-block bg-[#0d2644] text-white text-[13px] font-bold rounded px-4 py-2 hover:bg-[#143a66] transition-colors"
          >
            Ouvrir le panneau d&apos;administration
          </Link>
        </WidgetWrapper>
      )}

      <WidgetWrapper title="Changer mon mot de passe">
        <ChangePasswordForm />
      </WidgetWrapper>

      <form action={logout}>
        <button
          type="submit"
          className="border border-slate-300 text-slate-700 text-[13px] font-bold rounded px-4 py-2 hover:bg-slate-100 transition-colors"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
