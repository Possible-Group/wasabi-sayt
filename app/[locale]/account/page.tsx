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

type AccountOrderItem = {
  productId: string;
  modificationId: string | null;
  quantity: number;
  totalMinor: number | null;
  name: string;
  nameUz: string | null;
};

type AccountOrder = {
  id: string;
  source: "incoming" | "transaction";
  status: "new" | "accepted" | "cancelled" | "closed";
  incomingOrderId: string | null;
  transactionId: string | null;
  serviceMode: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  closedAt: string | null;
  totalMinor: number | null;
  paymentType: number | null;
  discountPercent: number | null;
  items: AccountOrderItem[];
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
    confirmPasswordLabel: "Подтвердите пароль",
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
    savePasswordBtn: "Сохранить пароль",
    closeBtn: "Закрыть",
    codePopupTitleRegister: "Подтверждение регистрации",
    codePopupTitleReset: "Подтверждение сброса пароля",
    codePopupText: "Введите код из SMS, чтобы продолжить.",
    resetPopupTitle: "Новый пароль",
    resetPopupText: "Введите и подтвердите новый пароль.",
    codeSaved: "Код подтвержден.",
    profileTitle: "Профиль",
    bonusLabel: "Бонусы",
    logout: "Выйти",
    phonePlaceholder: "+998 90 123 45 67",
    namePlaceholder: "Ваше имя",
    passwordPlaceholder: "Введите пароль",
    smsCodePlaceholder: "123456",
    birthdayPlaceholder: "1995-05-20",
    forgotText: "Введите телефон. Мы отправим SMS и попросим подтвердить код.",
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
    passwordsMismatch: "Пароли не совпадают.",
    birthdayRequired: "Введите дату рождения для подтверждения.",
    birthdayMismatch: "Дата рождения не совпадает с данными в Poster.",
    guestName: "Гость",
    ordersTitle: "Мои заказы",
    ordersText: "История онлайн-заказов и чеков из Poster.",
    ordersLoading: "Загружаем историю заказов...",
    ordersEmpty: "Заказов пока нет.",
    ordersUnavailable: "Не удалось загрузить историю заказов.",
    orderNumber: "Заказ",
    receiptNumber: "Чек",
    linkedReceipt: "Связанный чек",
    orderCreatedAt: "Создан",
    orderUpdatedAt: "Обновлён",
    orderClosedAt: "Завершён",
    orderTotal: "Сумма",
    orderPendingTotal: "Уточняется",
    orderItems: "Состав",
    serviceModeLabel: "Тип",
    sourceIncoming: "Онлайн-заказ",
    sourceTransaction: "Чек",
    statusNew: "Новый",
    statusAccepted: "Принят",
    statusCancelled: "Отменён",
    statusClosed: "Завершён",
    serviceModeHall: "В заведении",
    serviceModePickup: "Самовывоз",
    serviceModeDelivery: "Доставка",
    itemFallback: "Товар",
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
    confirmPasswordLabel: "Parolni tasdiqlang",
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
    savePasswordBtn: "Parolni saqlash",
    closeBtn: "Yopish",
    codePopupTitleRegister: "Ro'yxatdan o'tishni tasdiqlash",
    codePopupTitleReset: "Parol tiklashni tasdiqlash",
    codePopupText: "Davom etish uchun SMS kodni kiriting.",
    resetPopupTitle: "Yangi parol",
    resetPopupText: "Yangi parolni kiriting va tasdiqlang.",
    codeSaved: "Kod tasdiqlandi.",
    profileTitle: "Profil",
    bonusLabel: "Bonuslar",
    logout: "Chiqish",
    phonePlaceholder: "+998 90 123 45 67",
    namePlaceholder: "Ismingiz",
    passwordPlaceholder: "Parolni kiriting",
    smsCodePlaceholder: "123456",
    birthdayPlaceholder: "1995-05-20",
    forgotText: "Telefonni kiriting. SMS yuboramiz va kodni tasdiqlaysiz.",
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
    passwordsMismatch: "Parollar mos kelmadi.",
    birthdayRequired: "Tasdiqlash uchun tug'ilgan sanani kiriting.",
    birthdayMismatch: "Tug'ilgan sana Poster ma'lumotlariga mos kelmadi.",
    guestName: "Mehmon",
    ordersTitle: "Buyurtmalarim",
    ordersText: "Poster'dagi onlayn buyurtmalar va chek tarixi.",
    ordersLoading: "Buyurtmalar tarixi yuklanmoqda...",
    ordersEmpty: "Hozircha buyurtmalar yo'q.",
    ordersUnavailable: "Buyurtmalar tarixini yuklab bo'lmadi.",
    orderNumber: "Buyurtma",
    receiptNumber: "Chek",
    linkedReceipt: "Bog'langan chek",
    orderCreatedAt: "Yaratilgan",
    orderUpdatedAt: "Yangilangan",
    orderClosedAt: "Yakunlangan",
    orderTotal: "Summa",
    orderPendingTotal: "Aniqlanmoqda",
    orderItems: "Tarkibi",
    serviceModeLabel: "Turi",
    sourceIncoming: "Onlayn buyurtma",
    sourceTransaction: "Chek",
    statusNew: "Yangi",
    statusAccepted: "Qabul qilingan",
    statusCancelled: "Bekor qilingan",
    statusClosed: "Yakunlangan",
    serviceModeHall: "Joyida",
    serviceModePickup: "Olib ketish",
    serviceModeDelivery: "Yetkazib berish",
    itemFallback: "Tovar",
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

function formatMoneyMinor(value: number | null, locale: Locale, fallback: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  try {
    const formatter = new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : "ru-RU", {
      maximumFractionDigits: 0,
    });
    return `${formatter.format(value / 100)} ${locale === "uz" ? "so'm" : "сум"}`;
  } catch {
    return fallback;
  }
}

