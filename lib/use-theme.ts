"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const STORAGE_KEY = "dealerlink-theme";

function getSystemPreference(): Resolved {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStored(): Theme {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved: Resolved = theme === "system" ? getSystemPreference() : theme;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<Resolved>("light");

  // Initial sync depuis le localStorage
  useEffect(() => {
    const stored = readStored();
    setThemeState(stored);
    const r: Resolved = stored === "system" ? getSystemPreference() : stored;
    setResolved(r);
  }, []);

  // Quand thème = "system", on suit l'OS
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const r: Resolved = mq.matches ? "dark" : "light";
      setResolved(r);
      applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    const r: Resolved = next === "system" ? getSystemPreference() : next;
    setResolved(r);
    applyTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  return { theme, resolved, setTheme, toggle };
}

/**
 * Snippet à injecter inline dans <head> pour appliquer le bon thème
 * AVANT le premier paint, et éviter le flash blanc/noir.
 */
export const NO_FLASH_SCRIPT = `
(function(){try{
  var k='${STORAGE_KEY}';
  var s=localStorage.getItem(k);
  var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  var d=document.documentElement;
  if(t==='dark')d.classList.add('dark');
  d.style.colorScheme=t;
}catch(e){}})();
`;
