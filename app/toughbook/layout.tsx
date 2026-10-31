import type { Metadata } from "next";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { requireUser } from "@/lib/auth";
import { Taskbar } from "./Taskbar";
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
            <div className="flex items-center gap-3 px-4 h-10 shrink-0 bg-black/40 border-b border-white/10 text-[13px]">
              <span className="font-bold tracking-widest text-[#ff5a5a]">LSFD</span>
              <span className="font-bold tracking-wide">MDC</span>
              <span className="text-white/50 hidden sm:inline">Mobile Data Computer</span>
              <span className="flex-1" />
              <Suspense fallback={null}>
                <Operator />
              </Suspense>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
            <Taskbar />
          </div>
        </div>
        <span className="mdc-brand" aria-hidden="true">Panoramic</span>
      </div>
    </div>
  );
}

async function Operator() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-2" data-testid="mdc-operator">
      <Avatar src={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} className="w-7 h-7 text-[10px]" />
      <span className="text-white/90">{user.grade} <strong>{user.firstName} {user.lastName}</strong></span>
      <span className="text-white/50 hidden md:inline">· {user.station}</span>
    </div>
  );
}
