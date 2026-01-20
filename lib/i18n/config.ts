export const locales = ["ru", "uz"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}