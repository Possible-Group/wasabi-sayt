"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/t";
import {
  getCart,
  setCart,
  clearCart,
  type CartItem,
  PACKAGE_ITEM_ID,
  CHOPSTICKS_ITEM_ID,
  isPackageItem,
  isChopsticksItem,
  isExtraItem,
  getItemsSubtotal,
  getPackageTotal,
  getPackageOptOut,
  clearPackageOptOut,
  getChopsticksOptOut,
  clearChopsticksOptOut,
} from "@/lib/cart/cart";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

declare global {
  interface Window {
    ymaps?: any;
  }
}

type ClientProfile = {
  id: string;
  name: string;
  phone: string;
  bonus: number;
};

type AboutLocation = {
  id: string;
  spotId?: string | null;
  nameRu?: string | null;
  nameUz?: string | null;
  addressRu?: string | null;
  addressUz?: string | null;
  pickupAddressRu?: string | null;
  pickupAddressUz?: string | null;
  descRu?: string | null;
  descUz?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type SavedLocation = {
  id: string;
  address: string;
  lat: number;
  lng: number;
};

type GeoSearchResult = {
  address: string;
  lat: number;
  lng: number;
};

type PaymentMethod = "cash" | "click" | "payme";

const COPY = {
  ru: {
    loginTitle: "Войдите в аккаунт",
    loginText: "Для оформления заказа нужно войти или зарегистрироваться.",
    loginCta: "Перейти в аккаунт",
    locationsTitle: "Мои локации",
    locationsEmpty: "Сохраненных адресов пока нет.",
    addLocation: "Добавить локацию",
    hideMap: "Скрыть карту",
    saveLocation: "Сохранить локацию",
    removeLocation: "Удалить",
    mapTitle: "Адрес доставки на карте",
    mapHint: "Кликните по карте, чтобы выбрать точку доставки.",
    mapSearchLabel: "Поиск адреса",
    mapSearchPlaceholder: "Например: Ташкент, Чиланзар 15 квартал",
    mapSearchLoading: "Ищем адрес...",
    mapSearchEmpty: "Ничего не найдено. Уточните запрос.",
    mapSearchError: "Не удалось выполнить поиск адреса.",
    mapLoading: "Загружаем карту...",
    mapError: "Не удалось загрузить карту. Попробуйте позже.",
    addressEntrance: "Подъезд",
    addressFloor: "Этаж",
    addressApartment: "Квартира, офис",
    addressIntercom: "Домофон",
    packageCount: "Пакеты",
    chopsticksCount: "Палочки",
    myLocation: "Мое местоположение",
    myLocationLoading: "Определяем...",
    myLocationError: "Не удалось определить местоположение.",
    myLocationDenied: "Разрешите доступ к геолокации.",
    myLocationHttps: "Геолокация в Safari работает только на HTTPS или localhost.",
    pickupTitle: "Филиалы для самовывоза",
    pickupEmpty: "Филиалы не найдены.",
    paymentTitle: "Оплата",
    paymentCash: "Наличными",
    paymentClick: "Click",
    paymentPayme: "Payme",
    bonusTitle: "Бонусы",
    bonusAvailable: "Доступно бонусов",
    bonusUse: "Списать бонусы",
    bonusNone: "Нет доступных бонусов",
    promoHint: "Промокод проверим при подтверждении.",
    subtotalLabel: "Сумма заказа",
    deliveryFeeLabel: "Доставка",
    packageFeeLabel: "Пакет",
    bonusUsedLabel: "Списано бонусами",
    totalLabel: "К оплате",
    deliveryTimeTitle: "Время доставки",
    deliveryTimeEdit: "Изменить",
    deliveryTimeToday: "Сегодня",
    deliveryTimeOther: "Другой день",
    deliveryTimeTodayOption: "Сегодня: через",
    deliveryTimeMinutes: "мин",
    deliveryTimeChooseDate: "Выберите дату",
    deliveryTimeChooseTime: "Выберите время",
    deliveryTimeApply: "Сохранить",
    deliveryTimeNote: "Время доставки:",
    deliveryTimeClose: "Закрыть выбор времени",
    confirmTitle: "Вы уверены, что хотите оформить заказ?",
    confirmYes: "Да",
    confirmNo: "Нет",
    errAuth: "Авторизуйтесь, чтобы оформить заказ.",
    errLocation: "Укажите точку на карте.",
    errLocationSelect: "Пожалуйста, выберите адрес доставки.",
    errSpot: "Выберите филиал.",
    errPromo: "Промокод недействителен.",
    errBonus: "Недостаточно бонусов.",
    errSend: "Ошибка при отправке заказа.",
    successTitle: "Заказ успешно отправлен",
    successText: "Спасибо! Мы свяжемся с вами для подтверждения.",
    successOrderLabel: "Номер заказа",
    successCta: "К меню",
    successClose: "Закрыть",
  },
  uz: {
    loginTitle: "Profilga kiring",
    loginText: "Buyurtma berish uchun kirish yoki ro'yxatdan o'tish kerak.",
    loginCta: "Profilga o'tish",
    locationsTitle: "Mening manzillarim",
    locationsEmpty: "Saqlangan manzillar yo'q.",
    addLocation: "Manzil qo'shish",
    hideMap: "Xaritani yopish",
    saveLocation: "Manzilni saqlash",
    removeLocation: "O'chirish",
    mapTitle: "Yetkazish manzili",
    mapHint: "Xaritada yetkazish nuqtasini tanlang.",
    mapSearchLabel: "Manzil qidirish",
    mapSearchPlaceholder: "Masalan: Toshkent, Chilonzor 15-kvartal",
    mapSearchLoading: "Manzil qidirilmoqda...",
    mapSearchEmpty: "Hech narsa topilmadi. So'rovni aniqlashtiring.",
    mapSearchError: "Manzilni qidirib bo'lmadi.",
    mapLoading: "Xarita yuklanmoqda...",
    mapError: "Xaritani yuklab bo'lmadi. Keyinroq urinib ko'ring.",
    addressEntrance: "Podyezd",
    addressFloor: "Qavat",
    addressApartment: "Kvartira, ofis",
    addressIntercom: "Domofon",
    packageCount: "Paketlar",
    chopsticksCount: "Tayoqchalar",
    myLocation: "Mening joylashuvim",
    myLocationLoading: "Aniqlanmoqda...",
    myLocationError: "Joylashuvni aniqlab bo'lmadi.",
    myLocationDenied: "Geolokatsiyaga ruxsat bering.",
    myLocationHttps: "Safari'da geolokatsiya faqat HTTPS yoki localhost'da ishlaydi.",
    pickupTitle: "Olib ketish filiallari",
    pickupEmpty: "Filiallar topilmadi.",
    paymentTitle: "To'lov",
    paymentCash: "Naqd",
    paymentClick: "Click",
    paymentPayme: "Payme",
    bonusTitle: "Bonuslar",
    bonusAvailable: "Mavjud bonuslar",
    bonusUse: "Bonusdan foydalanish",
    bonusNone: "Bonuslar yo'q",
    promoHint: "Promokodni tasdiqlashda tekshiramiz.",
    subtotalLabel: "Buyurtma summasi",
    deliveryFeeLabel: "Yetkazish",
    packageFeeLabel: "Paket",
    bonusUsedLabel: "Bonusdan yechildi",
    totalLabel: "To'lash",
    deliveryTimeTitle: "Yetkazish vaqti",
    deliveryTimeEdit: "O'zgartirish",
    deliveryTimeToday: "Bugun",
    deliveryTimeOther: "Boshqa kun",
    deliveryTimeTodayOption: "Bugun: taxminan",
    deliveryTimeMinutes: "min",
    deliveryTimeChooseDate: "Sana tanlang",
    deliveryTimeChooseTime: "Vaqt tanlang",
    deliveryTimeApply: "Saqlash",
    deliveryTimeNote: "Yetkazish vaqti:",
    deliveryTimeClose: "Vaqt tanlashni yopish",
    confirmTitle: "Buyurtmani rasmiylashtirishni tasdiqlaysizmi?",
    confirmYes: "Ha",
    confirmNo: "Yo'q",
    errAuth: "Buyurtma uchun kirish kerak.",
    errLocation: "Xaritadan manzilni tanlang.",
    errLocationSelect: "Iltimos, yetkazish manzilini tanlang.",
    errSpot: "Filialni tanlang.",
    errPromo: "Promokod noto'g'ri.",
    errBonus: "Bonus yetarli emas.",
    errSend: "Buyurtma yuborishda xatolik.",
    successTitle: "Buyurtma yuborildi",
    successText: "Rahmat! Buyurtmani tasdiqlash uchun siz bilan bog'lanamiz.",
    successOrderLabel: "Buyurtma raqami",
    successCta: "Menyuga",
    successClose: "Yopish",
  },
};

const YANDEX_SCRIPT_ID = "yandex-maps-script";
const YANDEX_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
const MAP_CONTAINER_ID = "checkout-map-canvas";
const LOCATIONS_KEY = "wasabi_saved_locations_v1";
const DEFAULT_DELIVERY_MINUTES = 70;

function formatMoney(value: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : "ru-RU").format(value);
  } catch {
    return String(value);
  }
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function formatTimeLabel(date: Date, locale: Locale) {
  try {
    return new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

function formatDateLabel(value: string, locale: Locale) {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "ru-RU", {
      day: "2-digit",
      month: "long",
    }).format(parsed);
  } catch {
    return value;
  }
}

