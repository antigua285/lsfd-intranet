import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { OfficialBanner } from "@/components/OfficialBanner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { HeaderUser, HeaderUserSkeleton } from "@/components/HeaderUser";

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
        <DashboardLayout
          userSlot={
            // La session se lit à chaque requête : elle doit être derrière un Suspense
            <Suspense fallback={<HeaderUserSkeleton />}>
              <HeaderUser />
            </Suspense>
          }
        >
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}