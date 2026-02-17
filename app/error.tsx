"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <main className="site-main">
      <div className="ws-container" style={{ padding: "56px 0" }}>
        <section className="site-card" style={{ maxWidth: 720, margin: "0 auto" }}>
          <p className="site-eyebrow">Ошибка</p>
          <h1 className="site-title">Что-то пошло не так</h1>
          <p className="site-subtitle">
            Произошла внутренняя ошибка. Попробуйте обновить страницу.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              className="site-button site-button--primary"
            >
              Попробовать снова
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
