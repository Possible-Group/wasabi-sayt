"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/t";
import { getCart, cartSubtotal, clearCart, type CartItem } from "@/lib/cart/cart";
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
    mapLoading: "Загружаем карту...",
    mapError: "Не удалось загрузить карту. Попробуйте позже.",
    pickupTitle: "Филиалы для самовывоза",
    pickupEmpty: "Филиалы не найдены.",
    paymentTitle: "Оплата",
    paymentCash: "Наличными",
    paymentCard: "Картой",
    bonusTitle: "Бонусы",
    bonusAvailable: "Доступно бонусов",
    bonusUse: "Списать бонусы",
    bonusNone: "Нет доступных бонусов",
    promoHint: "Промокод проверим при подтверждении.",
    subtotalLabel: "Сумма заказа",
    deliveryFeeLabel: "Доставка",
    packageFeeLabel: "Упаковка",
    bonusUsedLabel: "Списано бонусами",
    totalLabel: "К оплате",
    errAuth: "Авторизуйтесь, чтобы оформить заказ.",
    errLocation: "Укажите точку на карте.",
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
    mapLoading: "Xarita yuklanmoqda...",
    mapError: "Xaritani yuklab bo'lmadi. Keyinroq urinib ko'ring.",
    pickupTitle: "Olib ketish filiallari",
    pickupEmpty: "Filiallar topilmadi.",
    paymentTitle: "To'lov",
    paymentCash: "Naqd",
    paymentCard: "Karta",
    bonusTitle: "Bonuslar",
    bonusAvailable: "Mavjud bonuslar",
    bonusUse: "Bonusdan foydalanish",
    bonusNone: "Bonuslar yo'q",
    promoHint: "Promokodni tasdiqlashda tekshiramiz.",
    subtotalLabel: "Buyurtma summasi",
    deliveryFeeLabel: "Yetkazish",
    packageFeeLabel: "Qadoq",
    bonusUsedLabel: "Bonusdan yechildi",
    totalLabel: "To'lash",
    errAuth: "Buyurtma uchun kirish kerak.",
    errLocation: "Xaritadan manzilni tanlang.",
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

function formatMoney(value: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : "ru-RU").format(value);
  } catch {
    return String(value);
  }
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
  const [promoCode, setPromoCode] = useState("");
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");
  const [bonusInput, setBonusInput] = useState("");

  const [locations, setLocations] = useState<AboutLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [pickupSpotId, setPickupSpotId] = useState("");

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const addressRequestId = useRef(0);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

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
    }
  }, [showMap]);

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
            const placemark = new ymaps.Placemark([coords.lat, coords.lng], {}, { draggable: true });
            placemark.events.add("dragend", (e: any) => {
              const pos = e.get("target").geometry.getCoordinates();
              const nextLat = Number(pos[0]);
              const nextLng = Number(pos[1]);
              setCoords({ lat: nextLat, lng: nextLng });
              const reqId = ++addressRequestId.current;
              resolveAddressByCoords(ymaps, nextLat, nextLng).then((resolved) => {
                if (cancelled || reqId !== addressRequestId.current) return;
                if (resolved) setAddress(resolved);
              });
            });
            markerRef.current = placemark;
            map.geoObjects.add(placemark);
          }

          map.events.add("click", (e: any) => {
            const pos = e.get("coords") as [number, number];
            const nextLat = Number(pos[0]);
            const nextLng = Number(pos[1]);
            setSelectedLocationId(null);
            setCoords({ lat: nextLat, lng: nextLng });
            map.setCenter(pos);

            if (markerRef.current) {
              markerRef.current.geometry.setCoordinates(pos);
            } else {
              const placemark = new ymaps.Placemark(pos, {}, { draggable: true });
              markerRef.current = placemark;
              map.geoObjects.add(placemark);
            }

            const reqId = ++addressRequestId.current;
            resolveAddressByCoords(ymaps, nextLat, nextLng).then((resolved) => {
              if (cancelled || reqId !== addressRequestId.current) return;
              if (resolved) setAddress(resolved);
            });
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
    if (!mapInstance.current) return;
    const onResize = () => {
      mapInstance.current?.container?.fitToViewport?.();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mapStatus]);

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

  async function saveCurrentLocation() {
    if (!coords) return;
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
    } finally {
      setSavingLocation(false);
    }
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

  const subtotal = cartSubtotal(items);
  const subtotalSum = subtotal / 100;
  const feesSum = fees.pack + (deliveryType === "delivery" ? fees.delivery : 0);
  const totalBeforeBonus = Math.max(0, subtotalSum + feesSum);
  const bonusAvailable = Number(client?.bonus ?? 0) || 0;
  const bonusCandidate = useMemo(() => {
    const raw = bonusInput.trim().replace(",", ".");
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  }, [bonusInput]);
  const bonusUsed = Math.min(Math.max(bonusCandidate, 0), bonusAvailable, totalBeforeBonus);
  const totalSum = Math.max(0, totalBeforeBonus - bonusUsed);

  async function placeOrder() {
    setErr(null);

    if (!client) {
      setErr(copy.errAuth);
      return;
    }
    if (items.length === 0) {
      return setErr(locale === "uz" ? "Savat bo'sh" : "Корзина пустая");
    }
    if (!phone.trim()) {
      return setErr(locale === "uz" ? "Telefon kiriting" : "Введите телефон");
    }

    if (deliveryType === "delivery") {
      if (!coords) return setErr(copy.errLocation);
      if (!address.trim()) return setErr(locale === "uz" ? "Manzil kiriting" : "Введите адрес");
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
          address: deliveryType === "delivery" ? address.trim() : undefined,
          lat: deliveryType === "delivery" ? coords?.lat : undefined,
          lng: deliveryType === "delivery" ? coords?.lng : undefined,
          spotId: deliveryType === "pickup" ? pickupSpotId : undefined,
          paymentMethod,
          bonusAmount: bonusUsed || 0,
          promoCode: promoCode.trim() || undefined,
          comment: comment.trim() || undefined,
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
      if (deliveryType === "delivery" && coords) {
        await saveCurrentLocation();
      }
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
              <Link className="site-button site-button--primary" href={`/${locale}/menu`}>
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
                    <button
                      type="button"
                      className="site-button site-button--ghost checkout-map-toggle"
                      onClick={() => setShowMap((prev) => !prev)}
                    >
                      {showMap ? copy.hideMap : copy.addLocation}
                    </button>
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
                      <div style={{ fontWeight: 600 }}>{copy.mapTitle}</div>
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
                        const addressText =
                          locale === "uz"
                            ? loc.addressUz || loc.addressRu
                            : loc.addressRu || loc.addressUz;
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
                    <span>{copy.paymentCash}</span>
                  </label>
                  <label
                    className={`checkout-payment__option${paymentMethod === "card" ? " is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                    />
                    <span>{copy.paymentCard}</span>
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
                <div className="checkout-summary__row">
                  <span>{copy.packageFeeLabel}</span>
                  <span>
                    {formatMoney(fees.pack, locale)} {locale === "uz" ? "so'm" : "сум"}
                  </span>
                </div>
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
                onClick={placeOrder}
              >
                {loading ? "..." : t(locale, "common.placeOrder")}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer locale={locale} />

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
                  router.push(`/${locale}/menu`);
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
