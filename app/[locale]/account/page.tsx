"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";

type ClientProfile = {
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
    newPasswordLabel: "Новый пароль",
    smsCodeLabel: "Код из SMS",
    birthdayLabel: "Дата рождения",
    birthdayDay: "День",
    birthdayMonth: "Месяц",
    birthdayYear: "Год",
    loginBtn: "Войти",
    registerBtn: "Зарегистрироваться",
    sendCodeBtn: "Отправить код",
    forgotPassword: "Забыли пароль?",
    resetPasswordBtn: "Сбросить пароль",
    verifyCodeBtn: "Подтвердить код",
    closeBtn: "Закрыть",
    codePopupTitleRegister: "Подтверждение регистрации",
    codePopupTitleReset: "Подтверждение сброса пароля",
    codePopupText: "Введите код из SMS, чтобы продолжить.",
    codeSaved: "Код подтвержден.",
    profileTitle: "Профиль",
    bonusLabel: "Бонусы",
    logout: "Выйти",
    phonePlaceholder: "+998 90 123 45 67",
    namePlaceholder: "Ваше имя",
    passwordPlaceholder: "Введите пароль",
    smsCodePlaceholder: "123456",
    birthdayPlaceholder: "1995-05-20",
    forgotText: "Введите телефон, код из SMS и новый пароль.",
    smsSent: "Код отправлен по SMS.",
    resetSuccess: "Пароль обновлён. Теперь можно войти.",
    clientNotFound: "Клиент не найден. Зарегистрируйтесь.",
    invalidCredentials: "Неверный номер или пароль.",
    clientAlreadyRegistered: "Номер уже зарегистрирован. Войдите.",
    invalidPhone: "Некорректный номер телефона.",
    passwordTooShort: "Пароль должен быть минимум 8 символов.",
    smsCodeRequired: "Введите код из SMS.",
    smsCodeInvalid: "Неверный код из SMS.",
    smsCodeExpired: "Срок действия кода истёк. Запросите новый.",
    smsCodeNotFound: "Сначала запросите код из SMS.",
    smsCodeTooManyAttempts: "Слишком много попыток. Запросите новый код.",
    smsResendTooEarly: "Подождите минуту перед повторной отправкой.",
    smsServiceUnavailable: "SMS-сервис временно недоступен.",
    smsSendFailed: "Не удалось отправить SMS. Попробуйте позже.",
    smsTemplateNotApproved: "Текст SMS не прошел модерацию в Eskiz. Сначала добавьте шаблон в my.eskiz.uz.",
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
    newPasswordLabel: "Yangi parol",
    smsCodeLabel: "SMS kodi",
    birthdayLabel: "Tug'ilgan sana",
    birthdayDay: "Kun",
    birthdayMonth: "Oy",
    birthdayYear: "Yil",
    loginBtn: "Kirish",
    registerBtn: "Ro'yxatdan o'tish",
    sendCodeBtn: "Kod yuborish",
    forgotPassword: "Parolni unutdingizmi?",
    resetPasswordBtn: "Parolni tiklash",
    verifyCodeBtn: "Kodni tasdiqlash",
    closeBtn: "Yopish",
    codePopupTitleRegister: "Ro'yxatdan o'tishni tasdiqlash",
    codePopupTitleReset: "Parol tiklashni tasdiqlash",
    codePopupText: "Davom etish uchun SMS kodni kiriting.",
    codeSaved: "Kod tasdiqlandi.",
    profileTitle: "Profil",
    bonusLabel: "Bonuslar",
    logout: "Chiqish",
    phonePlaceholder: "+998 90 123 45 67",
    namePlaceholder: "Ismingiz",
    passwordPlaceholder: "Parolni kiriting",
    smsCodePlaceholder: "123456",
    birthdayPlaceholder: "1995-05-20",
    forgotText: "Telefon, SMS kod va yangi parolni kiriting.",
    smsSent: "Kod SMS orqali yuborildi.",
    resetSuccess: "Parol yangilandi. Endi tizimga kirishingiz mumkin.",
    clientNotFound: "Mijoz topilmadi. Ro'yxatdan o'ting.",
    invalidCredentials: "Telefon yoki parol noto'g'ri.",
    clientAlreadyRegistered: "Bu raqam allaqachon ro'yxatdan o'tgan. Kirishingiz mumkin.",
    invalidPhone: "Telefon raqami noto'g'ri.",
    passwordTooShort: "Parol kamida 8 ta belgidan iborat bo'lishi kerak.",
    smsCodeRequired: "SMS kodni kiriting.",
    smsCodeInvalid: "SMS kod noto'g'ri.",
    smsCodeExpired: "Kodning muddati tugagan. Yangisini oling.",
    smsCodeNotFound: "Avval SMS kod so'rang.",
    smsCodeTooManyAttempts: "Urinishlar soni oshib ketdi. Yangi kod oling.",
    smsResendTooEarly: "Qayta yuborishdan oldin bir daqiqa kuting.",
    smsServiceUnavailable: "SMS xizmati vaqtincha ishlamayapti.",
    smsSendFailed: "SMS yuborilmadi. Keyinroq urinib ko'ring.",
    smsTemplateNotApproved: "Eskizda SMS matni moderatsiyadan o'tmagan. Avval shablonni my.eskiz.uz da tasdiqlang.",
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

function sanitizeProfileName(value: string) {
  const normalized = String(value || "").replace(/\r?\n+/g, " ").trim();
  if (!normalized) return "";
  return normalized.replace(/^id\s*[:#-]?\s*\d+\s*/i, "").trim();
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
  const [notice, setNotice] = useState<string | null>(null);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regBirthDay, setRegBirthDay] = useState("");
  const [regBirthMonth, setRegBirthMonth] = useState("");
  const [regBirthYear, setRegBirthYear] = useState("");
  const [regSmsCode, setRegSmsCode] = useState("");

  const [showForgot, setShowForgot] = useState(false);
  const [resetPhone, setResetPhone] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [smsModalKind, setSmsModalKind] = useState<"register" | "reset" | null>(null);
  const [smsModalCode, setSmsModalCode] = useState("");
  const smsModalInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    setResetPhone(loginPhone);
  }, [loginPhone]);

  useEffect(() => {
    if (!smsModalKind) return;
    const id = window.setTimeout(() => {
      smsModalInputRef.current?.focus();
    }, 10);
    return () => window.clearTimeout(id);
  }, [smsModalKind]);

  const bonusLabel = useMemo(() => formatNumber(client?.bonus || 0, locale), [client?.bonus, locale]);
  const profileName = useMemo(() => sanitizeProfileName(client?.name || ""), [client?.name]);
  const currentYear = new Date().getFullYear();
  const birthdayYears = useMemo(
    () => Array.from({ length: 100 }, (_, idx) => String(currentYear - idx)),
    [currentYear]
  );
  const birthdayMonths = useMemo(
    () => Array.from({ length: 12 }, (_, idx) => String(idx + 1).padStart(2, "0")),
    []
  );
  const birthdayDays = useMemo(() => {
    const year = Number(regBirthYear || "2000");
    const month = Number(regBirthMonth || "1");
    const max = new Date(year, month, 0).getDate();
    return Array.from({ length: max }, (_, idx) => String(idx + 1).padStart(2, "0"));
  }, [regBirthMonth, regBirthYear]);
  const regBirthday = useMemo(() => {
    if (!regBirthDay || !regBirthMonth || !regBirthYear) return "";
    return `${regBirthYear}-${regBirthMonth}-${regBirthDay}`;
  }, [regBirthDay, regBirthMonth, regBirthYear]);

  useEffect(() => {
    if (!regBirthDay) return;
    if (!birthdayDays.includes(regBirthDay)) {
      setRegBirthDay("");
    }
  }, [birthdayDays, regBirthDay]);

  function getErrorText(errorCode?: string) {
    switch (errorCode) {
      case "CLIENT_NOT_FOUND":
        return copy.clientNotFound;
      case "INVALID_CREDENTIALS":
        return copy.invalidCredentials;
      case "CLIENT_ALREADY_REGISTERED":
        return copy.clientAlreadyRegistered;
      case "INVALID_PHONE":
        return copy.invalidPhone;
      case "PASSWORD_TOO_SHORT":
        return copy.passwordTooShort;
      case "BIRTHDAY_REQUIRED":
        return copy.birthdayRequired;
      case "BIRTHDAY_MISMATCH":
        return copy.birthdayMismatch;
      case "SMS_CODE_REQUIRED":
        return copy.smsCodeRequired;
      case "SMS_CODE_INVALID":
        return copy.smsCodeInvalid;
      case "SMS_CODE_EXPIRED":
        return copy.smsCodeExpired;
      case "SMS_CODE_NOT_FOUND":
        return copy.smsCodeNotFound;
      case "SMS_CODE_TOO_MANY_ATTEMPTS":
        return copy.smsCodeTooManyAttempts;
      case "SMS_RESEND_TOO_EARLY":
      case "RATE_LIMITED":
        return copy.smsResendTooEarly;
      case "SMS_NOT_CONFIGURED":
        return copy.smsServiceUnavailable;
      case "SMS_SEND_FAILED":
        return copy.smsSendFailed;
      case "SMS_TEMPLATE_NOT_APPROVED":
        return copy.smsTemplateNotApproved;
      default:
        return locale === "uz" ? "Xatolik" : "Ошибка";
    }
  }

  async function handleLogin() {
    if (!loginPhone.trim() || !loginPassword.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
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
        } else {
          setError(getErrorText(data?.error));
        }
        return;
      }
      setClient(data?.client || null);
    } catch {
      setError(getErrorText());
    } finally {
      setBusy(false);
    }
  }

  async function handleSendRegisterCode() {
    if (!regPhone.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const r = await fetch("/api/auth/client/register/send-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: regPhone.trim(), locale }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        setError(getErrorText(data?.error));
        return;
      }
      setSmsModalCode(regSmsCode);
      setSmsModalKind("register");
      setNotice(copy.smsSent);
    } catch {
      setError(getErrorText());
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister() {
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) return;
    if (!regSmsCode.trim()) {
      setError(copy.smsCodeRequired);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const r = await fetch("/api/auth/client/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          phone: regPhone.trim(),
          birthday: regBirthday || "",
          password: regPassword.trim(),
          smsCode: regSmsCode.trim(),
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        setError(getErrorText(data?.error));
        return;
      }
      setClient(data?.client || null);
      setLoginPhone(regPhone.trim());
      setLoginPassword("");
      setRegPassword("");
      setRegSmsCode("");
    } catch {
      setError(getErrorText());
    } finally {
      setBusy(false);
    }
  }

  async function handleSendResetCode() {
    if (!resetPhone.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const r = await fetch("/api/auth/client/password/send-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: resetPhone.trim(), locale }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        setError(getErrorText(data?.error));
        return;
      }
      setSmsModalCode(resetCode);
      setSmsModalKind("reset");
      setNotice(copy.smsSent);
    } catch {
      setError(getErrorText());
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    if (!resetPhone.trim() || !resetCode.trim() || !resetPassword.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const r = await fetch("/api/auth/client/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: resetPhone.trim(),
          code: resetCode.trim(),
          password: resetPassword.trim(),
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        setError(getErrorText(data?.error));
        return;
      }
      setClient(data?.client || null);
      setShowForgot(false);
      setResetCode("");
      setResetPassword("");
      setLoginPhone(resetPhone.trim());
      setLoginPassword("");
      setNotice(copy.resetSuccess);
    } catch {
      setError(getErrorText());
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fetch("/api/auth/client/logout", { method: "POST" });
      setClient(null);
    } finally {
      setBusy(false);
    }
  }

  function handleApplySmsCode() {
    const normalizedCode = smsModalCode.replace(/\D/g, "").slice(0, 8);
    if (!normalizedCode) {
      setError(copy.smsCodeRequired);
      return;
    }
    if (smsModalKind === "register") {
      setRegSmsCode(normalizedCode);
    } else if (smsModalKind === "reset") {
      setResetCode(normalizedCode);
    }
    setError(null);
    setNotice(copy.codeSaved);
    setSmsModalKind(null);
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
                  <div className="account-name">{profileName || (locale === "uz" ? "Mehmon" : "Гость")}</div>
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
                      onClick={() => {
                        setMode("login");
                        setError(null);
                        setNotice(null);
                      }}
                    >
                      {copy.loginTitle}
                    </button>
                    <button
                      type="button"
                      className={`account-tab${mode === "register" ? " is-active" : ""}`}
                      onClick={() => {
                        setMode("register");
                        setError(null);
                        setNotice(null);
                      }}
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
                        <div className="account-password">
                          <input
                            className="account-input"
                            type={showLoginPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder={copy.passwordPlaceholder}
                          />
                          <button
                            type="button"
                            className="account-password__toggle"
                            aria-label={showLoginPassword ? "Скрыть пароль" : "Показать пароль"}
                            aria-pressed={showLoginPassword}
                            onClick={() => setShowLoginPassword((prev) => !prev)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                              {!showLoginPassword && (
                                <path
                                  d="M4 4l16 16"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                />
                              )}
                            </svg>
                          </button>
                        </div>
                      </label>
                      <button
                        type="button"
                        className="site-button site-button--ghost account-forgot-toggle"
                        onClick={() => {
                          setShowForgot((prev) => !prev);
                          setError(null);
                          setNotice(null);
                        }}
                      >
                        {copy.forgotPassword}
                      </button>
                      {showForgot && (
                        <div className="account-forgot">
                          <div className="account-card__text">{copy.forgotText}</div>
                          <label className="account-field">
                            {copy.phoneLabel}
                            <input
                              className="account-input"
                              type="tel"
                              inputMode="tel"
                              value={resetPhone}
                              onChange={(e) => setResetPhone(e.target.value)}
                              placeholder={copy.phonePlaceholder}
                            />
                          </label>
                          <label className="account-field">
                            {copy.newPasswordLabel}
                            <div className="account-password">
                              <input
                                className="account-input"
                                type={showResetPassword ? "text" : "password"}
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                                placeholder={copy.passwordPlaceholder}
                              />
                              <button
                                type="button"
                                className="account-password__toggle"
                                aria-label={showResetPassword ? "Скрыть пароль" : "Показать пароль"}
                                aria-pressed={showResetPassword}
                                onClick={() => setShowResetPassword((prev) => !prev)}
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                  <path
                                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                                  {!showResetPassword && (
                                    <path
                                      d="M4 4l16 16"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.7"
                                      strokeLinecap="round"
                                    />
                                  )}
                                </svg>
                              </button>
                            </div>
                          </label>
                          <div className="account-inline-actions">
                            <button
                              type="button"
                              className="site-button site-button--ghost"
                              disabled={busy}
                              onClick={handleSendResetCode}
                            >
                              {copy.sendCodeBtn}
                            </button>
                            <button
                              type="button"
                              className="site-button site-button--ghost"
                              disabled={busy}
                              onClick={() => {
                                setSmsModalCode(resetCode);
                                setSmsModalKind("reset");
                                setError(null);
                              }}
                            >
                              {copy.smsCodeLabel}
                            </button>
                            <button
                              type="button"
                              className="site-button site-button--primary"
                              disabled={busy}
                              onClick={handleResetPassword}
                            >
                              {copy.resetPasswordBtn}
                            </button>
                          </div>
                        </div>
                      )}
                      {notice && <div className="account-message">{notice}</div>}
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
                        <div className="account-password">
                          <input
                            className="account-input"
                            type={showRegPassword ? "text" : "password"}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder={copy.passwordPlaceholder}
                          />
                          <button
                            type="button"
                            className="account-password__toggle"
                            aria-label={showRegPassword ? "Скрыть пароль" : "Показать пароль"}
                            aria-pressed={showRegPassword}
                            onClick={() => setShowRegPassword((prev) => !prev)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                              {!showRegPassword && (
                                <path
                                  d="M4 4l16 16"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                />
                              )}
                            </svg>
                          </button>
                        </div>
                      </label>
                      <button
                        type="button"
                        className="site-button site-button--ghost"
                        disabled={busy}
                        onClick={handleSendRegisterCode}
                      >
                        {copy.sendCodeBtn}
                      </button>
                      <button
                        type="button"
                        className="site-button site-button--ghost"
                        disabled={busy}
                        onClick={() => {
                          setSmsModalCode(regSmsCode);
                          setSmsModalKind("register");
                          setError(null);
                        }}
                      >
                        {copy.smsCodeLabel}
                      </button>
                      <label className="account-field">
                        {copy.birthdayLabel}
                        <div className="account-birthday-grid">
                          <select
                            className="account-input"
                            value={regBirthDay}
                            onChange={(e) => setRegBirthDay(e.target.value)}
                          >
                            <option value="">{copy.birthdayDay}</option>
                            {birthdayDays.map((day) => (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                          <select
                            className="account-input"
                            value={regBirthMonth}
                            onChange={(e) => setRegBirthMonth(e.target.value)}
                          >
                            <option value="">{copy.birthdayMonth}</option>
                            {birthdayMonths.map((month) => (
                              <option key={month} value={month}>
                                {month}
                              </option>
                            ))}
                          </select>
                          <select
                            className="account-input"
                            value={regBirthYear}
                            onChange={(e) => setRegBirthYear(e.target.value)}
                          >
                            <option value="">{copy.birthdayYear}</option>
                            {birthdayYears.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </label>
                      {notice && <div className="account-message">{notice}</div>}
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
      {smsModalKind && (
        <div className="account-code-popup" role="dialog" aria-modal="true" aria-labelledby="sms-code-popup-title">
          <div className="account-code-popup__card">
            <h3 id="sms-code-popup-title" className="account-code-popup__title">
              {smsModalKind === "register" ? copy.codePopupTitleRegister : copy.codePopupTitleReset}
            </h3>
            <p className="account-code-popup__text">{copy.codePopupText}</p>
            <label className="account-field">
              {copy.smsCodeLabel}
              <input
                ref={smsModalInputRef}
                className="account-input"
                inputMode="numeric"
                value={smsModalCode}
                onChange={(e) => setSmsModalCode(e.target.value)}
                placeholder={copy.smsCodePlaceholder}
              />
            </label>
            <div className="account-inline-actions">
              <button type="button" className="site-button site-button--primary" onClick={handleApplySmsCode}>
                {copy.verifyCodeBtn}
              </button>
              <button
                type="button"
                className="site-button site-button--ghost"
                onClick={() => setSmsModalKind(null)}
              >
                {copy.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer locale={locale} />
    </div>
  );
}
