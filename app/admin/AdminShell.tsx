"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ADMIN_TOAST_EVENT, type AdminToastDetail } from "@/lib/admin/adminToast";

type AdminNavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/settings", label: "Настройки" },
  { href: "/admin/translations", label: "Переводы" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/content", label: "Контент" },
  { href: "/admin/news", label: "Новости" },
  { href: "/admin/reviews", label: "Отзывы" },
  { href: "/admin/account", label: "Аккаунт" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminLogin, setAdminLogin] = useState<string | null>(null);
  const [toasts, setToasts] = useState<
    { id: string; message: string; tone: "success" | "error" | "info" }[]
  >([]);
  const toastTimers = useRef<Map<string, number>>(new Map());
  const isLogin = pathname?.startsWith("/admin/login");

  useEffect(() => {
    if (isLogin) return;
    fetch("/api/auth/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setAdminLogin(data?.admin?.login || null))
      .catch(() => setAdminLogin(null));
  }, [isLogin]);

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<AdminToastDetail>).detail;
      if (!detail?.message) return;
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const tone = detail.tone ?? "success";
      setToasts((prev) => {
        const next = [...prev, { id, message: detail.message, tone }];
        if (next.length > 4) {
          const removed = next.shift();
          if (removed) {
            const timer = toastTimers.current.get(removed.id);
            if (timer) window.clearTimeout(timer);
            toastTimers.current.delete(removed.id);
          }
        }
        return next;
      });
      const duration = typeof detail.duration === "number" ? detail.duration : 2400;
      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        toastTimers.current.delete(id);
      }, duration);
      toastTimers.current.set(id, timer);
    }

    window.addEventListener(ADMIN_TOAST_EVENT, handleToast as EventListener);
    return () => {
      window.removeEventListener(ADMIN_TOAST_EVENT, handleToast as EventListener);
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      toastTimers.current.clear();
    };
  }, []);

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) window.clearTimeout(timer);
    toastTimers.current.delete(id);
  }

  const links = useMemo(
    () =>
      NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-link${active ? " active" : ""}`}
          >
            {item.label}
          </Link>
        );
      }),
    [pathname]
  );

  async function logout() {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (isLogin) {
    return <div className="admin-login">{children}</div>;
  }

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-brand">Wasabi Admin</div>
        <nav className="admin-nav">{links}</nav>
        <div className="admin-meta">
          <div>{adminLogin ? `Вход: ${adminLogin}` : "Сессия активна"}</div>
          <button className="admin-button admin-button-muted" onClick={logout}>
            Выйти
          </button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
      {toasts.length > 0 ? (
        <div className="admin-toast-stack" role="status" aria-live="polite">
          {toasts.map((toast) => {
            const icon = toast.tone === "error" ? "!" : toast.tone === "info" ? "i" : "OK";
            return (
              <div
                key={toast.id}
                className={`admin-toast admin-toast--${toast.tone}`}
                onClick={() => dismissToast(toast.id)}
              >
                <div className={`admin-toast__icon admin-toast__icon--${toast.tone}`}>
                  {icon}
                </div>
                <div className="admin-toast__text">{toast.message}</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