function formatDateTime(value: string | null, locale: Locale) {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (!Number.isFinite(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return value;
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
  const [notice, setNotice] = useState<string | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

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

  const [showForgot, setShowForgot] = useState(false);
  const [resetPhone, setResetPhone] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [showResetPasswordPopup, setShowResetPasswordPopup] = useState(false);
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
    if (!client) {
      setOrders([]);
      setOrdersLoading(false);
      setOrdersError(null);
      return;
    }

    let active = true;
    setOrdersLoading(true);
    setOrdersError(null);

    fetch("/api/account/orders")
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "ORDER_HISTORY_UNAVAILABLE");
        return Array.isArray(data?.orders) ? (data.orders as AccountOrder[]) : [];
      })
      .then((data) => {
        if (!active) return;
        setOrders(data);
      })
      .catch(() => {
        if (!active) return;
        setOrders([]);
        setOrdersError(copy.ordersUnavailable);
      })
      .finally(() => {
        if (!active) return;
        setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [client, copy.ordersUnavailable]);

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

  function getOrderStatusText(status: AccountOrder["status"]) {
    switch (status) {
      case "accepted":
        return copy.statusAccepted;
      case "cancelled":
        return copy.statusCancelled;
      case "closed":
        return copy.statusClosed;
      default:
        return copy.statusNew;
    }
  }

  function getOrderSourceText(source: AccountOrder["source"]) {
    return source === "transaction" ? copy.sourceTransaction : copy.sourceIncoming;
  }

  function getServiceModeText(serviceMode: number | null) {
    if (serviceMode === 1) return copy.serviceModeHall;
    if (serviceMode === 2) return copy.serviceModePickup;
    if (serviceMode === 3) return copy.serviceModeDelivery;
    return "—";
  }

  function getOrderHeading(order: AccountOrder) {
    if (order.incomingOrderId) return `${copy.orderNumber} #${order.incomingOrderId}`;
    if (order.transactionId) return `${copy.receiptNumber} #${order.transactionId}`;
    return copy.ordersTitle;
  }

  function getOrderSubline(order: AccountOrder) {
    if (order.closedAt) return `${copy.orderClosedAt}: ${formatDateTime(order.closedAt, locale)}`;
    if (order.updatedAt) return `${copy.orderUpdatedAt}: ${formatDateTime(order.updatedAt, locale)}`;
    if (order.createdAt) return `${copy.orderCreatedAt}: ${formatDateTime(order.createdAt, locale)}`;
    return "—";
  }

  function getOrderItemName(item: AccountOrderItem) {
    const localized = locale === "uz" ? item.nameUz : null;
    return localized || item.name || `${copy.itemFallback} ${item.productId ? `#${item.productId}` : ""}`.trim();
  }

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
      case "PASSWORDS_MISMATCH":
        return copy.passwordsMismatch;
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

  async function completeRegister(smsCode: string) {
    const r = await fetch("/api/auth/client/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: regName.trim(),
        phone: regPhone.trim(),
        birthday: regBirthday || "",
        password: regPassword.trim(),
        smsCode,
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
    setSmsModalCode("");
    setSmsModalKind(null);
  }

  async function handleRegister() {
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) return;
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
        if (data?.error === "SMS_RESEND_TOO_EARLY") {
          setSmsModalCode("");
          setSmsModalKind("register");
          setNotice(copy.smsResendTooEarly);
          return;
        }
        setError(getErrorText(data?.error));
        return;
      }
      setSmsModalCode("");
      setSmsModalKind("register");
      setNotice(copy.smsSent);
    } catch {
      setError(getErrorText());
    } finally {
      setBusy(false);
    }
  }

  async function handleStartResetPassword() {
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
        if (data?.error === "SMS_RESEND_TOO_EARLY") {
          setShowForgot(false);
          setSmsModalCode("");
          setSmsModalKind("reset");
          setNotice(copy.smsResendTooEarly);
          return;
        }
        setError(getErrorText(data?.error));
        return;
      }
      setShowForgot(false);
      setSmsModalCode("");
      setSmsModalKind("reset");
      setNotice(copy.smsSent);
    } catch {
      setError(getErrorText());
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    const newPassword = resetPassword.trim();
    const confirmPassword = resetPasswordConfirm.trim();
    if (!resetPhone.trim() || !resetCode.trim() || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError(copy.passwordsMismatch);
      return;
    }
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
          password: newPassword,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        setError(getErrorText(data?.error));
        return;
      }
      setShowForgot(false);
      setShowResetPasswordPopup(false);
      setResetCode("");
      setResetPassword("");
      setResetPasswordConfirm("");
      setLoginPhone(resetPhone.trim());
      setLoginPassword("");
      setMode("login");
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

  async function handleApplySmsCode() {
    const normalizedCode = smsModalCode.replace(/\D/g, "").slice(0, 8);
    if (!normalizedCode) {
      setError(copy.smsCodeRequired);
      return;
    }
    if (smsModalKind === "register") {
      setBusy(true);
      setError(null);
      setNotice(null);
      try {
        await completeRegister(normalizedCode);
      } catch {
        setError(getErrorText());
      } finally {
        setBusy(false);
      }
      return;
    } else if (smsModalKind === "reset") {
      setResetCode(normalizedCode);
      setSmsModalKind(null);
      setSmsModalCode("");
      setResetPassword("");
      setResetPasswordConfirm("");
      setShowResetPassword(false);
      setShowResetPasswordConfirm(false);
      setShowResetPasswordPopup(true);
      setError(null);
      setNotice(null);
      return;
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
              <div className="site-card account-card">{copy.ordersLoading}</div>
            ) : client ? (
              <div className="account-grid">
                <div className="site-card account-card account-profile">
                  <div className="account-profile__eyebrow">
                    <span className="account-pill">{copy.profileTitle}</span>
                  </div>
                  <div className="account-name">{profileName || copy.guestName}</div>
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
                <div className="site-card account-card account-orders">
                  <div className="account-orders__head">
                    <div>
                      <div className="account-card__title">{copy.ordersTitle}</div>
                      <div className="account-card__text">{copy.ordersText}</div>
                    </div>
                    {!ordersLoading && !ordersError ? (
                      <div className="account-orders__count">{orders.length}</div>
                    ) : null}
                  </div>

                  {ordersLoading ? (
                    <div className="account-message">{copy.ordersLoading}</div>
                  ) : ordersError ? (
                    <div className="account-message is-error">{ordersError}</div>
                  ) : orders.length ? (
                    <div className="account-orders__list">
                      {orders.map((order) => (
                        <article key={order.id} className="account-order">
                          <div className="account-order__top">
                            <div>
                              <div className="account-order__title">{getOrderHeading(order)}</div>
                              <div className="account-order__sub">{getOrderSubline(order)}</div>
                            </div>
                            <div className="account-order__badges">
                              <span className="account-order__badge">{getOrderSourceText(order.source)}</span>
                              <span className={`account-order__badge is-${order.status}`}>
                                {getOrderStatusText(order.status)}
                              </span>
                            </div>
                          </div>

                          <div className="account-order__meta">
                            <div className="account-order__meta-row">
                              <span>{copy.orderTotal}</span>
                              <strong>{formatMoneyMinor(order.totalMinor, locale, copy.orderPendingTotal)}</strong>
                            </div>
                            {order.createdAt ? (
                              <div className="account-order__meta-row">
                                <span>{copy.orderCreatedAt}</span>
                                <strong>{formatDateTime(order.createdAt, locale)}</strong>
                              </div>
                            ) : null}
                            {order.updatedAt && order.updatedAt !== order.createdAt ? (
                              <div className="account-order__meta-row">
                                <span>{copy.orderUpdatedAt}</span>
                                <strong>{formatDateTime(order.updatedAt, locale)}</strong>
                              </div>
                            ) : null}
                            {order.closedAt && order.closedAt !== order.updatedAt ? (
                              <div className="account-order__meta-row">
                                <span>{copy.orderClosedAt}</span>
                                <strong>{formatDateTime(order.closedAt, locale)}</strong>
                              </div>
                            ) : null}
                            {order.serviceMode ? (
                              <div className="account-order__meta-row">
                                <span>{copy.serviceModeLabel}</span>
                                <strong>{getServiceModeText(order.serviceMode)}</strong>
                              </div>
                            ) : null}
                            {order.transactionId && order.incomingOrderId ? (
                              <div className="account-order__meta-row">
                                <span>{copy.linkedReceipt}</span>
                                <strong>#{order.transactionId}</strong>
                              </div>
                            ) : null}
                          </div>

                          <div className="account-order__items-wrap">
                            <div className="account-order__items-title">{copy.orderItems}</div>
                            {order.items.length ? (
                              <ul className="account-order__items">
                                {order.items.map((item, index) => (
                                  <li key={`${order.id}:${item.productId}:${index}`} className="account-order__item">
                                    <span className="account-order__item-name">{getOrderItemName(item)}</span>
                                    <strong className="account-order__item-qty">x{item.quantity}</strong>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="account-card__text">—</div>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="account-message">{copy.ordersEmpty}</div>
                  )}
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
                          setShowForgot(true);
                          setShowResetPasswordPopup(false);
                          setError(null);
                          setNotice(null);
                        }}
                      >
                        {copy.forgotPassword}
                      </button>
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
              <button
                type="button"
                className="site-button site-button--primary"
                disabled={busy}
                onClick={handleApplySmsCode}
              >
                {copy.verifyCodeBtn}
              </button>
              <button
                type="button"
                className="site-button site-button--ghost"
                disabled={busy}
                onClick={() => setSmsModalKind(null)}
              >
                {copy.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
      {showForgot && (
        <div className="account-code-popup" role="dialog" aria-modal="true" aria-labelledby="forgot-password-popup-title">
          <div className="account-code-popup__card">
            <h3 id="forgot-password-popup-title" className="account-code-popup__title">
              {copy.forgotPassword}
            </h3>
            <p className="account-code-popup__text">{copy.forgotText}</p>
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
            {error && <div className="account-message is-error">{error}</div>}
            <div className="account-inline-actions">
              <button
                type="button"
                className="site-button site-button--primary"
                disabled={busy}
                onClick={handleStartResetPassword}
              >
                {copy.resetPasswordBtn}
              </button>
              <button
                type="button"
                className="site-button site-button--ghost"
                disabled={busy}
                onClick={() => {
                  setShowForgot(false);
                  setError(null);
                  setNotice(null);
                }}
              >
                {copy.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
      {showResetPasswordPopup && (
        <div className="account-code-popup" role="dialog" aria-modal="true" aria-labelledby="reset-password-popup-title">
          <div className="account-code-popup__card">
            <h3 id="reset-password-popup-title" className="account-code-popup__title">
              {copy.resetPopupTitle}
            </h3>
            <p className="account-code-popup__text">{copy.resetPopupText}</p>
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
            <label className="account-field">
              {copy.confirmPasswordLabel}
              <div className="account-password">
                <input
                  className="account-input"
                  type={showResetPasswordConfirm ? "text" : "password"}
                  value={resetPasswordConfirm}
                  onChange={(e) => setResetPasswordConfirm(e.target.value)}
                  placeholder={copy.passwordPlaceholder}
                />
                <button
                  type="button"
                  className="account-password__toggle"
                  aria-label={showResetPasswordConfirm ? "Скрыть пароль" : "Показать пароль"}
                  aria-pressed={showResetPasswordConfirm}
                  onClick={() => setShowResetPasswordConfirm((prev) => !prev)}
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
                    {!showResetPasswordConfirm && (
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
            {error && <div className="account-message is-error">{error}</div>}
            <div className="account-inline-actions">
              <button
                type="button"
                className="site-button site-button--primary"
                disabled={busy}
                onClick={handleResetPassword}
              >
                {copy.savePasswordBtn}
              </button>
              <button
                type="button"
                className="site-button site-button--ghost"
                disabled={busy}
                onClick={() => {
                  setShowResetPasswordPopup(false);
                  setResetPassword("");
                  setResetPasswordConfirm("");
                  setShowResetPassword(false);
                  setShowResetPasswordConfirm(false);
                }}
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
