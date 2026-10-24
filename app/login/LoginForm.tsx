"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">
          Identifiant
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          className="w-full border border-slate-300 rounded px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-slate-500 shadow-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full border border-slate-300 rounded px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-slate-500 shadow-sm"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-[13px] text-[#c00d0d] bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-[#0d2644] text-white text-[14px] font-bold rounded px-4 py-2.5 hover:bg-[#143a66] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
