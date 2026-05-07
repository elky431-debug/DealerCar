import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { NO_FLASH_SCRIPT } from "@/lib/use-theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DealerLink — Réseau et gestion véhicules pour marchands auto",
  description:
    "Centralisez votre stock, gérez vos dépôts-ventes et trouvez des véhicules dans le réseau marchand.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
