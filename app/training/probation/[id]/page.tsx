import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getUserById, type PublicUser } from "@/lib/users";
import { getUserFlags } from "@/lib/access";
import { notFound, redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { UUID_PATTERN } from "@/lib/validation";
import { getNotebook, getTemplate, isMissingProbationTableError, listComments, type Comment, type NotebookRow, type TemplateCategory } from "@/lib/probation";
import { NotebookView } from "./NotebookView";

export const metadata = { title: "Carnet de probation | LSFD Intranet" };

export default function NotebookPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  let nb: NotebookRow | null = null;
  let template: TemplateCategory[] = [];
  let comments: Comment[] = [];
  try {
    nb = await getNotebook(id);
    // Un carnet n'est lisible que par la TD (archivé ou non) et par son propriétaire tant qu'il est actif.
    if (!nb || !(isTrainer(ctx) || (nb.userId === ctx.user.id && !nb.archivedAt))) notFound();
    [template, comments] = await Promise.all([getTemplate(), listComments(id)]);
  } catch (error) {
    if (!isMissingProbationTableError(error)) throw error;
    return <p className="text-[13px] text-slate-600">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</p>;
  }
  const trainer = isTrainer(ctx);
  const archived = !!nb.archivedAt;
  // Profil en direct : une modification de grade, de station ou de photo se voit tout de suite dans le carnet.
  let profile: PublicUser | null = null;
  let flags: string[] = [];
  if (nb.userId) {
    try {
      [profile, flags] = await Promise.all([getUserById(nb.userId), getUserFlags(nb.userId)]);
    } catch {
      profile = null;
    }
  }
  return (
    <>
      <Breadcrumb
        items={
          trainer
            ? [{ label: "Formation", href: "/training" }, { label: "Espace TD", href: "/training/td" }, { label: "Probation", href: "/training/probation" }, ...(archived ? [{ label: "Archives", href: "/training/probation/archives" }] : []), { label: nb.ownerName }]
            : [{ label: "Formation", href: "/training" }, { label: "Mon carnet de probation" }]
        }
      />
      <ProfileHeader name={nb.ownerName} profile={profile} flags={flags} startedAt={nb.createdAt} />
      <NotebookView
        notebook={{ id: nb.id, ownerName: nb.ownerName, checked: nb.checked, createdAt: nb.createdAt, archivedAt: nb.archivedAt, archivedBy: nb.archivedBy }}
        categories={archived && nb.snapshot ? nb.snapshot.categories : template}
        comments={comments}
        trainer={trainer}
        canTick={trainer && !archived && nb.userId !== ctx.user.id}
        selfNotebook={nb.userId === ctx.user.id}
        currentUserId={ctx.user.id}
        isAdmin={ctx.user.isAdmin}
      />
    </>
  );
}

const dateFr = (value: string | Date) => new Date(value).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

function ProfileHeader({ name, profile, flags, startedAt }: { name: string; profile: PublicUser | null; flags: string[]; startedAt: string }) {
  const [first = "", ...rest] = (profile ? [profile.firstName, profile.lastName] : name.split(" "));
  const last = profile ? profile.lastName : rest.join(" ");
  const rows: [string, string][] = profile
    ? [
        ["Grade", profile.grade],
        ["Station", profile.station],
        ["Identifiant", profile.username],
        ...(profile.phone ? ([["Téléphone", profile.phone]] as [string, string][]) : []),
        ["Compte créé le", dateFr(profile.createdAt)],
        ["Probation depuis le", dateFr(startedAt)],
      ]
    : [["Probation depuis le", dateFr(startedAt)]];
  return (
    <section data-testid="profile-header" className="flex items-center gap-5 border border-slate-200 rounded-lg p-4 my-3 bg-white">
      <Avatar src={profile?.avatarUrl ?? null} firstName={first} lastName={last} className="w-24 h-24 text-3xl" />
      <div className="min-w-0">
        <p className="text-lg font-bold text-slate-800">{profile ? `${profile.firstName} ${profile.lastName}` : name}</p>
        {flags.length > 0 && (
          <p className="flex flex-wrap gap-1 mt-1">
            {flags.map((f) => <span key={f} className="text-[11px] font-bold rounded bg-slate-100 text-slate-700 px-1.5 py-0.5">{f}</span>)}
          </p>
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-0.5 text-[13px] mt-2">
          {rows.map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="text-slate-800">{v}</dd></div>
          ))}
        </dl>
        {!profile && <p className="text-[12px] text-slate-400 mt-1">Le compte n&apos;existe plus : seules les informations du carnet sont disponibles.</p>}
      </div>
    </section>
  );
}
