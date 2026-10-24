"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeOwnPassword, type PasswordState } from "./actions";

const inputClass =
  "w-full border border-slate-300 rounded px-3 py-1.5 text-[13px] text-slate-800 focus:outline-none focus:border-slate-500 shadow-sm";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(
    changeOwnPassword,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Vide les champs une fois le mot de passe changé
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 max-w-sm">
      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className="text-[12px] font-bold text-slate-600">
          Mot de passe actuel
        </label>
        <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-[12px] font-bold text-slate-600">
          Nouveau mot de passe (8 caractères min.)
        </label>
        <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-[12px] font-bold text-slate-600">
          Confirmer le nouveau mot de passe
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={inputClass} />
      </div>

      {state.error && (
        <p role="alert" className="text-[13px] text-[#c00d0d] bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-[#0d2644] text-white text-[13px] font-bold rounded px-4 py-2 hover:bg-[#143a66] transition-colors disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
