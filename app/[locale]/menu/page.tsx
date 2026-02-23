import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function MenuIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  redirect(`/${locale}#products`);
}
