"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { deleteSubmission, setSubmissionStatus } from "@/lib/forms";
import { UUID_PATTERN } from "@/lib/validation";

function refresh(id: string) {
  revalidatePath("/admin/reports");
  revalidatePath(`/reports/${id}`);
  revalidatePath("/map");
}

export async function setReportStatusAction(id: string, status: string): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  if (typeof id !== "string" || !UUID_PATTERN.test(id) || (status !== "new" && status !== "reviewed")) {
    return { ok: false, error: "Demande invalide." };
  }
  const ok = await setSubmissionStatus(id, status);
  refresh(id);
  return ok ? { ok: true } : { ok: false, error: "Ce rapport n'existe plus." };
}

export async function deleteReportAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Demande invalide." };
  const ok = await deleteSubmission(id);
  refresh(id);
  return ok ? { ok: true } : { ok: false, error: "Ce rapport n'existe plus." };
}
