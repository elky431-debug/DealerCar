import { Sparkles } from "lucide-react";
import { PageBody, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  title: string;
  description: string;
  features: { icon: React.ComponentType<{ className?: string }>; label: string; desc: string }[];
}

export function V2Placeholder({ title, description, features }: Props) {
  return (
    <>
      <PageHeader eyebrow="Gestion · V2" title={title} description={description} />
      <PageBody>
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] sm:p-10">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/[0.06] blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-amber-500/[0.06] blur-3xl"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-inset ring-amber-200">
              <Sparkles className="h-3 w-3" />
              Disponible en V2
            </span>
            <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">
              Fonction disponible prochainement
            </h2>
            <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground">
              Nous finalisons cette fonctionnalité. Voici ce que vous pourrez bientôt faire :
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    className="flex gap-3 rounded-xl border border-border/60 bg-background p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05] text-foreground">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold tracking-tight">{f.label}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/garage/vehicules">
                <Button variant="secondary">Retour au garage</Button>
              </Link>
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
