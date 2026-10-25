"use client";

import { useActionState } from "react";
import { updateProfileAction, type ActionState } from "./actions";

const inputClass =
  "w-full border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 focus:outline-none focus:border-slate-500 shadow-sm";
const labelClass = "text-[12px] font-bold text-slate-600";

export type EditableProfile = {
  username: string;
  firstName: string;
  lastName: string;
  grade: string;
  station: string;
  avatarUrl: string | null;
  phone: string | null;
};

export function EditUserForm({ userId, profile }: { userId: string; profile: EditableProfile }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateProfileAction,
    {}
  );
  const id = (name: string) => `${name}-${userId}`;
  // En cas d'erreur, on remet ce qui venait d'être saisi (React vide sinon le formulaire).
  const typed = (name: string, saved: string) => state.values?.[name] ?? saved;

  return (
    <form action={formAction} className="grid grid-cols-2 gap-x-4 gap-y-3">
      <input type="hidden" name="userId" value={userId} />

      <div className="flex flex-col gap-1">
        <label htmlFor={id("firstName")} className={labelClass}>Prénom</label>
        <input id={id("firstName")} name="firstName" type="text" maxLength={60} required defaultValue={typed("firstName", profile.firstName)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id("lastName")} className={labelClass}>Nom</label>
        <input id={id("lastName")} name="lastName" type="text" maxLength={60} required defaultValue={typed("lastName", profile.lastName)} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={id("grade")} className={labelClass}>Grade</label>
        <input id={id("grade")} name="grade" type="text" maxLength={60} required defaultValue={typed("grade", profile.grade)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id("station")} className={labelClass}>Station d&apos;affectation</label>
        <input id={id("station")} name="station" type="text" maxLength={60} required defaultValue={typed("station", profile.station)} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={id("username")} className={labelClass}>Identifiant de connexion</label>
        <input
          id={id("username")}
          name="username"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          minLength={3}
          maxLength={32}
          required
          defaultValue={typed("username", profile.username)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id("avatarUrl")} className={labelClass}>URL de la photo (vide = initiales)</label>
        <input
          id={id("avatarUrl")}
          name="avatarUrl"
          type="url"
          maxLength={500}
          placeholder="https://…"
          defaultValue={typed("avatarUrl", profile.avatarUrl ?? "")}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={id("phone")} className={labelClass}>Téléphone (vide = aucun)</label>
        <input
          id={id("phone")}
          name="phone"
          type="tel"
          maxLength={30}
          autoComplete="off"
          placeholder="Ex. 555-0123"
          defaultValue={typed("phone", profile.phone ?? "")}
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="col-span-2 text-[12px] text-[#c00d0d] bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="col-span-2 text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          {state.success}
        </p>
      )}

      <div className="col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#0d2644] text-white text-[12px] font-bold rounded px-4 py-2 hover:bg-[#143a66] transition-colors disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
