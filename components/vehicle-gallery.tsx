"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { cn, publicImageUrl } from "@/lib/utils";
import type { VehicleImage } from "@/lib/types";

export function VehicleGallery({
  images,
  alt,
}: {
  images: VehicleImage[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/30 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="h-8 w-8 opacity-60" />
          <span className="text-xs">Aucune photo</span>
        </div>
      </div>
    );
  }

  function go(delta: number) {
    setActive((a) => (a + delta + images.length) % images.length);
  }

  return (
    <div className="space-y-3">
      {/* Image principale */}
      <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-[0_1px_2px_hsl(var(--foreground)/0.06)]">
        <Image
          src={publicImageUrl(images[active].storage_path)}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Vignette dégradée bas pour lisibilité */}
        {images.length > 1 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent"
          />
        )}

        {images.length > 1 && (
          <>
            <NavBtn
              direction="prev"
              onClick={() => go(-1)}
            />
            <NavBtn
              direction="next"
              onClick={() => go(1)}
            />

            {/* Compteur */}
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium tracking-tight text-white backdrop-blur-md ring-1 ring-white/10">
              <span className="tabular-nums">{active + 1}</span>
              <span className="opacity-50">/</span>
              <span className="tabular-nums opacity-80">{images.length}</span>
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {images.map((img, i) => {
            const isActive = i === active;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Photo ${i + 1}`}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg bg-muted transition-all duration-150",
                  isActive
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "ring-1 ring-border/70 opacity-80 hover:opacity-100",
                )}
              >
                <Image
                  src={publicImageUrl(img.storage_path)}
                  alt=""
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavBtn({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? "Photo précédente" : "Photo suivante"}
      className={cn(
        "absolute top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground/90 shadow-lg ring-1 ring-black/5 backdrop-blur-md transition-all duration-150 hover:bg-white hover:scale-105 active:scale-95",
        isPrev ? "left-3" : "right-3",
      )}
    >
      {isPrev ? (
        <ChevronLeft className="h-5 w-5" />
      ) : (
        <ChevronRight className="h-5 w-5" />
      )}
    </button>
  );
}
