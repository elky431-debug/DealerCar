"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

interface Props {
  vehicleId: string;
  initial: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ vehicleId, initial, className, size = "md" }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isFav, setIsFav] = useState(initial);
  const [, startTransition] = useTransition();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    setIsFav((v) => !v);
    if (isFav) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("dealer_id", userId)
        .eq("vehicle_id", vehicleId);
      if (error) {
        setIsFav(true);
        toast.error("Impossible de retirer", error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ dealer_id: userId, vehicle_id: vehicleId });
      if (error && !error.message.includes("duplicate")) {
        setIsFav(false);
        toast.error("Impossible d'ajouter", error.message);
        return;
      }
    }
    startTransition(() => router.refresh());
  }

  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cn(
        "inline-flex items-center justify-center rounded-full border bg-background/90 shadow-sm transition-colors backdrop-blur",
        dim,
        isFav
          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      <Heart className={cn(icon, isFav && "fill-current")} />
    </button>
  );
}