function toInputDate(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function toInputTime(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function looksLikeCoords(value: string) {
  return /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(value.trim());
}

async function fetchAddressFromApi(lat: number, lng: number) {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { cache: "no-store" });
    const data = await res.json().catch(() => null);
    const address = String(data?.address ?? "").trim();
    return address || "";
  } catch {
    return "";
  }
}

function resolveGeoAddress(geoObject: any) {
  if (!geoObject) return "";
  const direct = geoObject.getAddressLine?.();
  if (direct) return String(direct).trim();
  const text = geoObject.properties?.get?.("text");
  if (text) return String(text).trim();
  const name = geoObject.properties?.get?.("name");
  const desc = geoObject.properties?.get?.("description");
  if (name && desc) return `${String(desc).trim()}, ${String(name).trim()}`;
  if (name) return String(name).trim();
  if (desc) return String(desc).trim();
  const meta = geoObject.properties?.get?.("metaDataProperty")?.GeocoderMetaData;
  const metaText = meta?.text;
  if (metaText) return String(metaText).trim();
  const formatted = meta?.Address?.formatted;
  if (formatted) return String(formatted).trim();
  const locality =
    (geoObject.getLocalities?.() || [])[0] ||
    (geoObject.getAdministrativeAreas?.() || [])[0] ||
    "";
  const thoroughfare = geoObject.getThoroughfare?.() || "";
  const premise = geoObject.getPremise?.() || "";
  const premiseNumber = geoObject.getPremiseNumber?.() || "";
  return [locality, thoroughfare, premiseNumber || premise].filter(Boolean).join(", ").trim();
}

function loadSavedLocations(): SavedLocation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCATIONS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => ({
        id: String(item?.id ?? ""),
        address: String(item?.address ?? "").trim(),
        lat: Number(item?.lat),
        lng: Number(item?.lng),
      }))
      .filter((item) => item.id && Number.isFinite(item.lat) && Number.isFinite(item.lng))
      .map((item) => ({
        ...item,
        address:
          item.address ||
          `${Number(item.lat).toFixed(6)}, ${Number(item.lng).toFixed(6)}`,
      }));
  } catch {
    return [];
  }
}

