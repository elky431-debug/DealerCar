/** Génère un slug URL (aligné sur `generate_garage_slug` côté SQL). */
export function generateGarageSlug(name: string, city: string): string {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
