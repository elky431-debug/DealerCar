"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { GarageForm } from "./garage-form";
import { GaragePublicTab } from "./garage-public-tab";
import type { Profile } from "@/lib/types";
import type { ProfileInput } from "@/lib/validators";

const TABS = [
  { id: "profile" as const, label: "Informations" },
  { id: "public" as const, label: "🌐 Garage public" },
];

interface Props {
  userId: string;
  email: string;
  profile: Profile | null;
  defaults: ProfileInput;
}

export function GarageTabs({ userId, email, profile, defaults }: Props) {
  const [tab, setTab] = useState<"profile" | "public">("profile");

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <GarageForm userId={userId} email={email} defaults={defaults} />
      ) : (
        <GaragePublicTab userId={userId} email={email} profile={profile} />
      )}
    </div>
  );
}
