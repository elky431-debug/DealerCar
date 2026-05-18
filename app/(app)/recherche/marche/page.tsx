"use client";

import { useCallback, useRef, useState } from "react";
import {
  buildAutoScout24SearchUrl,
  type AutoScout24Params,
} from "@/lib/autoscout24";

const MAKES = [
  "BMW",
  "Peugeot",
  "Renault",
  "Citroën",
  "Volkswagen",
  "Mercedes",
  "Audi",
  "Ford",
  "Toyota",
  "Opel",
  "Dacia",
  "Fiat",
  "Seat",
  "Skoda",
  "Nissan",
  "Hyundai",
  "Kia",
  "Volvo",
  "Porsche",
  "Land Rover",
];

const inputClass =
  "rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:border-brand/40 focus:bg-white focus:outline-none";

export default function MarchePage() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [mileageTo, setMileageTo] = useState("");
  const [fuel, setFuel] = useState<AutoScout24Params["fuel"] | "">("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("50");
  const [showIframe, setShowIframe] = useState(false);
  const [searchUrl, setSearchUrl] = useState("");
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const buildParams = useCallback((): AutoScout24Params => {
    const parsedRadius = radius ? parseInt(radius, 10) : 50;
    return {
      make: make || undefined,
      model: model || undefined,
      yearFrom: yearFrom ? parseInt(yearFrom, 10) : undefined,
      yearTo: yearTo ? parseInt(yearTo, 10) : undefined,
      priceFrom: priceFrom ? parseInt(priceFrom, 10) : undefined,
      priceTo: priceTo ? parseInt(priceTo, 10) : undefined,
      mileageTo: mileageTo ? parseInt(mileageTo, 10) : undefined,
      fuel: fuel || undefined,
      zip: zip || undefined,
      radius: parsedRadius,
    };
  }, [make, model, yearFrom, yearTo, priceFrom, priceTo, mileageTo, fuel, zip, radius]);

  const handleSearch = () => {
    const url = buildAutoScout24SearchUrl(buildParams());
    setSearchUrl(url);
    setIframeBlocked(false);
    setShowIframe(true);
  };

  const handleOpenExternal = () => {
    const url = searchUrl || buildAutoScout24SearchUrl(buildParams());
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument;
      if (doc && doc.body && doc.body.childElementCount === 0) {
        setIframeBlocked(true);
      }
    } catch {
      // Cross-origin chargé : iframe probablement OK (X-Frame autorisé ou page AS24)
    }
  };

  return (
    <div className="flex h-[calc(100vh-52px)] flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-6 py-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Critères de recherche
        </p>

        <div className="mb-4 grid grid-cols-5 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Marque</label>
            <select value={make} onChange={(e) => setMake(e.target.value)} className={inputClass}>
              <option value="">Toutes marques</option>
              {MAKES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Modèle</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="ex: 308, X3..."
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Année de</label>
            <input
              type="number"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              placeholder="2018"
              min={2000}
              max={2026}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Année jusqu&apos;à</label>
            <input
              type="number"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              placeholder="2026"
              min={2000}
              max={2026}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Prix min €</label>
            <input
              type="number"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
              placeholder="5 000"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Prix max €</label>
            <input
              type="number"
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
              placeholder="30 000"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Km max</label>
            <input
              type="number"
              value={mileageTo}
              onChange={(e) => setMileageTo(e.target.value)}
              placeholder="100 000"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Carburant</label>
            <select
              value={fuel}
              onChange={(e) => setFuel(e.target.value as AutoScout24Params["fuel"] | "")}
              className={inputClass}
            >
              <option value="">Tous</option>
              <option value="essence">Essence</option>
              <option value="diesel">Diesel</option>
              <option value="hybride">Hybride</option>
              <option value="electrique">Électrique</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Code postal</label>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="75001, 69000..."
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Rayon (km)</label>
            <select value={radius} onChange={(e) => setRadius(e.target.value)} className={inputClass}>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
              <option value="100">100 km</option>
              <option value="200">200 km</option>
              <option value="0">France entière</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSearch}
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.5" />
              <path
                d="M9.5 9.5l2.5 2.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Rechercher sur AutoScout24
          </button>

          {showIframe && (
            <button
              type="button"
              onClick={handleOpenExternal}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M6 2H2v10h10V8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M8 2h4v4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M14 0L8 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Ouvrir sur AutoScout24 ↗
            </button>
          )}
        </div>
      </div>

      {showIframe && searchUrl && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-2.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <p className="text-sm font-medium text-gray-900">Résultats AutoScout24</p>
              <span className="text-xs text-gray-400">— France</span>
            </div>
            <div className="flex items-center gap-3">
              {!iframeBlocked && (
                <button
                  type="button"
                  onClick={() => setIframeBlocked(true)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  L&apos;iframe ne s&apos;affiche pas ?
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenExternal}
                className="text-xs font-medium text-brand hover:text-brand/80"
              >
                Plein écran ↗
              </button>
            </div>
          </div>

          {iframeBlocked ? (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
              <p className="mb-3 text-2xl">🚗</p>
              <p className="mb-2 text-sm font-medium text-gray-900">
                AutoScout24 ne peut pas être affiché ici
              </p>
              <p className="mb-5 text-sm text-gray-400">
                Cliquez sur le bouton ci-dessous pour ouvrir les résultats dans un nouvel onglet
                avec tous vos filtres.
              </p>
              <button
                type="button"
                onClick={handleOpenExternal}
                className="rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand/90"
              >
                Voir les annonces sur AutoScout24 →
              </button>
              <p className="mt-3 break-all px-4 text-xs text-gray-400">{searchUrl}</p>
              <button
                type="button"
                onClick={() => setIframeBlocked(false)}
                className="mt-4 text-xs text-brand hover:underline"
              >
                Réessayer l&apos;iframe
              </button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <iframe
                ref={iframeRef}
                src={searchUrl}
                className="flex-1 w-full border-0"
                style={{ height: "100%" }}
                title="Recherche AutoScout24"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                onLoad={handleIframeLoad}
              />
            </div>
          )}
        </div>
      )}

      {!showIframe && (
        <div className="flex flex-1 flex-col items-center justify-center border-t border-gray-100 bg-white">
          <p className="mb-4 text-4xl">🔍</p>
          <p className="mb-1 text-sm font-medium text-gray-900">
            Recherchez des véhicules sur le marché
          </p>
          <p className="text-sm text-gray-400">
            Renseignez vos critères ci-dessus et lancez la recherche pour voir les annonces
            AutoScout24 en temps réel.
          </p>
        </div>
      )}
    </div>
  );
}
