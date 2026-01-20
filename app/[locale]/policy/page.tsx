import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";

type SectionList = {
  title?: string;
  items: string[];
};

type Section = {
  title: string;
  paragraphs?: string[];
  lists?: SectionList[];
};

const PAGE_COPY: Record<Locale, { title: string; subtitle: string; seoTitle: string; seoDescription: string }> = {
  ru: {
    title: "Политика конфиденциальности",
    subtitle: "Как мы собираем, используем и защищаем персональные данные.",
    seoTitle: "Политика конфиденциальности Wasabi Sushi",
    seoDescription: "Политика обработки и защиты персональных данных Wasabi Sushi.",
  },
  uz: {
    title: "Maxfiylik siyosati",
    subtitle: "Shaxsiy ma'lumotlarni yig'ish, ishlatish va himoya qilish tartibi.",
    seoTitle: "Wasabi Sushi maxfiylik siyosati",
    seoDescription: "Wasabi Sushi shaxsiy ma'lumotlarni qayta ishlash siyosati.",
  },
};

const SECTIONS: Section[] = [
  {
    title: "1. Общие положения",
    paragraphs: [
      "1.1. Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сайта, приложения и Telegram-бота Wasabi Sushi.",
      "1.2. Используя сервисы Wasabi Sushi, пользователь выражает согласие на обработку своих персональных данных.",
    ],
  },
  {
    title: "2. Какие данные мы собираем",
    paragraphs: ["2.1. Мы можем собирать следующие данные:"],
    lists: [
      {
        items: [
          "имя и фамилия;",
          "номер телефона;",
          "адрес доставки;",
          "данные о заказах;",
          "технические данные (IP-адрес, cookies, тип устройства).",
        ],
      },
    ],
  },
  {
    title: "3. Цели обработки данных",
    paragraphs: ["Персональные данные используются для:"],
    lists: [
      {
        items: [
          "обработки и доставки заказов;",
          "связи с клиентом;",
          "улучшения качества сервиса;",
          "выполнения требований законодательства.",
        ],
      },
    ],
  },
  {
    title: "4. Передача данных третьим лицам",
    paragraphs: ["4.1. Мы не передаём персональные данные третьим лицам, за исключением:"],
    lists: [
      {
        items: [
          "курьерских служб (только для доставки);",
          "платёжных систем;",
          "случаев, предусмотренных законом.",
        ],
      },
    ],
  },
  {
    title: "5. Защита данных",
    paragraphs: [
      "5.1. Мы применяем технические и организационные меры для защиты персональных данных от утечки, утраты и несанкционированного доступа.",
    ],
  },
  {
    title: "6. Cookies",
    paragraphs: [
      "6.1. Сайт использует cookies для корректной работы и аналитики. Пользователь может отключить cookies в настройках браузера.",
    ],
  },
  {
    title: "7. Права пользователя",
    paragraphs: ["Пользователь имеет право:"],
    lists: [
      {
        items: [
          "запросить информацию о своих данных;",
          "потребовать их исправления или удаления;",
          "отозвать согласие на обработку данных.",
        ],
      },
    ],
  },
  {
    title: "8. Изменения политики",
    paragraphs: [
      "8.1. Мы можем обновлять настоящую Политику без предварительного уведомления. Актуальная версия всегда доступна на сайте.",
    ],
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const copy = PAGE_COPY[locale];
  return {
    title: copy.seoTitle,
    description: copy.seoDescription,
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = isLocale(p.locale) ? p.locale : "ru";
  const copy = PAGE_COPY[locale];

  return (
    <div className="ws-page">
      <Header locale={locale} />

      <main className="site-main">
        <section className="site-section">
          <div className="ws-container">
            <p className="site-eyebrow">Wasabi Sushi</p>
            <h1 className="site-title">{copy.title}</h1>
            <p className="site-subtitle">{copy.subtitle}</p>

            <div className="site-grid" style={{ marginTop: 24 }}>
              {SECTIONS.map((section) => (
                <article key={section.title} className="site-card">
                  <div style={{ display: "grid", gap: 10 }}>
                    <div className="site-title" style={{ fontSize: 20 }}>
                      {section.title}
                    </div>
                    {section.paragraphs?.map((text) => (
                      <p key={text} className="site-subtitle" style={{ whiteSpace: "pre-wrap" }}>
                        {text}
                      </p>
                    ))}
                    {section.lists?.map((list, idx) => (
                      <div key={`${section.title}-${idx}`} style={{ display: "grid", gap: 8 }}>
                        {list.title ? <p className="site-subtitle">{list.title}</p> : null}
                        <ul style={{ display: "grid", gap: 6, margin: "0 0 0 18px" }}>
                          {list.items.map((item) => (
                            <li key={item} className="site-subtitle">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
