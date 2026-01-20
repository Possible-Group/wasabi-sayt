"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";

type ClientProfile = {
  id: string;
  name: string;
  phone: string;
  bonus: number;
};

  const COPY = {
    ru: {
    eyebrow: "Аккаунт",
    title: "Личный кабинет",
    subtitle: "Войдите или зарегистрируйтесь, чтобы копить бонусы.",
    loginTitle: "Вход",
    loginText: "Введите номер телефона и пароль для входа.",
    registerTitle: "Регистрация",
    registerText: "Создайте профиль и начните копить бонусы.",
    nameLabel: "Имя",
    phoneLabel: "Телефон",
    passwordLabel: "Пароль",
    birthdayLabel: "Дата рождения",
    loginBtn: "Войти",
    registerBtn: "Зарегистрироваться",
    profileTitle: "Профиль",
    bonusLabel: "Бонусы",
    logout: "Выйти",
    phonePlaceholder: "+998 90 123 45 67",
    namePlaceholder: "Ваше имя",
    passwordPlaceholder: "Введите пароль",
    birthdayPlaceholder: "1995-05-20",
    clientNotFound: "Клиент не найден. Зарегистрируйтесь.",
    invalidCredentials: "Неверный номер или пароль.",
    clientAlreadyRegistered: "Номер уже зарегистрирован. Войдите.",
    invalidPhone: "Некорректный номер телефона.",
    passwordTooShort: "Пароль должен быть минимум 8 символов.",
    birthdayRequired: "Введите дату рождения для подтверждения.",
    birthdayMismatch: "Дата рождения не совпадает с данными в Poster.",
  },
  uz: {
    eyebrow: "Profil",
    title: "Shaxsiy kabinet",
    subtitle: "Kirish yoki ro'yxatdan o'ting va bonuslar yig'ing.",
    loginTitle: "Kirish",
    loginText: "Kirish uchun telefon raqamingiz va parolingizni kiriting.",
    registerTitle: "Ro'yxatdan o'tish",
    registerText: "Profil yarating va bonuslar yig'ishni boshlang.",
    nameLabel: "Ism",
    phoneLabel: "Telefon",
    passwordLabel: "Parol",
    birthdayLabel: "Tug'ilgan sana",
    loginBtn: "Kirish",
    registerBtn: "Ro'yxatdan o'tish",
    profileTitle: "Profil",
    bonusLabel: "Bonuslar",
    logout: "Chiqish",
    phonePlaceholder: "+998 90 123 45 67",
    namePlaceholder: "Ismingiz",
    passwordPlaceholder: "Parolni kiriting",
    birthdayPlaceholder: "1995-05-20",
    clientNotFound: "Mijoz topilmadi. Ro'yxatdan o'ting.",
    invalidCredentials: "Telefon yoki parol noto'g'ri.",
    clientAlreadyRegistered: "Bu raqam allaqachon ro'yxatdan o'tgan. Kirishingiz mumkin.",
    invalidPhone: "Telefon raqami noto'g'ri.",
    passwordTooShort: "Parol kamida 8 ta belgidan iborat bo'lishi kerak.",
    birthdayRequired: "Tasdiqlash uchun tug'ilgan sanani kiriting.",
    birthdayMismatch: "Tug'ilgan sana Poster ma'lumotlariga mos kelmadi.",
  },
};

function formatNumber(value: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : "ru-RU").format(value);
  } catch {
    return String(value);
  }
}

