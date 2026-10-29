"use server";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access";
import { CALENDAR_FLAG } from "@/lib/calendar-shared";
import { createCalendarEvent, deleteCalendarEvent, isMissingCalendarTableError, parseCalInput, updateCalendarEvent } from "@/lib/calendar";
import { UUID_PATTERN } from "@/lib/validation";

export type CalResult = { ok: true; message: string } | { ok: false; error: string };

/** Seuls les OFFICER (et les admins) posent des événements. */
async function assertEditor() {
  const ctx = await getAccessContext();
  if (!ctx || !(ctx.user.isAdmin || ctx.flags.includes(CALENDAR_FLAG))) throw new Error("Accès refusé.");
  return ctx;
}

async function guarded(work: () => Promise<CalResult>): Promise<CalResult> {
  try {
    const r = await work();
    if (r.ok) revalidatePath("/calendar");
    return r;
  } catch (error) {
    if (isMissingCalendarTableError(error)) return { ok: false, error: "La base n'est pas à jour : lance `npm run db:setup` depuis ton PC." };
    throw error;
  }
}

export async function saveCalendarEventAction(id: string | null, raw: unknown): Promise<CalResult> {
  const ctx = await assertEditor();
  return guarded(async () => {
    const parsed = parseCalInput(raw);
    if (!parsed.ok) return parsed;
    if (id === null) {
      await createCalendarEvent(parsed.value, ctx.user.id);
      return { ok: true, message: "Événement ajouté." };
    }
    if (!UUID_PATTERN.test(id)) return { ok: false, error: "Événement invalide." };
    return (await updateCalendarEvent(id, parsed.value)) ? { ok: true, message: "Événement modifié." } : { ok: false, error: "Cet événement n'existe plus." };
  });
}

export async function deleteCalendarEventAction(id: string): Promise<CalResult> {
  await assertEditor();
  return guarded(async () => {
    if (!UUID_PATTERN.test(id)) return { ok: false, error: "Événement invalide." };
    return (await deleteCalendarEvent(id)) ? { ok: true, message: "Événement supprimé." } : { ok: false, error: "Cet événement n'existe plus." };
  });
}
