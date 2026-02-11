"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isWithinWorkHours } from "@/lib/utils/timeWindow";

const COPY = {
  ru: {
    home: "Главная",
    about: "О нас",
    news: "Новости",
    account: "Аккаунт",
    cart: "Корзина",
    logout: "Выйти",
    search: "Поиск по блюдам...",
    navLabel: "Основная навигация",
    promo: "Присоединяйтесь к нашей бонусной программе — регистрируйтесь и получайте бонусы с каждого заказа",
    sidebar: {
      menu: "Меню",
      close: "Закрыть меню",
      news: "Новости",
      about: "О нас",
      contacts: "Контакты и адрес",
      vacancies: "Вакансии",
      delivery: "Доставка и оплата",
      promo: "Акции",
      instagram: "Instagram",
      telegram: "Telegram",
    },
  },
  uz: {
    home: "Bosh sahifa",
    about: "Biz haqimizda",
    news: "Yangiliklar",
    account: "Profil",
    cart: "Savat",
    logout: "Chiqish",
    search: "Taomlar bo'yicha qidiruv...",
    navLabel: "Asosiy navigatsiya",
    promo: "Bonus dasturimizga qo'shiling — ro'yxatdan o'ting va har bir buyurtmadan bonus oling",
    sidebar: {
      menu: "Menyu",
      close: "Menyuni yopish",
      news: "Yangiliklar",
      about: "Biz haqimizda",
      contacts: "Aloqa va manzil",
      vacancies: "Bo'sh ish o'rinlari",
      delivery: "Yetkazish va to'lov",
      promo: "Aksiyalar",
      instagram: "Instagram",
      telegram: "Telegram",
    },
  },
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function Header({ locale }: { locale: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [workHours, setWorkHours] = useState({ start: "10:00", end: "23:00" });
  const [hoursReady, setHoursReady] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [langFlags, setLangFlags] = useState({ ru: true, uz: true });
  const [searchValue, setSearchValue] = useState("");
  const [socialLinks, setSocialLinks] = useState({ instagram: "", telegram: "" });
  const [contactPhone, setContactPhone] = useState("");
  const [clientLoggedIn, setClientLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = locale === "uz" ? COPY.uz : COPY.ru;
  const base = `/${locale}`;
  const isHome = pathname === base || pathname === `${base}/`;
  const isAbout = pathname?.startsWith(`${base}/about`);
  const isNews = pathname?.startsWith(`${base}/news`);

  useEffect(() => {
    let active = true;
    fetch("/api/menu")
      .then((r) => r.json())
      .then((meta) => {
        if (!active) return;
        const start = meta?.settings?.work_start || "10:00";
        const end = meta?.settings?.work_end || "23:00";
        setWorkHours({ start, end });
        setHoursReady(true);
        const ruEnabled = meta?.settings?.lang_ru_enabled;
        const uzEnabled = meta?.settings?.lang_uz_enabled;
        setLangFlags({
          ru: typeof ruEnabled === "boolean" ? ruEnabled : true,
          uz: typeof uzEnabled === "boolean" ? uzEnabled : true,
        });
        setSocialLinks({
          instagram: String(meta?.settings?.social_instagram ?? "").trim(),
          telegram: String(meta?.settings?.social_telegram ?? "").trim(),
        });
        setContactPhone(String(meta?.settings?.contact_phone ?? "").trim());
      })
      .catch(() => setHoursReady(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    router.prefetch(base);
  }, [router, base]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/client/me")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setClientLoggedIn(Boolean(data?.client?.id));
      })
      .catch(() => {
        if (!active) return;
        setClientLoggedIn(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hoursReady) return;
    const update = () => {
      setIsOpenNow(isWithinWorkHours(new Date(), workHours.start, workHours.end));
    };
    update();
    const id = window.setInterval(update, 60 * 1000);
    return () => window.clearInterval(id);
  }, [hoursReady, workHours.start, workHours.end]);

  const promoText = copy.promo;

  const closed = hoursReady && !isOpenNow;
  const closedTitle = locale === "uz" ? "Hozir ish vaqti emas" : "Сейчас нерабочее время";
  const closedText =
    locale === "uz"
      ? `Biz buyurtmalarni ${workHours.start}–${workHours.end} oralig'ida qabul qilamiz.`
      : `Мы принимаем заказы с ${workHours.start} до ${workHours.end}.`;
  const showLocaleSwitch = langFlags.ru || langFlags.uz;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const qParam = searchParams.get("q") || "";

  useEffect(() => {
    setSearchValue(qParam);
  }, [qParam]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [open]);

  const submitSearch = (value?: string) => {
    const cleaned = (value ?? searchValue).trim();
    const params = new URLSearchParams();
    if (cleaned) params.set("q", cleaned);
    const target = params.toString() ? `${base}?${params}` : base;
    if (isHome) router.replace(target);
    else router.push(target);
    if (open) setOpen(false);
  };

  const warmupHomeRoute = () => {
    router.prefetch(base);
  };

  const goHomeFast = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    warmupHomeRoute();
    if (open) setOpen(false);

    if (isHome) {
      if (qParam) {
        router.replace(base, { scroll: true });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    router.push(base, { scroll: true });
  };

  const searchLabel = locale === "uz" ? "Qidirish" : "Поиск";
  const clearLabel = locale === "uz" ? "Qidiruvni tozalash" : "Очистить поиск";
  const phoneHref = contactPhone ? `tel:${contactPhone.replace(/[^\d+]/g, "")}` : "";
  const socialItems = [
    {
      id: "instagram",
      label: copy.sidebar.instagram,
      href: normalizeUrl(socialLinks.instagram),
      icon: <InstagramIcon />,
    },
    {
      id: "telegram",
      label: copy.sidebar.telegram,
      href: normalizeUrl(socialLinks.telegram),
      icon: <TelegramIcon />,
    },
  ].filter((item) => item.href);

  const renderSearch = () => (
    <form
      className="site-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
    >
      <button type="submit" className="site-search__icon" aria-label={searchLabel}>
        <SearchIcon />
      </button>
      <input
        aria-label={copy.search}
        placeholder={copy.search}
        type="search"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
      />
      {searchValue ? (
        <button
          type="button"
          className="site-search__clear"
          aria-label={clearLabel}
          onClick={() => {
            setSearchValue("");
            submitSearch("");
          }}
        >
          x
        </button>
      ) : null}
    </form>
  );

  async function handleLogout() {
    try {
      await fetch("/api/auth/client/logout", { method: "POST" });
    } finally {
      setClientLoggedIn(false);
      setOpen(false);
    }
  }

  return (
    <>
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="ws-container site-header__inner">
        <div className="site-brand-panel">
        <Link
          href={`/${locale}`}
          prefetch
          className="site-brand"
          aria-label="Wasabi Sushi"
          onPointerDown={warmupHomeRoute}
          onTouchStart={warmupHomeRoute}
          onClick={goHomeFast}
        >
          <img className="site-brand__logo" src="/icons/logo.png" alt="Wasabi Sushi" />
        </Link>
          {contactPhone ? (
            <>
              <span className="site-brand-divider" aria-hidden />
              <a className="site-brand-phone" href={phoneHref} aria-label={contactPhone}>
                <PhoneIcon />
                <span>{contactPhone}</span>
              </a>
            </>
          ) : null}
        </div>

        <nav className="site-nav" aria-label={copy.navLabel}>
          <Link
            href={`/${locale}`}
            className={isHome ? "is-active" : ""}
            onPointerDown={warmupHomeRoute}
            onTouchStart={warmupHomeRoute}
            onClick={goHomeFast}
          >
            <HomeIcon />
            {copy.home}
          </Link>
          <Link href={`/${locale}/about`} className={isAbout ? "is-active" : ""}>
            <InfoIcon />
            {copy.about}
          </Link>
          <Link href={`/${locale}/news`} className={isNews ? "is-active" : ""}>
            <NewsIcon />
            {copy.news}
          </Link>
        </nav>

        <div className="site-actions">
          {renderSearch()}

          <Link href={`/${locale}/account`} className="site-icon" aria-label={copy.account}>
            <UserIcon />
          </Link>
          <Link href={`/${locale}/cart`} className="site-icon" aria-label={copy.cart}>
            <CartIcon />
          </Link>

          {showLocaleSwitch && (
            <div className="site-locale" role="group" aria-label="Language">
              {langFlags.ru && (
                <Link href="/ru" className={locale === "ru" ? "is-active" : ""}>
                  RU
                </Link>
              )}
              {langFlags.uz && (
                <Link href="/uz" className={locale === "uz" ? "is-active" : ""}>
                  UZ
                </Link>
              )}
            </div>
          )}

          <button
            className="site-burger"
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <div className="site-header__promo">
        <div className="ws-container">{promoText}</div>
      </div>

      <div
        className={`site-mobile ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={copy.sidebar.menu}
        onClick={() => setOpen(false)}
      >
        <div className="site-mobile__card" onClick={(event) => event.stopPropagation()}>
            <div className="site-mobile__top">
              <div className="site-mobile__title">{copy.sidebar.menu}</div>
              <button
                type="button"
                className="site-mobile__close"
                aria-label={copy.sidebar.close}
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            {renderSearch()}

            <div className="site-mobile__links">
              <Link
                href={`/${locale}/news`}
                className={isNews ? "is-active" : ""}
                onClick={() => setOpen(false)}
              >
                <NewsIcon />
                {copy.sidebar.news} <span aria-hidden>→</span>
              </Link>
              <Link
                href={`/${locale}/about`}
                className={isAbout ? "is-active" : ""}
                onClick={() => setOpen(false)}
              >
                <InfoIcon />
                {copy.sidebar.about} <span aria-hidden>→</span>
              </Link>
              <Link
                href={`/${locale}/contacts`}
                onClick={() => setOpen(false)}
              >
                <span>📍</span>
                {copy.sidebar.contacts} <span aria-hidden>→</span>
              </Link>
              <Link
                href={`/${locale}/vacancies`}
                onClick={() => setOpen(false)}
              >
                <span>💼</span>
                {copy.sidebar.vacancies} <span aria-hidden>→</span>
              </Link>
              <Link
                href={`/${locale}#products`}
                onClick={() => setOpen(false)}
              >
                <MenuIcon />
                {copy.sidebar.menu} <span aria-hidden>→</span>
              </Link>
              <Link
                href={`/${locale}/delivery`}
                onClick={() => setOpen(false)}
              >
                <span>🚚</span>
                {copy.sidebar.delivery} <span aria-hidden>→</span>
              </Link>
              <Link
                href={`/${locale}/promotions`}
                onClick={() => setOpen(false)}
              >
                <span>🔥</span>
                {copy.sidebar.promo} <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="site-mobile__actions">
              <Link href={`/${locale}/account`} onClick={() => setOpen(false)}>
                {copy.account}
              </Link>
              <Link href={`/${locale}/cart`} onClick={() => setOpen(false)}>
                {copy.cart}
              </Link>
              {clientLoggedIn ? (
                <button type="button" onClick={handleLogout}>
                  {copy.logout}
                </button>
              ) : null}
            </div>

            {socialItems.length > 0 && (
              <div className="site-mobile__social">
                {socialItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`is-${item.id}`}
                    aria-label={item.label}
                    title={item.label}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            )}

            <div className="site-subtitle" style={{ fontSize: 12 }}>
              {promoText}
            </div>
        </div>
      </div>
    </header>
      {closed && (
        <div className="site-closed" role="status" aria-live="polite">
          <div className="site-closed__card">
            <div className="site-closed__badge">
              {locale === "uz" ? "Hozir yopiq" : "Сейчас закрыто"}
            </div>
            <div className="site-closed__title">{closedTitle}</div>
            <div className="site-closed__text">{closedText}</div>
            <div className="site-closed__hours">
              {locale === "uz" ? "Ish vaqti" : "Время работы"}:{" "}
              <strong>
                {workHours.start}–{workHours.end}
              </strong>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 20c1.6-3.4 4.4-5 8-5s6.4 1.6 8 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h2l2.4 9.5a2 2 0 0 0 2 1.5h7.2a2 2 0 0 0 2-1.6L21 8H7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="20" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7.2 3.6c.4-.4 1-.5 1.6-.2l3 1.6c.6.3.8 1 .6 1.6l-1 2.6c-.2.5-.1 1 .2 1.4l3.2 3.2c.4.4.9.5 1.4.2l2.6-1c.6-.2 1.2 0 1.6.6l1.6 3c.3.6.2 1.2-.2 1.6l-1.4 1.4c-.8.8-2 1.1-3.1.8-3.1-.8-6.2-2.6-8.9-5.2S4 8 3.2 4.9c-.3-1.1 0-2.3.8-3.1L7.2 3.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="3" y="3" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="8" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="13" width="12" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="7" r="1.3" fill="currentColor" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 2 15 22 11 13 2 9 22 2Z" fill="currentColor" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 11.5L12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 10v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 9h8M8 12h8M8 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