export default function AccountPage() {
  const routeParams = useParams();
  const rawLocale = Array.isArray(routeParams?.locale)
    ? routeParams.locale[0]
    : routeParams?.locale;
  const localeParam = typeof rawLocale === "string" ? rawLocale : "";
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = locale === "uz" ? COPY.uz : COPY.ru;

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBirthday, setRegBirthday] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/auth/client/me")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setClient(data?.client || null);
      })
      .catch(() => {
        if (!active) return;
        setClient(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const bonusLabel = useMemo(() => formatNumber(client?.bonus || 0, locale), [client?.bonus, locale]);

  async function handleLogin() {
    if (!loginPhone.trim() || !loginPassword.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/client/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: loginPhone.trim(), password: loginPassword.trim() }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        if (data?.error === "CLIENT_NOT_FOUND") {
          setError(copy.clientNotFound);
          setMode("register");
          setRegPhone(loginPhone.trim());
        } else if (data?.error === "INVALID_CREDENTIALS") {
          setError(copy.invalidCredentials);
        } else if (data?.error === "INVALID_PHONE") {
          setError(copy.invalidPhone);
        } else if (data?.error === "PASSWORD_TOO_SHORT") {
          setError(copy.passwordTooShort);
        } else {
          setError("Ошибка");
        }
        return;
      }
      setClient(data?.client || null);
    } catch {
      setError("Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister() {
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/client/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          phone: regPhone.trim(),
          birthday: regBirthday || "",
          password: regPassword.trim(),
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        if (data?.error === "CLIENT_ALREADY_REGISTERED") {
          setError(copy.clientAlreadyRegistered);
        } else if (data?.error === "INVALID_PHONE") {
          setError(copy.invalidPhone);
        } else if (data?.error === "PASSWORD_TOO_SHORT") {
          setError(copy.passwordTooShort);
        } else if (data?.error === "BIRTHDAY_REQUIRED") {
          setError(copy.birthdayRequired);
        } else if (data?.error === "BIRTHDAY_MISMATCH") {
          setError(copy.birthdayMismatch);
        } else {
          setError("Ошибка");
        }
        return;
      }
      setClient(data?.client || null);
      setLoginPhone(regPhone.trim());
      setLoginPassword("");
      setRegPassword("");
    } catch {
      setError("Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/auth/client/logout", { method: "POST" });
      setClient(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ws-page">
      <Header locale={locale} />
      <main className="site-main">
        <section className="site-section">
          <div className="ws-container">
            <div className="site-section__head">
              <div>
                <span className="site-eyebrow">{copy.eyebrow}</span>
                <h1 className="site-title">{copy.title}</h1>
                <p className="site-subtitle">{copy.subtitle}</p>
              </div>
            </div>

            {loading ? (
              <div className="site-card account-card">{locale === "uz" ? "Yuklanmoqda..." : "Загрузка..."}</div>
            ) : client ? (
              <div className="account-grid">
                <div className="site-card account-card account-profile">
                  <div className="account-pill">ID: {client.id}</div>
                  <div className="account-name">{client.name || (locale === "uz" ? "Mehmon" : "Гость")}</div>
                  <div className="account-phone">{client.phone}</div>
                  <div className="account-bonus">
                    <span>{copy.bonusLabel}</span>
                    <strong>{bonusLabel}</strong>
                  </div>
                  {error && <div className="account-message is-error">{error}</div>}
                  <div className="account-actions">
                    <button className="site-button site-button--primary" disabled={busy} onClick={handleLogout}>
                      {copy.logout}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="account-grid">
                <div className="site-card account-card">
                  <div className="account-tabs" role="tablist">
                    <button
                      type="button"
                      className={`account-tab${mode === "login" ? " is-active" : ""}`}
                      onClick={() => setMode("login")}
                    >
                      {copy.loginTitle}
                    </button>
                    <button
                      type="button"
                      className={`account-tab${mode === "register" ? " is-active" : ""}`}
                      onClick={() => setMode("register")}
                    >
                      {copy.registerTitle}
                    </button>
                  </div>

                  {mode === "login" ? (
                    <>
                      <div className="account-card__title">{copy.loginTitle}</div>
                      <div className="account-card__text">{copy.loginText}</div>
                      <label className="account-field">
                        {copy.phoneLabel}
                        <input
                          className="account-input"
                          type="tel"
                          inputMode="tel"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          placeholder={copy.phonePlaceholder}
                        />
                      </label>
                      <label className="account-field">
                        {copy.passwordLabel}
                        <input
                          className="account-input"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder={copy.passwordPlaceholder}
                        />
                      </label>
                      {error && <div className="account-message is-error">{error}</div>}
                      <button
                        className="site-button site-button--primary"
                        disabled={busy}
                        onClick={handleLogin}
                      >
                        {copy.loginBtn}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="account-card__title">{copy.registerTitle}</div>
                      <div className="account-card__text">{copy.registerText}</div>
                      <label className="account-field">
                        {copy.nameLabel}
                        <input
                          className="account-input"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder={copy.namePlaceholder}
                        />
                      </label>
                      <label className="account-field">
                        {copy.phoneLabel}
                        <input
                          className="account-input"
                          type="tel"
                          inputMode="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder={copy.phonePlaceholder}
                        />
                      </label>
                      <label className="account-field">
                        {copy.passwordLabel}
                        <input
                          className="account-input"
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder={copy.passwordPlaceholder}
                        />
                      </label>
                      <label className="account-field">
                        {copy.birthdayLabel}
                        <input
                          className="account-input"
                          type="date"
                          value={regBirthday}
                          onChange={(e) => setRegBirthday(e.target.value)}
                          placeholder={copy.birthdayPlaceholder}
                        />
                      </label>
                      {error && <div className="account-message is-error">{error}</div>}
                      <button
                        className="site-button site-button--ghost"
                        disabled={busy}
                        onClick={handleRegister}
                      >
                        {copy.registerBtn}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
