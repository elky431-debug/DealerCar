interface Props {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  inNetwork: number;
  totalValue: number;
}

export function StatsRibbon({
  total,
  available,
  reserved,
  sold,
  inNetwork,
  totalValue,
}: Props) {
  const valueShort = formatShortEUR(totalValue);
  const valueFull = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(totalValue);

  const today = new Date();
  const period = today
    .toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
    .replace(".", "")
    .toUpperCase();

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
      {/* Top eyebrow */}
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-2.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-foreground/70" />
          Aperçu garage
        </span>
        <span className="tabular text-foreground/55">{period}</span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y divide-border/50 sm:divide-x sm:divide-y-0">
        <KPI
          label="En stock"
          value={total.toString()}
          unit={`véhicule${total > 1 ? "s" : ""}`}
        />

        <KPI
          label="Valeur stock"
          value={valueShort}
          unit="estimée"
          title={valueFull}
        />

        <BreakdownKPI
          available={available}
          reserved={reserved}
          sold={sold}
          total={total}
        />

        <KPI
          label="Au réseau"
          value={inNetwork.toString()}
          unit={inNetwork > 1 ? "partagés" : "partagé"}
          accent={inNetwork > 0}
        />
      </div>
    </section>
  );
}

/* ---------- Sub-components ---------- */

function KPI({
  label,
  value,
  unit,
  accent = false,
  title,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  title?: string;
}) {
  return (
    <div className="px-5 py-4 sm:py-5">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-2 flex items-baseline gap-1.5 leading-none"
        title={title}
      >
        <span
          className={`text-[26px] font-semibold tabular tracking-[-0.02em] ${
            accent ? "text-foreground" : "text-foreground"
          }`}
        >
          {value}
        </span>
        <span className="text-[12.5px] text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function BreakdownKPI({
  available,
  reserved,
  sold,
  total,
}: {
  available: number;
  reserved: number;
  sold: number;
  total: number;
}) {
  const items = [
    { key: "D", label: "Dispo", count: available, intensity: 1 },
    { key: "R", label: "Résv", count: reserved, intensity: 0.55 },
    { key: "V", label: "Vendu", count: sold, intensity: 0.22 },
  ] as const;

  const max = Math.max(1, available, reserved, sold);

  return (
    <div className="px-5 py-4 sm:py-5">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Statuts
      </p>

      <div className="mt-2 flex items-end gap-3">
        {items.map((it) => {
          const h = total === 0 ? 0 : Math.max(0.18, it.count / max);
          return (
            <div key={it.key} className="flex flex-col items-center gap-1.5">
              {/* mini vertical bar (monochrome, opacities only) */}
              <div className="relative flex h-8 w-3 items-end rounded-sm bg-foreground/[0.06]">
                <span
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${h * 100}%`,
                    backgroundColor: `hsl(var(--foreground) / ${it.intensity})`,
                  }}
                />
              </div>
              <p className="flex flex-col items-center leading-none">
                <span className="text-[13px] font-semibold tabular tracking-tight text-foreground">
                  {it.count}
                </span>
                <span className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {it.label}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function formatShortEUR(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1).replace(".", ",")} M €`;
  }
  if (n >= 10_000) {
    return `${(n / 1_000).toFixed(0)} k €`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}
