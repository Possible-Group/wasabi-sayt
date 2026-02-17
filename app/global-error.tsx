"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: "Montserrat, sans-serif", background: "#f4f8e8" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <section
            style={{
              width: "100%",
              maxWidth: 720,
              borderRadius: 24,
              background: "#fff",
              border: "1px solid #dfe6cf",
              padding: 24,
            }}
          >
            <div style={{ fontWeight: 700, opacity: 0.75 }}>Критическая ошибка</div>
            <h1 style={{ margin: "8px 0 12px", fontSize: 32, lineHeight: 1.1 }}>
              Не удалось загрузить страницу
            </h1>
            <p style={{ margin: 0, opacity: 0.82 }}>
              {error?.message || "Внутренняя ошибка приложения."}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: 20,
                border: 0,
                borderRadius: 999,
                padding: "12px 18px",
                background: "#6ba915",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Перезагрузить
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
