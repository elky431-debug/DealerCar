import { useEffect, useRef } from "react";

/**
 * Appelle `fn` avec le dernier argument après `delay` ms d'inactivité.
 * Utile pour autosave : on déclenche un save à chaque frappe, le hook
 * coalesce et n'envoie qu'une requête.
 *
 *   const debouncedSave = useDebouncedCallback((payload) => fetch(...), 800);
 *   debouncedSave({ ... });
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  delay = 600,
): (...args: TArgs) => void {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (...args: TArgs) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void ref.current(...args);
    }, delay);
  };
}
