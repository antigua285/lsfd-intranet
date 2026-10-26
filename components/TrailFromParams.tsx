import { Breadcrumb } from "./Breadcrumb";
import { parseFrom, trailFor, type TrailPage } from "@/lib/nav";

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

/** Fil d'Ariane des pages qui dépendent de ?from= (à placer dans un <Suspense>). */
export async function TrailFromParams({ page, searchParams, detailLabel }: { page: TrailPage; searchParams: SP; detailLabel?: string }) {
  const from = parseFrom((await searchParams).from);
  return <Breadcrumb items={trailFor(page, from, detailLabel)} />;
}
