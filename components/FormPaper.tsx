"use client";

import { forwardRef, useState } from "react";
import { answerText, type FormContent, type FormField } from "@/lib/forms-types";

/** Format Letter (8,5 × 11 pouces) à 96 dpi : sert au PDF et au PNG. */
export const PAPER_WIDTH = 816;
export const PAPER_HEIGHT = 1056;
export const PAPER_MARGIN = 48;

type Props = {
  content: FormContent;
  answers?: Record<string, string>;
  labels?: Record<string, string>;
};

type Row = FormField[];

/** Les champs « demi-largeur » consécutifs se placent côte à côte, comme sur les formulaires papier. */
function toRows(fields: FormField[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const next = fields[i + 1];
    if (f.width === "half" && next?.width === "half") {
      rows.push([f, next]);
      i++;
    } else rows.push([f]);
  }
  return rows;
}

const INK = "#000";

/**
 * Le « papier officiel » : en-tête (sceau + titre + sous-titre), sections en gras, champs
 * soulignés, note de bas de page. Un seul composant pour l'aperçu, le rapport reçu, le PDF et le PNG.
 * Les styles sont écrits en ligne pour que l'export soit identique à l'écran.
 */
export const FormPaper = forwardRef<HTMLDivElement, Props>(function FormPaper(
  { content, answers = {}, labels = {} },
  ref
) {
  const [sealOk, setSealOk] = useState(true);
  const rows = toRows(content.definition.fields);

  return (
    <div
      ref={ref}
      data-testid="form-paper"
      style={{
        width: PAPER_WIDTH,
        minHeight: PAPER_HEIGHT,
        boxSizing: "border-box",
        padding: `${PAPER_MARGIN}px 56px`,
        background: "#fff",
        color: INK,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 14,
        lineHeight: 1.35,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div data-row style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 22 }}>
        <div style={{ width: 96, height: 96, flexShrink: 0 }}>
          {sealOk && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/seal.png"
              alt=""
              width={96}
              height={96}
              style={{ width: 96, height: 96, objectFit: "contain", display: "block" }}
              onError={() => setSealOk(false)}
            />
          )}
        </div>
        <div style={{ flex: 1, paddingTop: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 19, textTransform: "uppercase" }}>{content.title}</div>
          {content.subtitle && <div style={{ fontSize: 16, marginTop: 2 }}>{content.subtitle}</div>}
          {content.headerLines.map((line, i) => (
            <div key={i} style={{ fontSize: 14, marginTop: 2 }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {rows.map((row) => (
        <PaperRow key={row[0].id} row={row} answers={answers} labels={labels} />
      ))}

      {content.footer && (
        <div data-row style={{ marginTop: "auto", paddingTop: 28, fontSize: 12, fontStyle: "italic", whiteSpace: "pre-wrap" }}>
          {content.footer}
        </div>
      )}
    </div>
  );
});

function PaperRow({ row, answers, labels }: { row: Row; answers: Record<string, string>; labels: Record<string, string> }) {
  const first = row[0];
  if (first.type === "heading") {
    return (
      <div data-row style={{ fontWeight: 700, fontSize: 15, textTransform: "uppercase", marginTop: 22, marginBottom: 10 }}>
        {first.label}
      </div>
    );
  }
  if (first.type === "note") {
    return (
      <div data-row style={{ fontSize: 12, fontStyle: "italic", margin: "4px 0 10px", whiteSpace: "pre-wrap" }}>
        {first.label}
      </div>
    );
  }
  if (first.type === "long") {
    return (
      <div data-row style={{ margin: "6px 0 12px" }}>
        <div style={{ marginBottom: 2 }}>{first.label}:</div>
        <div
          style={{
            minHeight: 96,
            lineHeight: "24px",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            padding: "0 2px",
            // lignes d'écriture, comme sur le papier
            backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 23px, #444 23px, #444 24px)",
          }}
        >
          {answerText(first, answers, labels)}
        </div>
      </div>
    );
  }
  return (
    <div data-row style={{ display: "flex", gap: 24, margin: "8px 0" }}>
      {row.map((field) => (
        <div key={field.id} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ flexShrink: 0 }}>{field.label}:</span>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 20,
              borderBottom: `1px solid ${INK}`,
              padding: "0 4px",
              overflowWrap: "anywhere",
            }}
          >
            {answerText(field, answers, labels)}
          </span>
        </div>
      ))}
      {row.length === 1 && first.width === "half" && <div style={{ flex: 1 }} />}
    </div>
  );
}
