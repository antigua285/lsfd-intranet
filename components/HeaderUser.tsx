import Link from "next/link";
import { Avatar } from "./Avatar";
import { getCurrentUser } from "@/lib/auth";

/** Affiché pendant le chargement du profil (même taille que le vrai bloc). */
export function HeaderUserSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-3 w-20 bg-slate-200 rounded ml-auto"></div>
        <div className="h-2.5 w-28 bg-slate-100 rounded"></div>
      </div>
      <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded"></div>
    </div>
  );
}

/** Bloc "profil" du header : nom, grade | station, photo. Mène à /profile. */
export async function HeaderUser() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/login" className="text-[13px] font-bold text-[#0d2644] hover:underline">
        Se connecter
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.isAdmin && (
        <Link
          href="/admin"
          title="Panneau d'administration"
          className="text-slate-500 hover:text-[#0d2644] transition-colors p-1 rounded hover:bg-slate-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </Link>
      )}
      <Link href="/profile" title="Mon profil" className="flex items-center gap-3 group">
        <div className="text-right leading-tight">
          <p className="text-[13px] font-bold text-slate-800">
            {user.firstName.charAt(0).toUpperCase()}. {user.lastName}
          </p>
          <p className="text-[11px] text-slate-500">
            {user.grade} | {user.station}
          </p>
        </div>
        <Avatar
          src={user.avatarUrl}
          firstName={user.firstName}
          lastName={user.lastName}
          className="w-8 h-8 text-xs group-hover:bg-slate-200 transition-colors"
        />
      </Link>
    </div>
  );
}
