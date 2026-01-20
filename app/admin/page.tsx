import Link from "next/link";

const quickLinks = [
  {
    title: "Настройки",
    href: "/admin/settings",
    description: "Часы работы, сборы и переключатели языков.",
  },
  {
    title: "Переводы",
    href: "/admin/translations",
    description: "Управление переводами RU to UZ.",
  },
  {
    title: "Категории",
    href: "/admin/categories",
    description: "Переводы категорий и SEO-настройки.",
  },
  {
    title: "Контент",
    href: "/admin/content",
    description: "Баннеры и контентные страницы.",
  },
  {
    title: "Новости",
    href: "/admin/news",
    description: "Новости на сайте, SEO и изображения.",
  },
  {
    title: "Отзывы",
    href: "/admin/reviews",
    description: "Отзывы клиентов на сайте.",
  },
  {
    title: "Аккаунт",
    href: "/admin/account",
    description: "Смена логина и пароля администратора.",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="admin-container stack-lg">
      <div className="stack">
        <h1 className="admin-title">Дашборд</h1>
        <p className="admin-subtitle">Быстрый доступ к основным разделам админки.</p>
      </div>

      <section className="admin-grid">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href} className="admin-card stack">
            <div className="stack">
              <div className="admin-pill">Перейти</div>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
            </div>
            <div className="admin-subtitle">{item.description}</div>
          </Link>
        ))}
      </section>

      <section className="admin-card stack">
        <div style={{ fontWeight: 600 }}>Подсказки</div>
        <div className="admin-subtitle">
          Пользуйтесь навигацией слева для перехода между разделами. Регулярно
          обновляйте логин и пароль администратора.
        </div>
      </section>
    </div>
  );
}
