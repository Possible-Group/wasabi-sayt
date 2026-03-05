import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/auth/rateLimit";
import { isWithinWorkHours } from "@/lib/utils/timeWindow";
import { getClientSession } from "@/lib/auth/clientAuth";
import { findPosterClientByPhone, normalizePosterClient } from "@/lib/poster/posterClients";
import { posterFetch } from "@/lib/poster/posterClient";
import { cached } from "@/lib/poster/posterCache";
import { sendEskizSms, type SendEskizSmsResult } from "@/lib/sms/eskiz";

const PACKAGE_ITEM_ID = "package_fee";
const CHOPSTICKS_ITEM_ID = "chopsticks";

const Item = z.object({
  product_id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(), // tiyin
  qty: z.number().int().positive(),
  menu_category_id: z.union([z.string(), z.number()]).optional(),
  photo: z.string().optional(),
});

const Body = z.object({
  customerPhone: z.string().optional(),
  customerName: z.string().optional(),
  deliveryType: z.enum(["delivery", "pickup"]),
  deliveryTimeMode: z.enum(["today", "other"]).optional(),
  deliveryDate: z.string().optional(),
  deliveryClock: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  spotId: z.string().optional(),
  persons: z.number().int().positive().optional(),
  promoCode: z.string().optional(),
  comment: z.string().optional(),
  paymentMethod: z.enum(["cash", "card"]),
  bonusAmount: z.number().nonnegative().optional(),
  items: z.array(Item).min(1),
  utm: z.record(z.string()).optional(),
});

