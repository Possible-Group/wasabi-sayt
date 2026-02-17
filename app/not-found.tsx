import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="site-main">
      <div className="ws-container" style={{ padding: "56px 0" }}>
        <section className="site-card" style={{ maxWidth: 680, margin: "0 auto" }}>
          <p className="site-eyebrow">404</p>
          <h1 className="site-title">Страница не найдена</h1>
          <p className="site-subtitle">
            Такой страницы нет или она была перемещена.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/ru" className="site-button site-button--primary">
              На главную
            </Link>
            <Link href="/ru/menu" className="site-button site-button--ghost">
              Открыть меню
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
