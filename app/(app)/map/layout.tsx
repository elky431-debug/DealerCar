/** Plein écran : pas de scroll sur le main, hauteur 100 % pour la carte */
export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
  );
}