function parseIntSetting(v: string | undefined, def: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isClockTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getDateInTimeZone(value: Date, timeZone = "Asia/Tashkent") {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function normalizePromoCode(value: string) {
  return value.trim().toUpperCase();
}

function extractPromoCode(value: string) {
  const parts = value.split("$");
  if (parts.length < 2) return "";
  return normalizePromoCode(parts[1].trim());
}

type PosterPromotion = {
  auto_apply?: string | number;
  name?: string;
  params?: {
    discount_value?: string | number;
    result_type?: string | number;
  };
  promotion_id?: string | number;
};

type PromoInfo = {
  promotionId: number | null;
  discountValue: number;
  resultType: number;
};

async function getPosterPromoByCode(code: string): Promise<PromoInfo | null> {
  const lookup = normalizePromoCode(code);
  if (!lookup) return null;
  try {
    const data = await cached("poster:promo_codes", 60_000, () =>
      posterFetch<{ response?: PosterPromotion[] }>("clients.getPromotions")
    );
    const list = Array.isArray(data?.response) ? data.response : [];
    for (const promo of list) {
      if (String(promo?.auto_apply ?? "") !== "1") continue;
      const name = String(promo?.name ?? "");
      const promoCode = extractPromoCode(name);
      if (!promoCode) continue;
      if (promoCode === lookup) {
        const discountValue = Number(promo?.params?.discount_value ?? 0) || 0;
        const resultType = Number(promo?.params?.result_type ?? 0) || 0;
        const promotionIdRaw = promo?.promotion_id;
        const promotionId =
          promotionIdRaw !== undefined && promotionIdRaw !== null && String(promotionIdRaw).trim()
            ? Number(promotionIdRaw)
            : null;
        return {
          promotionId: Number.isFinite(promotionId) ? promotionId : null,
          discountValue,
          resultType,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function applyDiscount(price: number, promo: PromoInfo | null) {
  if (!promo || promo.discountValue <= 0) return price;
  if (promo.resultType === 3) {
    return price * (1 - promo.discountValue / 100);
  }
  if (promo.resultType === 1) {
    return Math.max(0, price - promo.discountValue);
  }
  return price;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatMoney(sum: number) {
  return `${sum.toLocaleString("ru-RU")} сум`;
}

function paymentLabel(method: string) {
  if (method === "card") return "Карта";
  if (method === "cash") return "Наличными";
  return method || "—";
}

function escapeTelegram(text: string) {
  return text.replace(/[<>&]/g, (ch) => {
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    return "&amp;";
  });
}

function appendExtraComment(base: string, extra: string) {
  const trimmed = base.trim();
  if (!extra) return trimmed;
  return trimmed ? `${trimmed}\n${extra}` : extra;
}

function buildOrderSmsText(params: {
  orderPublicId: string;
  totalSum: number;
  deliveryType: "delivery" | "pickup";
}) {
  const delivery = params.deliveryType === "delivery" ? "Доставка" : "Самовывоз";
  return `Wasabi Sushi: заказ №${params.orderPublicId} принят. Сумма ${formatMoney(params.totalSum)}. ${delivery}.`;
}

async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  }).catch(() => null);
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = Number(process.env.ORDER_RATE_LIMIT_PER_MIN || 10);
  const rl = rateLimit(`order:${ip}`, limit, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const payload = await req.json().catch(() => null);
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  const body = parsed.data;
  const deliveryType = body.deliveryType;
  const deliveryTimeMode = body.deliveryTimeMode;
  const deliveryDate = String(body.deliveryDate ?? "").trim();
  const deliveryClock = String(body.deliveryClock ?? "").trim();

  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // settings
  const settings = await prisma.botSetting.findMany({
    where: { key: { in: ["work_start", "work_end", "package_fee", "delivery_fee"] } },
  });
  const map: Record<string, string> = {};
  settings.forEach(s => (map[s.key] = s.value));

  const workStart = map["work_start"] || "10:00";
  const workEnd = map["work_end"] || "23:00";
  const open = isWithinWorkHours(new Date(), workStart, workEnd);
  const hasScheduledFutureDelivery =
    deliveryType === "delivery" &&
    deliveryTimeMode === "other" &&
    isIsoDate(deliveryDate) &&
    isClockTime(deliveryClock) &&
    deliveryDate > getDateInTimeZone(new Date());
  if (!open && !hasScheduledFutureDelivery) {
    return NextResponse.json(
      { error: "CLOSED", workStart, workEnd },
      { status: 400 }
    );
  }

  const deliveryFee = parseIntSetting(map["delivery_fee"], 0);
  const address = String(body.address ?? "").trim();
  const lat = body.lat;
  const lng = body.lng;
  const spotIdRaw = String(body.spotId ?? "").trim();

  if (deliveryType === "delivery") {
    if (!address) {
      return NextResponse.json({ error: "ADDRESS_REQUIRED" }, { status: 400 });
    }
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "LOCATION_REQUIRED" }, { status: 400 });
    }
  } else if (!spotIdRaw) {
    return NextResponse.json({ error: "SPOT_REQUIRED" }, { status: 400 });
  }

  const promoCodeInput = body.promoCode ? normalizePromoCode(body.promoCode) : "";
  const promo = promoCodeInput ? await getPosterPromoByCode(promoCodeInput) : null;
  if (promoCodeInput && !promo) {
    return NextResponse.json({ error: "INVALID_PROMO" }, { status: 400 });
  }

  const phoneLookup = String(session.phone ?? "").trim();
  const posterClient = phoneLookup ? await findPosterClientByPhone(phoneLookup) : null;
  const normalizedClient = posterClient ? normalizePosterClient(posterClient) : null;
  const bonusAvailable = Number(normalizedClient?.bonus ?? 0) || 0;

  const customerPhone =
    String(body.customerPhone ?? "").trim() ||
    String(session.phone ?? "").trim() ||
    String(normalizedClient?.phone ?? "").trim();
  const customerName =
    String(body.customerName ?? "").trim() ||
    String(session.name ?? "").trim() ||
    String(normalizedClient?.name ?? "").trim();

  if (!customerPhone) {
    return NextResponse.json({ error: "PHONE_REQUIRED" }, { status: 400 });
  }

  const clientIdRaw = digitsOnly(normalizedClient?.id || "");
  if (!clientIdRaw) {
    return NextResponse.json({ error: "CLIENT_NOT_FOUND" }, { status: 404 });
  }

  const packageItems = body.items.filter((it) => it.product_id === PACKAGE_ITEM_ID);
  const chopsticksItems = body.items.filter((it) => it.product_id === CHOPSTICKS_ITEM_ID);
  const regularItems = body.items.filter(
    (it) => it.product_id !== PACKAGE_ITEM_ID && it.product_id !== CHOPSTICKS_ITEM_ID
  );
  if (!regularItems.length) {
    return NextResponse.json({ error: "EMPTY_CART" }, { status: 400 });
  }
  const packageQty = packageItems.reduce((sum, it) => sum + it.qty, 0);
  const packageFee = packageQty > 0 ? parseIntSetting(map["package_fee"], 0) * packageQty : 0;
  const chopsticksIncluded = chopsticksItems.length > 0;

  const subtotalT = regularItems.reduce((s, it) => s + it.price * it.qty, 0);
  const promoDiscountT = promo
    ? regularItems.reduce((s, it) => {
        const discounted = applyDiscount(it.price, {
          ...promo,
          discountValue: promo.resultType === 1 ? promo.discountValue * 100 : promo.discountValue,
        });
        return s + Math.max(0, it.price - discounted) * it.qty;
      }, 0)
    : 0;
  const feesSum = packageFee + (deliveryType === "delivery" ? deliveryFee : 0);
  const subtotalSum = subtotalT / 100;
  const promoDiscountSum = promoDiscountT / 100;
  const totalBeforeBonus = Math.max(0, subtotalSum - promoDiscountSum + feesSum);

  const bonusRequested = Number(body.bonusAmount ?? 0) || 0;
  const bonusCapped = Math.min(bonusRequested, bonusAvailable, totalBeforeBonus);
  if (bonusRequested > bonusAvailable) {
    return NextResponse.json({ error: "BONUS_EXCEEDED", bonusAvailable }, { status: 400 });
  }
  const totalSum = Math.max(0, totalBeforeBonus - bonusCapped);
  const totalT = Math.round(totalSum * 100);

  const serviceMode = deliveryType === "delivery" ? 3 : 2;
  const spotId = digitsOnly(spotIdRaw);

  const productsPayload = regularItems.map((it) => {
    const idRaw = digitsOnly(it.product_id);
    const idNum = idRaw ? Number(idRaw) : Number(it.product_id);
    const priceSum = it.price / 100;
    const discountedSum = promo ? applyDiscount(priceSum, promo) : priceSum;
    return {
      product_id: Number.isFinite(idNum) ? idNum : 0,
      product_name: it.name,
      count: it.qty,
      price: priceSum,
      discounted_price: discountedSum,
      promotion_id: promo?.promotionId ?? null,
      discount_value: promo?.discountValue ?? 0,
      result_type: promo?.resultType ?? 0,
      menu_category_id: it.menu_category_id ?? undefined,
      photo_origin: it.photo ?? undefined,
    };
  });

  const commentText = appendExtraComment(
    String(body.comment ?? ""),
    chopsticksIncluded ? "" : "Без палочек"
  );

  const orderPayload = {
    service_mode: serviceMode,
    spot_id: spotId ? Number(spotId) : 0,
    payment_method: body.paymentMethod,
    bonus: bonusCapped,
    products: productsPayload,
    total: totalSum,
    chat_id: 0,
    phone: customerPhone,
    location:
      deliveryType === "delivery"
        ? { latitude: lat, longitude: lng }
        : { latitude: 0, longitude: 0 },
    status: "website",
    client_id: Number(clientIdRaw),
    pers_num: body.persons ?? 1,
    comment: commentText,
    address: deliveryType === "delivery" ? address : "",
    promocode: promoCodeInput || "",
    promocode_id: promo?.promotionId ?? 0,
  };

  console.log("Order payload:", JSON.stringify(orderPayload, null, 2));

  const orderApiUrl = "https://wasabi-admin.onrender.com/api/order";
  const apiRes = await fetch(orderApiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(orderPayload),
  });
  const apiText = await apiRes.text().catch(() => "");
  if (!apiRes.ok) {
    return NextResponse.json(
      { error: "ORDER_API_ERROR", detail: apiText || apiRes.statusText },
      { status: 502 }
    );
  }
  let apiJson: any = null;
  if (apiText) {
    try {
      apiJson = JSON.parse(apiText);
    } catch {
      apiJson = null;
    }
  }

  const order = await prisma.order.create({
    data: {
      externalId:
        apiJson?.order_id !== undefined && apiJson?.order_id !== null
          ? String(apiJson.order_id)
          : null,
      customerPhone,
      customerName: customerName || null,
      deliveryType,
      address: deliveryType === "delivery" ? address : null,
      lat: deliveryType === "delivery" ? lat ?? null : null,
      lng: deliveryType === "delivery" ? lng ?? null : null,
      persons: body.persons ?? 1,
      itemsJson: JSON.stringify(regularItems),
      subtotal: subtotalT,
      packageFee: Math.round(packageFee * 100),
      deliveryFee: Math.round(deliveryFee * 100),
      discount: Math.round((promoDiscountSum + bonusCapped) * 100),
      total: totalT,
      status: "new",
    },
  });

  const productDetails = productsPayload.length
    ? productsPayload.map((p) => `• ${escapeTelegram(p.product_name)} — ${p.count} шт.`).join("\n")
    : "—";
  const deliveryLabel = deliveryType === "delivery" ? "Доставка" : "Навынос";
  const header = apiJson?.order_id ? `Заказ #${apiJson.order_id}` : `Заказ #${order.id}`;
  const addressLine =
    deliveryType === "delivery"
      ? `Адрес: ${escapeTelegram(address || "—")}`
      : spotId
      ? `Филиал: ${spotId}`
      : "Филиал: —";
  const promoLine = promoCodeInput ? `Промокод: ${promoCodeInput}` : "Промокод: —";
  const bonusLine = bonusCapped > 0 ? `Бонусы: ${formatMoney(bonusCapped)}` : "Бонусы: —";
  const commentLine = commentText ? `Комментарий: ${escapeTelegram(commentText)}` : "Комментарий: —";

  const telegramMessage = [
    `🍣 ${header}`,
    `Тип: ${deliveryLabel}`,
    `Телефон: ${escapeTelegram(customerPhone)}`,
    addressLine,
    `Оплата: ${paymentLabel(body.paymentMethod)}`,
    `Сумма: ${formatMoney(totalSum)}`,
    bonusLine,
    promoLine,
    "Товары:",
    productDetails,
    commentLine,
  ].join("\n");

  await sendTelegramNotification(telegramMessage);

  const orderPublicId = apiJson?.order_id ? String(apiJson.order_id) : String(order.id);
  const smsMessage = buildOrderSmsText({
    orderPublicId,
    totalSum,
    deliveryType,
  });
  const smsResult: SendEskizSmsResult = await sendEskizSms({
    mobilePhone: customerPhone,
    message: smsMessage,
    userSmsId: String(order.id),
  }).catch((error) => {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, error: detail } satisfies SendEskizSmsResult;
  });
  if (!smsResult.ok && !smsResult.skipped) {
    console.error("Eskiz SMS error:", smsResult.error || "UNKNOWN");
  }

  return NextResponse.json({ ok: true, orderId: order.id });
}
