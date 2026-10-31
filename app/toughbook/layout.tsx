import type { Metadata } from "next";
import "./toughbook.css";

export const metadata: Metadata = {
  title: "LSFD MDC",
  appleWebApp: { capable: true, title: "LSFD MDC", statusBarStyle: "black-translucent" },
};

export default function ToughbookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mdc-stage">
      <div className="mdc-shell">
        <span className="mdc-camera" aria-hidden="true" />
        <div className="mdc-bezel">
          <div className="mdc-screen" data-testid="mdc-screen">
            {children}
          </div>
        </div>
        <span className="mdc-brand" aria-hidden="true">Panoramic</span>
      </div>
    </div>
  );
}
