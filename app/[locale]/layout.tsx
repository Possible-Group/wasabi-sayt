import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : defaultLocale;

  const settings = await prisma.botSetting.findMany({
    where: { key: { in: ["site_enabled", "lang_ru_enabled", "lang_uz_enabled"] } },
  });

  const map: Record<string, string> = {};
  for (const setting of settings) map[setting.key] = setting.value;

  const siteEnabled = (map["site_enabled"] ?? "1") === "1";
  const langRuEnabled = (map["lang_ru_enabled"] ?? "1") === "1";
  const langUzEnabled = (map["lang_uz_enabled"] ?? "1") === "1";
  const hasEnabledLang = langRuEnabled || langUzEnabled;
  const localeEnabled = locale === "ru" ? langRuEnabled : langUzEnabled;

  if (hasEnabledLang && !localeEnabled) {
    const fallback: Locale = langRuEnabled ? "ru" : "uz";
    redirect(`/${fallback}`);
  }

  // ❗ HTML/BODY bu yerda bo'lmaydi (root layout’da bor)
  if (!siteEnabled) {
    return (
      <div className="ws-page">
        <main className="site-main">
          <div className="ws-container site-section">
            <div className="site-card" style={{ maxWidth: 560 }}>
              <span className="site-eyebrow">Wasabi</span>
              <h1 className="site-title" style={{ marginTop: 12 }}>
                {locale === "uz" ? "Sayt vaqtincha yopiq" : "Сайт временно недоступен"}
              </h1>
              <p className="site-subtitle" style={{ marginTop: 10 }}>
                {locale === "uz"
                  ? "Texnik ishlar ketmoqda. Keyinroq qayta urinib ko'ring."
                  : "Проводятся технические работы. Попробуйте зайти позже."}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
