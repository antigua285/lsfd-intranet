/** Applications du Toughbook LSFD MDC (bureau Windows simplifié). `available: false` = pas encore disponible, non affichée. */
export type MdcApp = {
  key: "notepad" | "map" | "buildings" | "hazmat" | "protocols" | "command";
  title: string;
  /** Tracé d'icône (intérieur d'un <svg> 24×24). */
  glyph: string;
  /** Dégradé du fond de l'icône. */
  from: string;
  to: string;
  available: boolean;
};

export const MDC_APPS: MdcApp[] = [
  { key: "notepad", title: "Bloc-notes", available: true, from: "#3b82c4", to: "#1e5a96", glyph: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
  { key: "map", title: "Carte", available: true, from: "#3fa06a", to: "#1f6b45", glyph: "M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" },
  { key: "buildings", title: "Fiches bâtiments", available: false, from: "#c47a3b", to: "#96521e", glyph: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" },
  { key: "hazmat", title: "Matières dangereuses", available: false, from: "#d4a017", to: "#9a7000", glyph: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" },
  { key: "protocols", title: "Protocoles", available: false, from: "#b84a4a", to: "#802828", glyph: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08" },
  { key: "command", title: "Commandement", available: false, from: "#6a5acd", to: "#3f3399", glyph: "M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25" },
];

export const MDC_HOME = "/toughbook";
export const AVAILABLE_APPS = MDC_APPS.filter((a) => a.available);
