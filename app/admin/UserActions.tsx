"use client";

import { useActionState } from "react";
import {
  deleteUserAction,
  resetPasswordAction,
  toggleAdminAction,
  type ActionState,
} from "./actions";
import { EditUserForm, type EditableProfile } from "./EditUserForm";

function Message({ state }: { state: ActionState }) {
  if (state.error) {
    return <p role="alert" className="text-[12px] text-[#c00d0d] mt-1">{state.error}</p>;
  }
  if (state.success) {
    return <p role="status" className="text-[12px] text-emerald-700 mt-1">{state.success}</p>;
  }
  return null;
}

const buttonClass =
  "border border-slate-300 text-slate-700 text-[12px] font-bold rounded px-3 py-1.5 hover:bg-slate-100 transition-colors disabled:opacity-60";

export function UserActions({
  userId,
  profile,
  isAdmin,
  isSelf,
}: {
  userId: string;
  profile: EditableProfile;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const [resetState, resetAction, resetPending] = useActionState<ActionState, FormData>(resetPasswordAction, {});
  const [roleState, roleAction, rolePending] = useActionState<ActionState, FormData>(toggleAdminAction, {});
  const [deleteState, deleteAction, deletePending] = useActionState<ActionState, FormData>(deleteUserAction, {});

  return (
    <div className="flex flex-col gap-3 py-3">
      <EditUserForm userId={userId} profile={profile} />

      <hr className="border-slate-100" />

      <form action={resetAction}>
        <input type="hidden" name="userId" value={userId} />
        <div className="flex items-center gap-2">
          <input
            name="password"
            type="text"
            autoComplete="off"
            minLength={8}
            maxLength={128}
            required
            placeholder="Nouveau mot de passe"
            className="border border-slate-300 rounded px-3 py-1.5 text-[13px] w-56 focus:outline-none focus:border-slate-500"
          />
          <button type="submit" disabled={resetPending} className={buttonClass}>
            Réinitialiser le mot de passe
          </button>
        </div>
        <Message state={resetState} />
      </form>

      {!isSelf && (
        <div className="flex items-start gap-3">
          <form action={roleAction}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="makeAdmin" value={isAdmin ? "0" : "1"} />
            <button type="submit" disabled={rolePending} className={buttonClass}>
              {isAdmin ? "Retirer le rôle modérateur" : "Promouvoir modérateur"}
            </button>
            <Message state={roleState} />
          </form>

          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm("Supprimer définitivement ce compte ?")) event.preventDefault();
            }}
          >
            <input type="hidden" name="userId" value={userId} />
            <button
              type="submit"
              disabled={deletePending}
              className="border border-red-300 text-[#c00d0d] text-[12px] font-bold rounded px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              Supprimer le compte
            </button>
            <Message state={deleteState} />
          </form>
        </div>
      )}
    </div>
  );
}
