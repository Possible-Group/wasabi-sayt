import ru from "@/lib/i18n/dictionaries/ru";
import { uz } from "@/lib/i18n/dictionaries/uz";
import type { Locale } from "@/lib/i18n/config";

const dict = { ru, uz } as const;

export function t(locale: Locale): typeof dict[Locale];
export function t(locale: Locale, path: string, fallback?: string): string;
export function t(locale: Locale, path?: string, fallback?: string) {
  const root = dict[locale];
  if (!path) return root;
  const parts = path.split(".");
  let current: any = root;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return fallback ?? path;
    }
  }
  return typeof current === "string" ? current : fallback ?? path;
}
