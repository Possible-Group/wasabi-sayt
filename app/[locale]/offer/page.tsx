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
    title: "Публичная оферта",
    subtitle: "Условия оказания услуг общественного питания и доставки.",
    seoTitle: "Публичная оферта Wasabi Sushi",
    seoDescription: "Условия оказания услуг и доставки Wasabi Sushi.",
  },
  uz: {
    title: "Ommaviy oferta",
    subtitle: "Wasabi Sushi xizmatlari va yetkazib berish shartlari.",
    seoTitle: "Wasabi Sushi ommaviy ofertasi",
    seoDescription: "Wasabi Sushi xizmatlari va yetkazib berish shartlari.",
  },
};

const SECTIONS: Section[] = [
  {
    title: "1. Общие положения",
    paragraphs: [
      "1.1. Настоящий документ является официальным предложением (публичной офертой) Wasabi Sushi (далее — «Исполнитель») заключить договор оказания услуг общественного питания и доставки товаров дистанционным способом с любым дееспособным физическим лицом (далее — «Клиент»).",
      "1.2. Оформление заказа на сайте, в мобильном приложении или через Telegram-бот Wasabi Sushi означает полное и безоговорочное принятие (акцепт) условий настоящей оферты.",
      "1.3. Исполнитель оставляет за собой право вносить изменения в настоящую оферту без предварительного уведомления. Актуальная версия всегда доступна на сайте.",
    ],
  },
  {
    title: "2. Предмет договора",
    paragraphs: [
      "2.1. Исполнитель обязуется изготовить и передать Клиенту блюда японской кухни (суши, роллы и сопутствующие товары), а Клиент обязуется принять и оплатить заказ.",
      "2.2. Услуги оказываются путём самовывоза либо доставки по указанному Клиентом адресу в зоне обслуживания.",
    ],
  },
  {
    title: "3. Оформление и оплата заказа",
    paragraphs: [
      "3.1. Заказ оформляется Клиентом самостоятельно через сайт, мобильное приложение или Telegram-бот.",
      "3.2. Цены указаны в национальной валюте и являются актуальными на момент оформления заказа.",
      "3.3. Оплата возможна следующими способами:",
    ],
    lists: [
      {
        items: ["онлайн-оплата;", "наличными курьеру;", "иными способами, указанными на сайте."],
      },
    ],
  },
  {
    title: "4. Доставка и самовывоз",
    paragraphs: [
      "4.1. Сроки доставки носят ориентировочный характер и могут изменяться в зависимости от загруженности кухни, дорожной ситуации и иных факторов.",
      "4.2. Риск случайной утраты или повреждения товара переходит к Клиенту с момента передачи заказа.",
      "4.3. При самовывозе Клиент обязан забрать заказ в указанное время.",
    ],
  },
  {
    title: "5. Возврат и отмена",
    paragraphs: [
      "5.1. Продукция общественного питания надлежащего качества возврату и обмену не подлежит.",
      "5.2. В случае выявления недостатков Клиент обязан обратиться в службу поддержки в течение 1 (одного) часа с момента получения заказа.",
    ],
  },
  {
    title: "6. Права и обязанности сторон",
    lists: [
      {
        title: "6.1. Исполнитель обязуется:",
        items: [
          "готовить продукцию из качественных ингредиентов;",
          "соблюдать санитарные нормы;",
          "предоставить достоверную информацию о составе блюд.",
        ],
      },
      {
        title: "6.2. Клиент обязуется:",
        items: [
          "указывать корректные контактные данные;",
          "принять заказ своевременно;",
          "произвести оплату в полном объёме.",
        ],
      },
    ],
  },
  {
    title: "7. Ответственность сторон",
    paragraphs: [
      "7.1. Исполнитель не несёт ответственности за задержки, вызванные форс-мажорными обстоятельствами.",
      "7.2. Исполнитель не несёт ответственности за индивидуальные аллергические реакции Клиента при отсутствии предварительного уведомления.",
    ],
  },
  {
    title: "8. Заключительные положения",
    paragraphs: [
      "8.1. Все споры решаются путём переговоров, а при невозможности — в соответствии с действующим законодательством.",
      "8.2. Настоящая оферта вступает в силу с момента её публикации.",
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

export default async function OfferPage({
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
