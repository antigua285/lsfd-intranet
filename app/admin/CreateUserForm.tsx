"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUserAction, type ActionState } from "./actions";

const inputClass =
  "w-full border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 focus:outline-none focus:border-slate-500 shadow-sm";
const labelClass = "text-[12px] font-bold text-slate-600";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createUserAction,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Vide le formulaire une fois le compte créé
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-x-4 gap-y-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="firstName" className={labelClass}>Prénom</label>
        <input id="firstName" name="firstName" type="text" maxLength={60} required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="lastName" className={labelClass}>Nom</label>
        <input id="lastName" name="lastName" type="text" maxLength={60} required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="grade" className={labelClass}>Grade</label>
        <input id="grade" name="grade" type="text" maxLength={60} placeholder="Ex. Captain" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="station" className={labelClass}>Station d&apos;affectation</label>
        <input id="station" name="station" type="text" maxLength={60} placeholder="Ex. Station 7" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="username" className={labelClass}>Identifiant de connexion</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          minLength={3}
          maxLength={32}
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>Mot de passe (8 caractères min.)</label>
        <input
          id="password"
          name="password"
          type="text"
          autoComplete="off"
          minLength={8}
          maxLength={128}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1 col-span-2">
        <label htmlFor="avatarUrl" className={labelClass}>URL de la photo de profil (facultatif)</label>
        <input id="avatarUrl" name="avatarUrl" type="url" maxLength={500} placeholder="https://…" className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-[13px] text-slate-700 col-span-2">
        <input type="checkbox" name="isAdmin" className="w-4 h-4" />
        Modérateur (accès à ce panneau d&apos;administration)
      </label>

      {state.error && (
        <p role="alert" className="col-span-2 text-[13px] text-[#c00d0d] bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="col-span-2 text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          {state.success}
        </p>
      )}

      <div className="col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#0d2644] text-white text-[13px] font-bold rounded px-4 py-2 hover:bg-[#143a66] transition-colors disabled:opacity-60"
        >
          {pending ? "Création…" : "Créer le compte"}
        </button>
      </div>
    </form>
  );
}
