import { GestionTabs } from "./gestion-tabs";

export const dynamic = "force-dynamic";

export default function GestionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GestionTabs />
      {children}
    </>
  );
}
