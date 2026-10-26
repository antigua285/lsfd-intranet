"use server";

import { revalidatePath } from "next/cache";
import { canSee, getAccessContext } from "@/lib/access";
import { getForm, isMissingFormsTableError, submitReport } from "@/lib/forms";
import { parseAnswers, parseAttachments } from "@/lib/forms-validation";
import { UUID_PATTERN } from "@/lib/validation";

export type SubmitFormResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Date du jour à Los Santos (fuseau America/Los_Angeles, AAAA-MM-JJ) : c'est elle qui sert aux règles « date d'envoi ». */
function todayInLosSantos(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

export async function submitFormAction(formId: string, rawAnswers: unknown, rawAttachments?: unknown): Promise<SubmitFormResult> {
  const ctx = await getAccessContext();
  if (!ctx) throw new Error("Session expirée, reconnecte-toi.");
  const me = ctx.user;
  if (typeof formId !== "string" || !UUID_PATTERN.test(formId)) return { ok: false, error: "Formulaire invalide." };

  try {
    const form = await getForm(formId);
    if (!form || !form.published || !canSee(ctx, form.flags)) return { ok: false, error: "Ce formulaire n'est plus disponible." };

    // Le formulaire est relu en base : le navigateur ne peut pas imposer sa propre structure.
    const { answers, errors } = parseAnswers(form.definition, rawAnswers);
    if (Object.keys(errors).length > 0) {
      return { ok: false, error: "Corrige les champs signalés.", fieldErrors: errors };
    }

    const attachments = parseAttachments(form.definition, rawAttachments);
    if (!attachments.ok) return { ok: false, error: attachments.error };

    const result = await submitReport({
      formId: form.id,
      content: {
        title: form.title,
        subtitle: form.subtitle,
        headerLines: form.headerLines,
        footer: form.footer,
        definition: form.definition,
      },
      answers,
      attachments: attachments.value,
      submitter: { id: me.id, name: `${me.firstName} ${me.lastName}` },
      flags: form.flags,
      todayIso: todayInLosSantos(),
    });
    if (result.ok) {
      revalidatePath("/admin/reports");
      revalidatePath("/forms");
      revalidatePath("/map");
    }
    return result;
  } catch (error) {
    if (isMissingFormsTableError(error)) {
      return { ok: false, error: "La base n'est pas à jour : un modérateur doit lancer `npm run db:setup`." };
    }
    throw error;
  }
}