function persistSavedLocations(list: SavedLocation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

async function syncLocationsToServer(list: SavedLocation[]) {
  try {
    await fetch("/api/auth/client/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locations: list }),
    });
  } catch {
    // ignore sync errors
  }
}
function loadYandexMaps(lang: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.ymaps) return Promise.resolve(window.ymaps);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(YANDEX_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.ymaps));
      existing.addEventListener("error", () => reject(new Error("Map load failed")));
      return;
    }

    const script = document.createElement("script");
    const apiKey = YANDEX_API_KEY ? `&apikey=${YANDEX_API_KEY}` : "";
    script.id = YANDEX_SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?lang=${lang}${apiKey}`;
    script.async = true;
    script.onload = () => resolve(window.ymaps);
    script.onerror = () => reject(new Error("Map load failed"));
    document.head.appendChild(script);
  });
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function CheckoutPage() {
  const routeParams = useParams();
  const rawLocale = Array.isArray(routeParams?.locale)
    ? routeParams.locale[0]
    : routeParams?.locale;
  const localeParam = typeof rawLocale === "string" ? rawLocale : "";
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const copy = locale === "uz" ? COPY.uz : COPY.ru;
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [fees, setFees] = useState<{ delivery: number; pack: number }>({ delivery: 0, pack: 0 });
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [addressEntrance, setAddressEntrance] = useState("");
  const [addressFloor, setAddressFloor] = useState("");
  const [addressApartment, setAddressApartment] = useState("");
  const [addressIntercom, setAddressIntercom] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("click");
  const [bonusInput, setBonusInput] = useState("");

  const [locations, setLocations] = useState<AboutLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [pickupSpotId, setPickupSpotId] = useState("");

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<GeoSearchResult[]>([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchError, setMapSearchError] = useState("");
  const [mapSearchTouched, setMapSearchTouched] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const addressRequestId = useRef(0);
  const mapSearchRequestId = useRef(0);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deliveryTimeOpen, setDeliveryTimeOpen] = useState(false);
  const [deliveryTimeTab, setDeliveryTimeTab] = useState<"today" | "other">("today");
  const [deliveryTimeMode, setDeliveryTimeMode] = useState<"today" | "other">("today");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryClock, setDeliveryClock] = useState("");

  useEffect(() => setItems(getCart()), []);
  useEffect(() => setSavedLocations(loadSavedLocations()), []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    persistSavedLocations(savedLocations);
  }, [savedLocations]);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((meta) => {
        setFees({
          delivery: Number(meta?.settings?.delivery_fee ?? 0),
          pack: Number(meta?.settings?.package_fee ?? 0),
        });
      })
      .catch(() => setFees({ delivery: 0, pack: 0 }));
  }, []);

  useEffect(() => {
    let active = true;
    setClientLoading(true);
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
        setClientLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!client) return;
    setPhone((prev) => prev || client.phone || "");
    setName((prev) => prev || client.name || "");
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let active = true;
    const local = loadSavedLocations();
    fetch("/api/auth/client/locations")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const remote = Array.isArray(data?.locations) ? data.locations : [];
        if (remote.length) {
          setSavedLocations(remote);
          persistSavedLocations(remote);
          return;
        }
        if (local.length) {
          setSavedLocations(local);
          persistSavedLocations(local);
          syncLocationsToServer(local);
        }
      })
      .catch(() => {
        if (!active) return;
        if (local.length) {
          setSavedLocations(local);
          persistSavedLocations(local);
        }
      });
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    let active = true;
    async function loadLocations() {
      setLocationsLoading(true);
      try {
        const res = await fetch("/api/locations");
        const data = await res.json().catch(() => null);
        let list = Array.isArray(data?.locations) ? data.locations : [];
        if (!list.length) {
          const spotsRes = await fetch("/api/poster/spots");
          const spots = await spotsRes.json().catch(() => []);
          if (Array.isArray(spots)) {
            list = spots.map((s) => ({
              id: String(s.spot_id ?? s.id ?? ""),
              spotId: String(s.spot_id ?? s.id ?? ""),
              nameRu: s.name ?? "",
              nameUz: s.name ?? "",
              addressRu: s.address ?? "",
              addressUz: s.address ?? "",
              pickupAddressRu: s.address ?? "",
              pickupAddressUz: s.address ?? "",
              lat: typeof s.lat === "number" ? s.lat : s.lat ? Number(s.lat) : null,
              lng: typeof s.lng === "number" ? s.lng : s.lng ? Number(s.lng) : null,
            }));
          }
        }
        if (!active) return;
        setLocations(list);
      } catch {
        if (!active) return;
        setLocations([]);
      } finally {
        if (!active) return;
        setLocationsLoading(false);
      }
    }
    loadLocations();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (deliveryType !== "pickup") return;
    if (!pickupSpotId && locations.length) {
      const first = locations[0];
      const spot = String(first.spotId || first.id || "");
      if (spot) setPickupSpotId(spot);
    }
  }, [deliveryType, locations, pickupSpotId]);

  useEffect(() => {
    if (!showMap) {
      setMapStatus("idle");
      setMapSearchLoading(false);
      setMapSearchResults([]);
      setMapSearchError("");
      setMapSearchTouched(false);
    }
  }, [showMap]);

  function createPlacemark(ymaps: any, lat: number, lng: number, center = false) {
    const pos: [number, number] = [lat, lng];
    const placemark = new ymaps.Placemark(pos, {}, { draggable: true });
    placemark.events.add("dragend", (e: any) => {
      const next = e.get("target").geometry.getCoordinates() as [number, number];
      applyCoords(Number(next[0]), Number(next[1]), ymaps, { center: false });
    });
    if (center && mapInstance.current?.setCenter) {
      mapInstance.current.setCenter(pos);
    }
    return placemark;
  }

  function applyCoords(
    nextLat: number,
    nextLng: number,
    ymaps?: any,
    opts?: { center?: boolean }
  ) {
    const shouldCenter = opts?.center !== false;
    setSelectedLocationId(null);
    setCoords({ lat: nextLat, lng: nextLng });

    if (ymaps && mapInstance.current) {
      const pos: [number, number] = [nextLat, nextLng];
      if (shouldCenter && mapInstance.current.setCenter) {
        mapInstance.current.setCenter(pos);
      }
      if (markerRef.current) {
        markerRef.current.geometry.setCoordinates(pos);
      } else {
        const placemark = createPlacemark(ymaps, nextLat, nextLng);
        markerRef.current = placemark;
        mapInstance.current.geoObjects.add(placemark);
      }
    }

    const reqId = ++addressRequestId.current;
    const resolver = ymaps
      ? resolveAddressByCoords(ymaps, nextLat, nextLng)
      : fetchAddressFromApi(nextLat, nextLng);
    resolver
      .then((resolved) => {
        if (reqId !== addressRequestId.current) return;
        if (resolved) setAddress(resolved);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    if (deliveryType !== "delivery") return;
    if (!showMap) return;
    if (!mapRef.current) return;

    let cancelled = false;
    setMapStatus("loading");

    const lang = "ru_RU";
    const fallbackTimer = window.setTimeout(() => {
      if (!mapInstance.current && !cancelled) setMapStatus("error");
    }, 7000);

    loadYandexMaps(lang)
      .then((ymaps) => {
        if (cancelled || !mapRef.current) return;
        ymaps.ready(() => {
          if (cancelled || !mapRef.current) return;
          if (mapInstance.current) {
            mapInstance.current.destroy();
            mapInstance.current = null;
            markerRef.current = null;
          }

          const center = coords ? [coords.lat, coords.lng] : [41.311081, 69.279737];
          let map: any;
          try {
            map = new ymaps.Map(MAP_CONTAINER_ID, {
              center,
              zoom: 12,
              controls: ["zoomControl"],
            });
          } catch {
            setMapStatus("error");
            return;
          }
          mapInstance.current = map;
          map.container.fitToViewport();
          window.setTimeout(() => map.container.fitToViewport(), 200);

          if (coords) {
            const placemark = createPlacemark(ymaps, coords.lat, coords.lng);
            markerRef.current = placemark;
            map.geoObjects.add(placemark);
          }

          map.events.add("click", (e: any) => {
            const pos = e.get("coords") as [number, number];
            const nextLat = Number(pos[0]);
            const nextLng = Number(pos[1]);
            if (cancelled) return;
            applyCoords(nextLat, nextLng, ymaps, { center: true });
          });

          window.clearTimeout(fallbackTimer);
          setMapStatus("ready");
        });
      })
      .catch(() => {
        if (cancelled) return;
        setMapStatus("error");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, [deliveryType, locale, showMap]);

  useEffect(() => {
    if (deliveryType !== "delivery") return;
    if (!showMap) return;
    if (!coords) return;
    if (mapStatus !== "ready") return;
    if (typeof window === "undefined") return;
    if (!window.ymaps || !mapInstance.current) return;

    const ymaps = window.ymaps;
    const pos: [number, number] = [coords.lat, coords.lng];
    mapInstance.current.setCenter(pos, 16, { duration: 200 });

    if (markerRef.current) {
      markerRef.current.geometry.setCoordinates(pos);
      return;
    }

    const placemark = createPlacemark(ymaps, coords.lat, coords.lng);
    markerRef.current = placemark;
    mapInstance.current.geoObjects.add(placemark);
  }, [coords, deliveryType, mapStatus, showMap]);

  useEffect(() => {
    if (!mapInstance.current) return;
    const onResize = () => {
      mapInstance.current?.container?.fitToViewport?.();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mapStatus]);

  useEffect(() => {
    if (deliveryType !== "delivery" || !showMap) return;

    const query = mapSearchQuery.trim();
    if (query.length < 3) {
      setMapSearchLoading(false);
      setMapSearchResults([]);
      setMapSearchError("");
      return;
    }

    const reqId = ++mapSearchRequestId.current;
    const lang = locale === "uz" ? "uz_UZ" : "ru_RU";
    setMapSearchLoading(true);
    setMapSearchError("");

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(query)}&lang=${encodeURIComponent(lang)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(String(data?.error || "SEARCH_FAILED"));
        if (reqId !== mapSearchRequestId.current) return;

        const list = Array.isArray(data?.results) ? data.results : [];
        const normalized = list
          .map((item: any) => ({
            address: String(item?.address || "").trim(),
            lat: Number(item?.lat),
            lng: Number(item?.lng),
          }))
          .filter(
            (item: GeoSearchResult) =>
              Boolean(item.address) &&
              Number.isFinite(item.lat) &&
              Number.isFinite(item.lng)
          )
          .slice(0, 6);
        setMapSearchResults(normalized);
      } catch {
        if (reqId !== mapSearchRequestId.current) return;
        setMapSearchResults([]);
        setMapSearchError(copy.mapSearchError);
      } finally {
        if (reqId === mapSearchRequestId.current) {
          setMapSearchLoading(false);
        }
      }
    }, 320);

    return () => window.clearTimeout(timer);
  }, [mapSearchQuery, showMap, deliveryType, locale, copy.mapSearchError]);

  async function resolveAddressByCoords(ymaps: any, lat: number, lng: number) {
    const apiAddress = await fetchAddressFromApi(lat, lng);
    if (apiAddress) return apiAddress;

    const resolveOnce = async (kind?: string) => {
      const res = await ymaps.geocode([lat, lng], {
        results: 1,
        ...(kind ? { kind } : {}),
      });
      const first = res?.geoObjects?.get?.(0);
      return resolveGeoAddress(first);
    };

    try {
      const byHouse = await resolveOnce("house");
      if (byHouse) return byHouse;
    } catch {
      // ignore
    }

    try {
      const byStreet = await resolveOnce("street");
      if (byStreet) return byStreet;
    } catch {
      // ignore
    }

    try {
      const fallback = await resolveOnce();
      if (fallback) return fallback;
    } catch {
      // ignore
    }

    return "";
  }

  function getBrowserGeoPositionByWatch(options: PositionOptions, timeoutMs = 25000) {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GEO_NOT_SUPPORTED"));
        return;
      }
      let done = false;
      let watchId = -1;
      const finish = (fn: () => void) => {
        if (done) return;
        done = true;
        if (watchId >= 0) navigator.geolocation.clearWatch(watchId);
        fn();
      };
      const timer = window.setTimeout(() => {
        finish(() => reject(new Error("GEO_TIMEOUT")));
      }, timeoutMs);

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude);
          const lng = Number(pos.coords.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
          }
          window.clearTimeout(timer);
          finish(() => resolve({ lat, lng }));
        },
        (err) => {
          window.clearTimeout(timer);
          finish(() => reject(err));
        },
        options
      );
    });
  }

  function isGeoDenied(error: unknown) {
    return (
      !!error &&
      typeof error === "object" &&
      "code" in error &&
      Number((error as { code?: number }).code) === 1
    );
  }

  function geoErrorSuffix(error: unknown) {
    if (!error || typeof error !== "object" || !("code" in error)) return "";
    const code = Number((error as { code?: number }).code);
    if (!Number.isFinite(code)) return "";
    return ` (geo:${code})`;
  }

  async function getYandexGeoPosition() {
    try {
      const lang = locale === "uz" ? "uz_UZ" : "ru_RU";
      const ymaps = window.ymaps || (await loadYandexMaps(lang));
      await new Promise<void>((resolve) => {
        ymaps.ready(() => resolve());
      });
      const geo = await ymaps.geolocation.get({
        provider: "auto",
        autoReverseGeocode: false,
        mapStateAutoApply: false,
      });
      const first = geo?.geoObjects?.get?.(0);
      const pos = first?.geometry?.getCoordinates?.() as [number, number] | undefined;
      if (!Array.isArray(pos) || pos.length < 2) return null;
      const lat = Number(pos[0]);
      const lng = Number(pos[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    } catch {
      return null;
    }
  }

  function useMyLocation(opts?: { openMap?: boolean }) {
    if (typeof window === "undefined") return;
    const shouldOpenMap = opts?.openMap !== false;
    const openMap = () => {
      if (shouldOpenMap) setShowMap(true);
    };
    setGeoError("");
    if (!window.isSecureContext) {
      openMap();
      setGeoError(copy.myLocationHttps);
      return;
    }
    if (!navigator.geolocation) {
      openMap();
      setGeoError(copy.myLocationError);
      return;
    }
    setGeoLoading(true);
    const applyPosition = (lat: number, lng: number) => {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      applyCoords(lat, lng, window.ymaps, { center: true });
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude);
        const lng = Number(pos.coords.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setGeoError(copy.myLocationError);
          setGeoLoading(false);
          return;
        }
        applyPosition(lat, lng);
        setGeoLoading(false);
      },
      async (firstErr) => {
        if (isGeoDenied(firstErr)) {
          setGeoError(copy.myLocationDenied);
          setGeoLoading(false);
          return;
        }

        try {
          const watch = await getBrowserGeoPositionByWatch(
            { enableHighAccuracy: false, timeout: 25000, maximumAge: 300000 },
            25000
          );
          applyPosition(watch.lat, watch.lng);
          setGeoLoading(false);
          return;
        } catch (watchErr) {
          if (isGeoDenied(watchErr)) {
            setGeoError(copy.myLocationDenied);
            setGeoLoading(false);
            return;
          }

          const yPos = await getYandexGeoPosition();
          if (yPos) {
            applyPosition(yPos.lat, yPos.lng);
            setGeoLoading(false);
            return;
          }

          setGeoError(`${copy.myLocationError}${geoErrorSuffix(watchErr || firstErr)}`);
          setGeoLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    openMap();
  }

  function selectSavedLocation(location: SavedLocation) {
    setSelectedLocationId(location.id);
    setCoords({ lat: location.lat, lng: location.lng });
    setAddress(location.address);
    if (looksLikeCoords(location.address)) {
      const reqId = ++addressRequestId.current;
      fetchAddressFromApi(location.lat, location.lng)
        .then((resolved) => {
          if (reqId !== addressRequestId.current) return;
          if (!resolved) return;
          setAddress(resolved);
          setSavedLocations((prev) => {
            const next = prev.map((loc) =>
              loc.id === location.id ? { ...loc, address: resolved } : loc
            );
            persistSavedLocations(next);
            if (client) syncLocationsToServer(next);
            return next;
          });
        })
        .catch(() => undefined);
    }
    setShowMap(false);
  }

  function selectMapSearchResult(location: GeoSearchResult) {
    setMapSearchQuery(location.address);
    setMapSearchResults([]);
    setMapSearchError("");
    setMapSearchTouched(true);
    setAddress(location.address);
    applyCoords(location.lat, location.lng, window.ymaps, { center: true });
  }

  async function saveCurrentLocation() {
    if (!coords) return null;
    setSavingLocation(true);
    try {
      let addressValue = address.trim();
      if (!addressValue) {
        const resolved = await fetchAddressFromApi(coords.lat, coords.lng);
        addressValue =
          resolved || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      }

      let nextId = "";
      let nextList: SavedLocation[] = [];
      setSavedLocations((prev) => {
        const sameCoords = prev.find(
          (loc) =>
            Math.abs(loc.lat - coords.lat) < 0.00001 &&
            Math.abs(loc.lng - coords.lng) < 0.00001
        );

        if (sameCoords) {
          nextId = sameCoords.id;
          nextList = prev.map((loc) =>
            loc.id === sameCoords.id && addressValue && loc.address !== addressValue
              ? { ...loc, address: addressValue }
              : loc
          );
          persistSavedLocations(nextList);
          syncLocationsToServer(nextList);
          return nextList;
        }

        nextId = `loc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        nextList = [
          { id: nextId, address: addressValue, lat: coords.lat, lng: coords.lng },
          ...prev,
        ].slice(0, 10);
        persistSavedLocations(nextList);
        if (client) syncLocationsToServer(nextList);
        return nextList;
      });

      if (nextId) {
        setSelectedLocationId(nextId);
      }
      setAddress(addressValue);
      setShowMap(false);
      return nextId || null;
    } finally {
      setSavingLocation(false);
    }
  }

  async function ensureSelectedDeliveryLocation() {
    if (deliveryType !== "delivery") return true;
    if (!coords) return false;
    if (!address.trim()) return false;

    if (selectedLocationId && savedLocations.some((loc) => loc.id === selectedLocationId)) {
      return true;
    }

    const sameCoords = savedLocations.find(
      (loc) =>
        Math.abs(loc.lat - coords.lat) < 0.00001 &&
        Math.abs(loc.lng - coords.lng) < 0.00001
    );
    if (sameCoords) {
      setSelectedLocationId(sameCoords.id);
      if (sameCoords.address !== address.trim()) {
        await saveCurrentLocation();
      }
      return true;
    }

    const savedId = await saveCurrentLocation();
    return Boolean(savedId);
  }

  function removeSavedLocation(id: string) {
    setSavedLocations((prev) => {
      const next = prev.filter((loc) => loc.id !== id);
      persistSavedLocations(next);
      if (client) syncLocationsToServer(next);
      return next;
    });
    if (selectedLocationId === id) {
      setSelectedLocationId(null);
      setCoords(null);
      setAddress("");
    }
  }


  const packageLabel = locale === "uz" ? "Paket" : "Пакет";
  const chopsticksLabel = locale === "uz" ? "Tayoqchalar" : "Палочки";
  const packagePriceT = Math.round(fees.pack * 100);
  const chopsticksPriceT = 0;
  const packageItem = items.find(isPackageItem) || null;
  const chopsticksItem = items.find(isChopsticksItem) || null;
  const productItems = items.filter((it) => !isExtraItem(it));
  const hasProducts = productItems.length > 0;
  const itemsSubtotalT = getItemsSubtotal(items);
  const packageTotalT = getPackageTotal(items);
  const subtotalSum = itemsSubtotalT / 100;
  const packageSum = packageTotalT / 100;
  const feesSum = packageSum + (deliveryType === "delivery" ? fees.delivery : 0);
  const totalBeforeBonus = Math.max(0, subtotalSum + feesSum);
  const bonusAvailable = Number(client?.bonus ?? 0) || 0;
  const bonusCandidate = useMemo(() => {
    const raw = bonusInput.trim().replace(",", ".");
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  }, [bonusInput]);
  const bonusUsed = Math.min(Math.max(bonusCandidate, 0), bonusAvailable, totalBeforeBonus);
  const totalSum = Math.max(0, totalBeforeBonus - bonusUsed);
  const todayEta = useMemo(
    () => addMinutes(new Date(), DEFAULT_DELIVERY_MINUTES),
    [deliveryTimeOpen]
  );
  const todayLabel = `${copy.deliveryTimeToday} ~ ${formatTimeLabel(todayEta, locale)} (${DEFAULT_DELIVERY_MINUTES} ${copy.deliveryTimeMinutes})`;
  const hasCustomDeliveryTime = Boolean(deliveryDate && deliveryClock);
  const otherLabel = `${copy.deliveryTimeOther}: ${formatDateLabel(deliveryDate, locale)} ${deliveryClock}`.trim();
  const deliveryTimeLabel =
    deliveryTimeMode === "other" && hasCustomDeliveryTime ? otherLabel : todayLabel;
  const minOtherDeliveryDate = useMemo(
    () => toInputDate(addMinutes(new Date(), 24 * 60)),
    [deliveryTimeOpen]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    let next = items.slice();
    let changed = false;

    const hasRealProducts = next.some((it) => !isExtraItem(it));
    const allowPackage = hasRealProducts && fees.pack > 0;
    const allowChopsticks = hasRealProducts;

    if (!allowPackage && next.some(isPackageItem)) {
      next = next.filter((it) => !isPackageItem(it));
      clearPackageOptOut();
      changed = true;
    }

    if (!allowChopsticks && next.some(isChopsticksItem)) {
      next = next.filter((it) => !isChopsticksItem(it));
      clearChopsticksOptOut();
      changed = true;
    }

    if (allowPackage) {
      if (next.some(isPackageItem)) {
        const updated = next.map((it) =>
          isPackageItem(it)
            ? it.price === packagePriceT &&
              it.name === packageLabel &&
              it.qty === (it.qty > 0 ? Math.floor(it.qty) : 1)
              ? it
              : { ...it, price: packagePriceT, name: packageLabel, qty: it.qty > 0 ? Math.floor(it.qty) : 1 }
            : it
        );
        if (updated.some((it, idx) => it !== next[idx])) {
          next = updated;
          changed = true;
        }
      } else if (!getPackageOptOut()) {
        next = [...next, { product_id: PACKAGE_ITEM_ID, name: packageLabel, price: packagePriceT, qty: 1 }];
        changed = true;
      }
    }

    if (allowChopsticks) {
      if (next.some(isChopsticksItem)) {
        const updated = next.map((it) =>
          isChopsticksItem(it)
            ? it.price === chopsticksPriceT &&
              it.name === chopsticksLabel &&
              it.qty === (it.qty > 0 ? Math.floor(it.qty) : 1)
              ? it
              : { ...it, price: chopsticksPriceT, name: chopsticksLabel, qty: it.qty > 0 ? Math.floor(it.qty) : 1 }
            : it
        );
        if (updated.some((it, idx) => it !== next[idx])) {
          next = updated;
          changed = true;
        }
      } else if (!getChopsticksOptOut()) {
        next = [...next, { product_id: CHOPSTICKS_ITEM_ID, name: chopsticksLabel, price: chopsticksPriceT, qty: 1 }];
        changed = true;
      }
    }

    if (changed) {
      setItems(next);
      setCart(next);
    }
  }, [fees.pack, items, locale, packageLabel, packagePriceT, chopsticksLabel, chopsticksPriceT]);

  useEffect(() => {
    if (!deliveryTimeOpen) return;
    if (!deliveryDate) {
      setDeliveryDate(toInputDate(addMinutes(new Date(), 24 * 60)));
    }
    if (!deliveryClock) {
      setDeliveryClock(toInputTime(todayEta));
    }
  }, [deliveryTimeOpen, deliveryDate, deliveryClock, todayEta]);
  useEffect(() => {
    if (!deliveryTimeOpen) return;
    if (!deliveryDate) return;
    if (deliveryDate < minOtherDeliveryDate) {
      setDeliveryDate(minOtherDeliveryDate);
    }
  }, [deliveryDate, deliveryTimeOpen, minOtherDeliveryDate]);

  function buildAddressDetailsComment() {
    return [
      [copy.addressEntrance, addressEntrance],
      [copy.addressFloor, addressFloor],
      [copy.addressApartment, addressApartment],
      [copy.addressIntercom, addressIntercom],
    ]
      .map(([label, value]) => {
        const trimmed = value.trim();
        return trimmed ? `${label}: ${trimmed}` : "";
      })
      .filter(Boolean)
      .join(", ");
  }

  function buildExtrasDetailsComment() {
    return `${copy.packageCount}: ${Math.max(0, Math.floor(packageItem?.qty ?? 0))}, ${copy.chopsticksCount}: ${Math.max(0, Math.floor(chopsticksItem?.qty ?? 0))}`;
  }

  function buildOrderComment() {
    const value = comment.trim();
    const addressDetails = deliveryType === "delivery" ? buildAddressDetailsComment() : "";
    const extrasDetails = buildExtrasDetailsComment();
    return [value, addressDetails, extrasDetails].filter(Boolean).join("\n") || undefined;
  }

  function buildOrderServiceNote() {
    if (deliveryType !== "delivery") return undefined;
    if (deliveryTimeMode === "other") {
      return hasCustomDeliveryTime ? `${copy.deliveryTimeNote} ${deliveryTimeLabel}` : undefined;
    }
    return `${copy.deliveryTimeNote} ${deliveryTimeLabel}`;
  }

  async function placeOrder() {
    setErr(null);

    if (!client) {
      setErr(copy.errAuth);
      return;
    }
    if (!hasProducts) {
      return setErr(locale === "uz" ? "Savat bo'sh" : "Корзина пустая");
    }
    if (!phone.trim()) {
      return setErr(locale === "uz" ? "Telefon kiriting" : "Введите телефон");
    }

    if (deliveryType === "delivery") {
      if (!coords) return setErr(copy.errLocationSelect);
      if (!address.trim()) return setErr(locale === "uz" ? "Manzil kiriting" : "Введите адрес");
      const hasSelectedLocation = await ensureSelectedDeliveryLocation();
      if (!hasSelectedLocation) return setErr(copy.errLocationSelect);
    } else if (!pickupSpotId) {
      return setErr(copy.errSpot);
    }

    if (bonusCandidate > bonusAvailable) {
      return setErr(copy.errBonus);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerPhone: phone.trim(),
          customerName: name.trim() || undefined,
          deliveryType,
          deliveryTimeMode: deliveryType === "delivery" ? deliveryTimeMode : undefined,
          deliveryDate:
            deliveryType === "delivery" && deliveryTimeMode === "other"
              ? deliveryDate || undefined
              : undefined,
          deliveryClock:
            deliveryType === "delivery" && deliveryTimeMode === "other"
              ? deliveryClock || undefined
              : undefined,
          address: deliveryType === "delivery" ? address.trim() : undefined,
          lat: deliveryType === "delivery" ? coords?.lat : undefined,
          lng: deliveryType === "delivery" ? coords?.lng : undefined,
          spotId: deliveryType === "pickup" ? pickupSpotId : undefined,
          payment: paymentMethod,
          paymentMethod,
          bonusAmount: bonusUsed || 0,
          promoCode: promoCode.trim() || undefined,
          comment: buildOrderComment(),
          serviceNote: buildOrderServiceNote(),
          items: items.map((i) => ({
            product_id: i.product_id,
            name: i.name,
            price: i.price,
            qty: i.qty,
          })),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.error === "CLOSED") {
          return setErr(
            `${t(locale, "common.closed")}. ${t(locale, "common.workHours")}: ${data.workStart}–${data.workEnd}`
          );
        }
        if (data?.error === "UNAUTHORIZED") return setErr(copy.errAuth);
        if (data?.error === "EMPTY_CART") {
          return setErr(locale === "uz" ? "Savat bo'sh" : "Корзина пустая");
        }
        if (data?.error === "PHONE_REQUIRED") {
          return setErr(locale === "uz" ? "Telefon kiriting" : "Введите телефон");
        }
        if (data?.error === "LOCATION_REQUIRED") return setErr(copy.errLocation);
        if (data?.error === "ADDRESS_REQUIRED") {
          return setErr(locale === "uz" ? "Manzil kiriting" : "Введите адрес");
        }
        if (data?.error === "SPOT_REQUIRED") return setErr(copy.errSpot);
        if (data?.error === "INVALID_PROMO") return setErr(copy.errPromo);
        if (data?.error === "BONUS_EXCEEDED") return setErr(copy.errBonus);
        return setErr(copy.errSend);
      }

      clearCart();
      setItems([]);
      setPromoCode("");
      setComment("");
      setBonusInput("");
      setSuccessOrderId(data?.orderId ? String(data.orderId) : null);
      setSuccessOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ws-page">
      <Header locale={locale} />

      <main className="site-main">
        <div className="ws-container checkout-shell">
          <div className="site-section__head">
            <div>
              <p className="site-eyebrow">{t(locale, "common.checkout")}</p>
              <h1 className="site-title">{t(locale, "common.checkout")}</h1>
              <p className="site-subtitle">
                {locale === "uz"
                  ? "Ma'lumotlarni to'ldiring va buyurtmani tasdiqlang."
                  : "Заполните данные и подтвердите заказ."}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="site-card">
              <div className="site-title" style={{ fontSize: 18 }}>
                {locale === "uz" ? "Savat bo'sh" : "Корзина пустая"}
              </div>
              <p className="site-subtitle">
                {locale === "uz"
                  ? "Menyudan taom tanlang va savatga qo'shing."
                  : "Выберите блюда из меню и добавьте в корзину."}
              </p>
              <Link className="site-button site-button--primary" href={`/${locale}#products`}>
                {locale === "uz" ? "Menyuga o'tish" : "Перейти к меню"}
              </Link>
            </div>
          ) : clientLoading ? (
            <div className="site-card">{locale === "uz" ? "Yuklanmoqda..." : "Загрузка..."}</div>
          ) : !client ? (
            <div className="site-card">
              <div className="site-title" style={{ fontSize: 18 }}>{copy.loginTitle}</div>
              <p className="site-subtitle">{copy.loginText}</p>
              <Link className="site-button site-button--primary" href={`/${locale}/account`}>
                {copy.loginCta}
              </Link>
            </div>
          ) : (
            <div className="checkout-card">
              <div className="checkout-toggle">
                <button
                  className={deliveryType === "delivery" ? "is-active" : ""}
                  onClick={() => setDeliveryType("delivery")}
                >
                  {t(locale, "common.delivery")}
                </button>
                <button
                  className={deliveryType === "pickup" ? "is-active" : ""}
                  onClick={() => setDeliveryType("pickup")}
                >
                  {t(locale, "common.pickup")}
                </button>
              </div>

              {deliveryType === "delivery" ? (
                <div className="checkout-block">
                  <div className="checkout-location-head">
                    <div style={{ fontWeight: 600 }}>{copy.locationsTitle}</div>
                    <div className="checkout-location-head__actions">
                      <button
                        type="button"
                        className="site-button site-button--ghost checkout-map-action"
                        onClick={() => useMyLocation()}
                        disabled={geoLoading}
                      >
                        {geoLoading ? copy.myLocationLoading : copy.myLocation}
                      </button>
                      <button
                        type="button"
                        className="site-button site-button--ghost checkout-map-toggle"
                        onClick={() => setShowMap((prev) => !prev)}
                      >
                        {showMap ? copy.hideMap : copy.addLocation}
                      </button>
                    </div>
                  </div>

                  {savedLocations.length === 0 ? (
                    <div className="site-subtitle">{copy.locationsEmpty}</div>
                  ) : (
                    <div className="checkout-location-list">
                      {savedLocations.map((loc) => {
                        const isActive = selectedLocationId === loc.id;
                        return (
                          <div key={loc.id} className="checkout-location-row">
                            <button
                              type="button"
                              className={`checkout-location-card${isActive ? " is-active" : ""}`}
                              onClick={() => selectSavedLocation(loc)}
                            >
                              <input
                                className="checkout-radio"
                                type="radio"
                                checked={isActive}
                                onChange={() => selectSavedLocation(loc)}
                              />
                              <div className="checkout-location-meta">
                                <div style={{ fontWeight: 700 }}>{loc.address}</div>
                                <div className="site-subtitle">{formatCoords(loc.lat, loc.lng)}</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              className="checkout-location-remove"
                              onClick={() => removeSavedLocation(loc.id)}
                            >
                              {copy.removeLocation}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showMap ? (
                    <div className="checkout-map-block">
                      <div className="checkout-map-head">
                        <div style={{ fontWeight: 600 }}>{copy.mapTitle}</div>
                        <button
                          type="button"
                          className="site-button site-button--ghost checkout-map-action"
                          onClick={() => useMyLocation()}
                          disabled={geoLoading}
                        >
                          {geoLoading ? copy.myLocationLoading : copy.myLocation}
                        </button>
                      </div>
                      {geoError ? <div className="site-subtitle">{geoError}</div> : null}
                      <label className="checkout-field">
                        {copy.mapSearchLabel}
                        <input
                          className="checkout-input"
                          value={mapSearchQuery}
                          onChange={(e) => {
                            setMapSearchTouched(true);
                            setMapSearchQuery(e.target.value);
                          }}
                          placeholder={copy.mapSearchPlaceholder}
                        />
                      </label>
                      {mapSearchLoading ? (
                        <div className="site-subtitle">{copy.mapSearchLoading}</div>
                      ) : mapSearchError ? (
                        <div className="site-subtitle">{mapSearchError}</div>
                      ) : mapSearchTouched && mapSearchQuery.trim().length >= 3 ? (
                        mapSearchResults.length > 0 ? (
                          <div className="checkout-map-search-list">
                            {mapSearchResults.map((loc, idx) => (
                              <button
                                key={`${loc.lat}:${loc.lng}:${idx}`}
                                type="button"
                                className="checkout-map-search-item"
                                onClick={() => selectMapSearchResult(loc)}
                              >
                                <span>{loc.address}</span>
                                <span className="site-subtitle">{formatCoords(loc.lat, loc.lng)}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="site-subtitle">{copy.mapSearchEmpty}</div>
                        )
                      ) : null}
                      {mapStatus === "error" ? (
                        <div className="checkout-map checkout-map__fallback">{copy.mapError}</div>
                      ) : (
                        <div className="checkout-map">
                          <div
                            className="checkout-map__canvas"
                            id={MAP_CONTAINER_ID}
                            ref={mapRef}
                            style={{ width: "100%", height: 280 }}
                          />
                          <div className="checkout-map__hint">
                            <span>{mapStatus === "loading" ? copy.mapLoading : copy.mapHint}</span>
                            {coords ? (
                              <span>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <label className="checkout-field">
                    {t(locale, "common.address")}
                    <input
                      className="checkout-input"
                      placeholder={locale === "uz" ? "Manzil" : "Адрес"}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </label>

                  <div className="checkout-grid">
                    <label className="checkout-field">
                      {copy.addressEntrance}
                      <input
                        className="checkout-input"
                        placeholder={copy.addressEntrance}
                        value={addressEntrance}
                        onChange={(e) => setAddressEntrance(e.target.value)}
                      />
                    </label>
                    <label className="checkout-field">
                      {copy.addressApartment}
                      <input
                        className="checkout-input"
                        placeholder={copy.addressApartment}
                        value={addressApartment}
                        onChange={(e) => setAddressApartment(e.target.value)}
                      />
                    </label>
                    <label className="checkout-field">
                      {copy.addressFloor}
                      <input
                        className="checkout-input"
                        placeholder={copy.addressFloor}
                        value={addressFloor}
                        onChange={(e) => setAddressFloor(e.target.value)}
                      />
                    </label>
                    <label className="checkout-field">
                      {copy.addressIntercom}
                      <input
                        className="checkout-input"
                        placeholder={copy.addressIntercom}
                        value={addressIntercom}
                        onChange={(e) => setAddressIntercom(e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="checkout-location-actions">
                    <button
                      type="button"
                      className="site-button site-button--ghost"
                      disabled={!coords || savingLocation}
                      onClick={() => void saveCurrentLocation()}
                    >
                      {savingLocation ? "..." : copy.saveLocation}
                    </button>
                    {coords ? (
                      <div className="site-subtitle">{formatCoords(coords.lat, coords.lng)}</div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="checkout-block">
                  <div style={{ fontWeight: 600 }}>{copy.pickupTitle}</div>
                  {locationsLoading ? (
                    <div className="site-subtitle">{locale === "uz" ? "Yuklanmoqda..." : "Загрузка..."}</div>
                  ) : locations.length === 0 ? (
                    <div className="site-subtitle">{copy.pickupEmpty}</div>
                  ) : (
                    <div className="checkout-pickup-list">
                      {locations.map((loc) => {
                        const spot = String(loc.spotId || loc.id || "");
                        const isActive = pickupSpotId === spot;
                        const title =
                          locale === "uz"
                            ? loc.nameUz || loc.nameRu || "Filial"
                            : loc.nameRu || loc.nameUz || "Филиал";
                        const pickupAddress =
                          locale === "uz"
                            ? loc.pickupAddressUz || loc.pickupAddressRu
                            : loc.pickupAddressRu || loc.pickupAddressUz;
                        const addressText =
                          pickupAddress ||
                          (locale === "uz"
                            ? loc.addressUz || loc.addressRu
                            : loc.addressRu || loc.addressUz);
                        return (
                          <button
                            type="button"
                            key={loc.id}
                            className={`checkout-pickup-card${isActive ? " is-active" : ""}`}
                            onClick={() => setPickupSpotId(spot)}
                          >
                            <input
                              className="checkout-radio"
                              type="radio"
                              checked={isActive}
                              onChange={() => setPickupSpotId(spot)}
                            />
                            <div className="checkout-pickup-meta">
                              <div style={{ fontWeight: 700 }}>{title}</div>
                              {addressText ? <div className="site-subtitle">{addressText}</div> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="checkout-grid">
                <label className="checkout-field">
                  {t(locale, "common.phone")}
                  <input
                    className="checkout-input"
                    placeholder="+998"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <label className="checkout-field">
                  {t(locale, "common.name")}
                  <input
                    className="checkout-input"
                    placeholder={locale === "uz" ? "Ism" : "Имя"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              </div>

              <div className="checkout-payment">
                <div style={{ fontWeight: 600 }}>{copy.paymentTitle}</div>
                <div className="checkout-payment__options">
                  <label
                    className={`checkout-payment__option${paymentMethod === "cash" ? " is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                    />
                    <span className="checkout-payment__content">
                      <span className="checkout-payment__name">{copy.paymentCash}</span>
                    </span>
                  </label>
                  <label
                    className={`checkout-payment__option${paymentMethod === "click" ? " is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "click"}
                      onChange={() => setPaymentMethod("click")}
                    />
                    <span className="checkout-payment__content checkout-payment__content--click">
                      <span className="checkout-payment__logo-box checkout-payment__logo-box--click">
                        <img
                          className="checkout-payment__logo checkout-payment__logo--click"
                          src="/icons/click.png"
                          alt="Click"
                        />
                      </span>
                    </span>
                  </label>
                  <label
                    className={`checkout-payment__option${paymentMethod === "payme" ? " is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "payme"}
                      onChange={() => setPaymentMethod("payme")}
                    />
                    <span className="checkout-payment__content checkout-payment__content--payme">
                      <span className="checkout-payment__logo-box checkout-payment__logo-box--payme">
                        <img
                          className="checkout-payment__logo checkout-payment__logo--payme"
                          src="/icons/payme.png"
                          alt="Payme"
                        />
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="checkout-bonus">
                <div style={{ fontWeight: 600 }}>{copy.bonusTitle}</div>
                <div className="checkout-grid">
                  <label className="checkout-field">
                    {copy.bonusUse}
                    <input
                      className="checkout-input"
                      type="number"
                      min={0}
                      step={1}
                      placeholder={copy.bonusNone}
                      value={bonusInput}
                      onChange={(e) => setBonusInput(e.target.value)}
                      disabled={bonusAvailable <= 0}
                    />
                  </label>
                  <div className="checkout-field">
                    <span>{copy.bonusAvailable}</span>
                    <strong style={{ fontSize: 16 }}>
                      {formatMoney(bonusAvailable, locale)} {locale === "uz" ? "so'm" : "сум"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="checkout-grid">
                <label className="checkout-field">
                  {t(locale, "common.promo")}
                  <input
                    className="checkout-input"
                    placeholder={locale === "uz" ? "Promo kod" : "Промокод"}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <span className="site-subtitle">{copy.promoHint}</span>
                </label>
                <label className="checkout-field">
                  {t(locale, "common.comment")}
                  <textarea
                    className="checkout-input"
                    placeholder={locale === "uz" ? "Izoh" : "Комментарий"}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </label>
              </div>

              {deliveryType === "delivery" ? (
                <div className="checkout-time">
                  <div className="checkout-time__head">
                    <div style={{ fontWeight: 600 }}>{copy.deliveryTimeTitle}</div>
                    <button
                      type="button"
                      className="site-button site-button--ghost checkout-time__edit"
                      onClick={() => {
                        setDeliveryTimeTab(deliveryTimeMode);
                        setDeliveryTimeOpen(true);
                      }}
                    >
                      {copy.deliveryTimeEdit}
                    </button>
                  </div>
                  <div className="checkout-time__row">
                    <ClockIcon />
                    <span>{deliveryTimeLabel}</span>
                  </div>
                </div>
              ) : null}

              <div className="site-divider" />

              <div className="checkout-summary">
                <div className="checkout-summary__row">
                  <span>{copy.subtotalLabel}</span>
                  <span>
                    {formatMoney(subtotalSum, locale)} {locale === "uz" ? "so'm" : "сум"}
                  </span>
                </div>
                <div className="checkout-summary__row">
                  <span>{copy.deliveryFeeLabel}</span>
                  <span>
                    {formatMoney(deliveryType === "delivery" ? fees.delivery : 0, locale)} {locale === "uz" ? "so'm" : "сум"}
                  </span>
                </div>
                {packageItem ? (
                  <div className="checkout-summary__row">
                    <span>{copy.packageFeeLabel}</span>
                    <span>
                      {formatMoney(packageSum, locale)} {locale === "uz" ? "so'm" : "сум"}
                    </span>
                  </div>
                ) : null}
                <div className="checkout-summary__row">
                  <span>{copy.bonusUsedLabel}</span>
                  <span>
                    -{formatMoney(bonusUsed, locale)} {locale === "uz" ? "so'm" : "сум"}
                  </span>
                </div>
                <div className="checkout-summary__row checkout-summary__total">
                  <span>{copy.totalLabel}</span>
                  <span>
                    {formatMoney(totalSum, locale)} {locale === "uz" ? "so'm" : "сум"}
                  </span>
                </div>
              </div>

              {err && <div style={{ color: "#b42318" }}>{err}</div>}

              <button
                className="site-button site-button--primary"
                disabled={loading}
                onClick={() => setConfirmOpen(true)}
              >
                {loading ? "..." : t(locale, "common.placeOrder")}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer locale={locale} />

      {deliveryTimeOpen ? (
        <div
          className="delivery-time-popup"
          role="dialog"
          aria-modal="true"
          onClick={() => setDeliveryTimeOpen(false)}
        >
          <div className="delivery-time-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="delivery-time-close"
              aria-label={copy.deliveryTimeClose}
              onClick={() => setDeliveryTimeOpen(false)}
            >
              ×
            </button>
            <div className="delivery-time-title">{copy.deliveryTimeTitle}</div>
            <div className="delivery-time-tabs">
              <button
                type="button"
                className={deliveryTimeTab === "today" ? "is-active" : ""}
                onClick={() => setDeliveryTimeTab("today")}
              >
                {copy.deliveryTimeToday}
              </button>
              <button
                type="button"
                className={deliveryTimeTab === "other" ? "is-active" : ""}
                onClick={() => setDeliveryTimeTab("other")}
              >
                {copy.deliveryTimeOther}
              </button>
            </div>

            {deliveryTimeTab === "today" ? (
              <button
                type="button"
                className="delivery-time-option is-active"
                onClick={() => {
                  setDeliveryTimeMode("today");
                  setDeliveryTimeOpen(false);
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{copy.deliveryTimeToday}</div>
                  <div className="site-subtitle">
                    {copy.deliveryTimeTodayOption} {DEFAULT_DELIVERY_MINUTES} {copy.deliveryTimeMinutes}
                  </div>
                </div>
                <span className="delivery-time-check">✓</span>
              </button>
            ) : (
              <div className="delivery-time-custom">
                <label className="checkout-field">
                  {copy.deliveryTimeChooseDate}
                  <input
                    className="checkout-input"
                    type="date"
                    value={deliveryDate}
                    min={minOtherDeliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </label>
                <label className="checkout-field">
                  {copy.deliveryTimeChooseTime}
                  <input
                    className="checkout-input"
                    type="time"
                    value={deliveryClock}
                    step={300}
                    onChange={(e) => setDeliveryClock(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="site-button site-button--primary"
                  disabled={!deliveryDate || !deliveryClock}
                  onClick={() => {
                    if (!deliveryDate || !deliveryClock) return;
                    setDeliveryTimeMode("other");
                    setDeliveryTimeOpen(false);
                  }}
                >
                  {copy.deliveryTimeApply}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {confirmOpen ? (
        <div className="site-popup" role="dialog" aria-modal="true">
          <div className="site-popup__card">
            <div className="site-popup__title">{copy.confirmTitle}</div>
            <div className="site-popup__actions">
              <button
                className="site-button site-button--primary"
                disabled={loading}
                onClick={() => {
                  setConfirmOpen(false);
                  placeOrder();
                }}
              >
                {copy.confirmYes}
              </button>
              <button
                className="site-button site-button--ghost"
                disabled={loading}
                onClick={() => setConfirmOpen(false)}
              >
                {copy.confirmNo}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div className="site-popup" role="dialog" aria-modal="true">
          <div className="site-popup__card">
            <div className="site-popup__badge">Wasabi</div>
            <div className="site-popup__title">{copy.successTitle}</div>
            <div className="site-popup__text">{copy.successText}</div>
            {successOrderId ? (
              <div className="site-popup__order">
                {copy.successOrderLabel}: <strong>#{successOrderId}</strong>
              </div>
            ) : null}
            <div className="site-popup__actions">
              <button
                className="site-button site-button--primary"
                onClick={() => {
                  setSuccessOpen(false);
                  router.push(`/${locale}#products`);
                }}
              >
                {copy.successCta}
              </button>
              <button
                className="site-button site-button--ghost"
                onClick={() => setSuccessOpen(false)}
              >
                {copy.successClose}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
