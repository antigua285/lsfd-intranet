export function MissingTableNotice({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
      <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
      {isAdmin ? (
        <>
          Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC (une
          seule fois), puis recharge cette page.
        </>
      ) : (
        "Cette page n'est pas encore disponible. Un modérateur doit finir l'installation."
      )}
    </div>
  );
}
