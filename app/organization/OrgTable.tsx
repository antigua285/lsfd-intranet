import { Avatar } from "@/components/Avatar";
import { indentPx, levelStyle } from "@/lib/org-levels";
import { holderParts, type OrgRow } from "@/lib/org-types";

/** Affichage en lecture seule de l'organigramme (le même pour tout le monde). */
export function OrgTable({ rows }: { rows: OrgRow[] }) {
  const notes = rows.filter((row) => row.noteNumber !== null);

  return (
    <div className="font-['Calibri','Arial',sans-serif]">
      <div className="border border-slate-300 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sr-only">
            <tr>
              <th>Structure</th>
              <th>Poste et titulaire</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const style = levelStyle(row.depth);
              const parts = holderParts(row);
              // Une ligne vide avant chaque grande rubrique, comme dans le PDF
              const spacer = index > 0 && row.depth <= 1;
              return (
                <RowGroup key={row.id} spacer={spacer}>
                  <tr className={`${style.row} border-b border-slate-200/70`}>
                    <td
                      className={`px-2 py-[3px] align-middle w-1/2 ${style.title}`}
                      style={{ paddingLeft: 8 + indentPx(row.depth) }}
                    >
                      {row.title}
                      {row.noteNumber !== null && (
                        <a
                          href={`#note-${row.noteNumber}`}
                          className="ml-1 font-normal normal-case text-[11px] text-[#c00d0d] hover:underline"
                          title="Voir la note"
                        >
                          [{row.noteNumber}]
                        </a>
                      )}
                    </td>
                    <td className={`px-2 py-[3px] align-middle ${style.holder}`}>
                      {parts && (
                        <span className="inline-flex items-center gap-1.5">
                          {row.holderUserId && (
                            <Avatar
                              src={row.holderAvatarUrl}
                              firstName={row.holderFirstName ?? "?"}
                              lastName={row.holderLastName ?? "?"}
                              className="w-5 h-5 text-[9px]"
                            />
                          )}
                          {parts.vacant ? (
                            <span className="italic">Vacant{parts.role && ` (${parts.role})`}</span>
                          ) : (
                            <span>
                              <span className="italic">{parts.name}</span>
                              {parts.role && <span className="font-normal"> ({parts.role})</span>}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                </RowGroup>
              );
            })}
          </tbody>
        </table>
      </div>

      {notes.length > 0 && (
        <section className="mt-6" aria-label="Notes">
          <h2 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Notes</h2>
          <ol className="flex flex-col gap-2">
            {notes.map((row) => (
              <li
                key={row.id}
                id={`note-${row.noteNumber}`}
                className="text-[12px] text-slate-700 leading-snug scroll-mt-4"
              >
                <span className="font-bold text-[#c00d0d]">[{row.noteNumber}]</span>{" "}
                <span className="font-bold">{row.title} :</span>{" "}
                <span className="whitespace-pre-line">{row.note}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/** Insère éventuellement une ligne d'espacement avant une ligne du tableau. */
function RowGroup({ spacer, children }: { spacer: boolean; children: React.ReactNode }) {
  return (
    <>
      {spacer && (
        <tr aria-hidden="true">
          <td colSpan={2} className="h-2 bg-white" />
        </tr>
      )}
      {children}
    </>
  );
}
