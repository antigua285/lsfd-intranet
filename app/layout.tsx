import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { OfficialBanner } from "@/components/OfficialBanner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { HeaderUser, HeaderUserSkeleton } from "@/components/HeaderUser";
import { SidebarLinks, SidebarLinksSkeleton } from "@/components/SidebarLinks";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LSFD Intranet",
  description: "Los Santos Fire Department Internal Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col h-screen overflow-hidden bg-slate-100`}>
        <OfficialBanner />
        {/* Sur les pages à adresse dynamique (/reports/[id]…) l'URL n'est connue qu'à la requête : le menu est diffusé après coup. */}
        <Suspense fallback={null}>
        <DashboardLayout
          navSlot={
            <Suspense fallback={<SidebarLinksSkeleton />}>
              <SidebarLinks />
            </Suspense>
          }
          userSlot={
            // La session se lit à chaque requête : elle doit être derrière un Suspense
            <Suspense fallback={<HeaderUserSkeleton />}>
              <HeaderUser />
            </Suspense>
          }
        >
          {children}
        </DashboardLayout>
        </Suspense>
      </body>
    </html>
  );
}