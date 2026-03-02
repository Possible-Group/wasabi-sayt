import "server-only";

import { prisma } from "@/lib/db/prisma";

import { normalizePhone } from "./posterClients";
import { cached } from "./posterCache";
import { posterFetch } from "./posterClient";
import { mapPosterProducts } from "./posterMapper";

const HISTORY_DAYS = parsePositiveInt(process.env.POSTER_ACCOUNT_ORDERS_DAYS, 180);
const MAX_RETURNED_ORDERS = parsePositiveInt(process.env.POSTER_ACCOUNT_ORDERS_LIMIT, 50);
const TRANSACTIONS_PER_PAGE = Math.min(
  parsePositiveInt(process.env.POSTER_ACCOUNT_ORDERS_PER_PAGE, 500),
  1000
);
const MAX_TRANSACTION_PAGES = parsePositiveInt(process.env.POSTER_ACCOUNT_ORDERS_MAX_PAGES, 20);
const PRODUCTS_TTL = 60_000;

type ProductCatalogEntry = {
  name: string;
  nameUz: string | null;
};

type PosterIncomingOrderProduct = {
  product_id?: string | number | null;
  modificator_id?: string | number | null;
  count?: string | number | null;
};

type PosterIncomingOrder = {
  incoming_order_id?: string | number | null;
  status?: string | number | null;
  client_id?: string | number | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  transaction_id?: string | number | null;
  service_mode?: string | number | null;
  products?: PosterIncomingOrderProduct[] | null;
};

type PosterTransactionProduct = {
  product_id?: string | number | null;
  modification_id?: string | number | null;
  num?: string | number | null;
  product_sum?: string | number | null;
};

type PosterTransaction = {
  transaction_id?: string | number | null;
  client_id?: string | number | null;
  sum?: string | number | null;
  date_close?: string | null;
  pay_type?: string | number | null;
  discount?: string | number | null;
  products?: PosterTransactionProduct[] | null;
};

type PosterTransactionResponse = {
  count?: string | number | null;
  data?: PosterTransaction[] | null;
};

export type PosterAccountOrderItem = {
  productId: string;
  modificationId: string | null;
  quantity: number;
  totalMinor: number | null;
  name: string;
  nameUz: string | null;
};

export type PosterAccountOrder = {
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
  items: PosterAccountOrderItem[];
};

function parsePositiveInt(value: string | undefined, fallback: number) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.trunc(num);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatPosterDate(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function formatPosterDateTime(value: Date) {
  return `${formatPosterDate(value)} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

function normalizeId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = String(value).trim().replace(/\s+/g, "").replace(",", ".");
  if (!normalized) return null;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseInteger(value: unknown, fallback = 0) {
  const numeric = parseNumeric(value);
  if (numeric === null) return fallback;
  return Math.trunc(numeric);
}

function parseMoneyToMinor(value: unknown): number | null {
  const numeric = parseNumeric(value);
  if (numeric === null) return null;
  return Math.round(numeric * 100);
}

function normalizeProductName(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) return "";
  const markerIndex = normalized.indexOf("$");
  return markerIndex >= 0 ? normalized.slice(0, markerIndex).trim() : normalized;
}

function mapIncomingStatus(status: unknown): PosterAccountOrder["status"] {
  const numeric = parseInteger(status, 0);
  if (numeric === 7) return "cancelled";
  if (numeric === 1) return "accepted";
  return "new";
}

function buildFallbackProductName(productId: string) {
  return productId ? `#${productId}` : "Item";
}

async function fetchProducts(categoryId?: string | null) {
  const cacheKey = `poster:orders:products:${categoryId || "all"}`;
  return cached(cacheKey, PRODUCTS_TTL, () =>
    posterFetch<any>("menu.getProducts", { category_id: categoryId || undefined })
  );
}

async function fetchAllPosterProducts() {
  let mapped = mapPosterProducts(await fetchProducts(null));
  if (mapped.length) return mapped;

  const categoriesRaw = await cached("poster:orders:categories", PRODUCTS_TTL, () =>
    posterFetch<any>("menu.getCategories")
  );
  const categories = Array.isArray(categoriesRaw?.response) ? categoriesRaw.response : [];
  const ids: string[] = categories
    .map((category: any) => normalizeId(category?.category_id ?? category?.id))
    .filter((value: string | null): value is string => Boolean(value));

  if (!ids.length) return [];

  const byCategory = await Promise.all(ids.map((id) => fetchProducts(id).catch(() => null)));
  mapped = byCategory.flatMap((response, index) => {
    if (!response) return [];
    const list = mapPosterProducts(response);
    if (!list.length) return [];
    const categoryId = ids[index];
    return list.map((product) => (product.category_id ? product : { ...product, category_id: categoryId }));
  });

  return mapped;
}

async function getProductCatalog() {
  return cached("poster:orders:catalog:v1", PRODUCTS_TTL, async () => {
    const [products, translations] = await Promise.all([
      fetchAllPosterProducts().catch(() => []),
      prisma.productTranslation.findMany({
        select: { productId: true, nameUz: true },
      }),
    ]);

    const uzMap = new Map(
      translations
        .map((row) => [String(row.productId ?? "").trim(), String(row.nameUz ?? "").trim() || null] as const)
        .filter(([productId]) => Boolean(productId))
    );

    const catalog = new Map<string, ProductCatalogEntry>();
    for (const product of products) {
      const productId = normalizeId(product?.product_id);
      if (!productId) continue;
      const name = normalizeProductName(product?.product_name);
      catalog.set(productId, {
        name: name || buildFallbackProductName(productId),
        nameUz: uzMap.get(productId) ?? null,
      });
    }

    for (const [productId, nameUz] of uzMap.entries()) {
      const current = catalog.get(productId);
      if (current) {
        current.nameUz = current.nameUz || nameUz || null;
        continue;
      }
      catalog.set(productId, {
        name: buildFallbackProductName(productId),
        nameUz: nameUz || null,
      });
    }

    return catalog;
  });
}

async function fetchIncomingOrders(dateFrom: string, dateTo: string) {
  const statuses = [0, 1, 7];
  const results = await Promise.all(
    statuses.map((status) =>
      posterFetch<{ response?: PosterIncomingOrder[] }>("incomingOrders.getIncomingOrders", {
        status,
        date_from: dateFrom,
        date_to: dateTo,
        timezone: "client",
      })
        .then((payload) => (Array.isArray(payload?.response) ? payload.response : []))
        .catch(() => [])
    )
  );

  const deduped = new Map<string, PosterIncomingOrder>();
  for (const order of results.flat()) {
    const orderId = normalizeId(order?.incoming_order_id);
    if (!orderId) continue;
    deduped.set(orderId, order);
  }

  return [...deduped.values()];
}

async function fetchTransactions(dateFrom: string, dateTo: string) {
  const firstPage = await posterFetch<{ response?: PosterTransactionResponse }>(
    "transactions.getTransactions",
    {
      date_from: dateFrom,
      date_to: dateTo,
      per_page: TRANSACTIONS_PER_PAGE,
      page: 1,
    }
  );

  const response = firstPage?.response;
  const firstData = Array.isArray(response?.data) ? response.data : [];
  const totalCount = parseInteger(response?.count, firstData.length);
  const totalPages = Math.min(
    Math.max(1, Math.ceil(totalCount / TRANSACTIONS_PER_PAGE)),
    MAX_TRANSACTION_PAGES
  );

  if (totalPages <= 1) return firstData;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      posterFetch<{ response?: PosterTransactionResponse }>("transactions.getTransactions", {
        date_from: dateFrom,
        date_to: dateTo,
        per_page: TRANSACTIONS_PER_PAGE,
        page: index + 2,
      })
        .then((payload) => (Array.isArray(payload?.response?.data) ? payload.response.data : []))
        .catch(() => [])
    )
  );

  return firstData.concat(...rest);
}

function buildItemFromIncoming(
  item: PosterIncomingOrderProduct,
  productCatalog: Map<string, ProductCatalogEntry>
): PosterAccountOrderItem {
  const productId = normalizeId(item?.product_id) || "";
  const catalogEntry = productId ? productCatalog.get(productId) : null;
  return {
    productId,
    modificationId: normalizeId(item?.modificator_id),
    quantity: Math.max(1, parseInteger(item?.count, 1)),
    totalMinor: null,
    name: catalogEntry?.name || buildFallbackProductName(productId),
    nameUz: catalogEntry?.nameUz || null,
  };
}

function buildItemFromTransaction(
  item: PosterTransactionProduct,
  productCatalog: Map<string, ProductCatalogEntry>
): PosterAccountOrderItem {
  const productId = normalizeId(item?.product_id) || "";
  const catalogEntry = productId ? productCatalog.get(productId) : null;
  return {
    productId,
    modificationId: normalizeId(item?.modification_id),
    quantity: Math.max(1, parseInteger(item?.num, 1)),
    totalMinor: parseMoneyToMinor(item?.product_sum),
    name: catalogEntry?.name || buildFallbackProductName(productId),
    nameUz: catalogEntry?.nameUz || null,
  };
}

function sortOrdersDesc(left: PosterAccountOrder, right: PosterAccountOrder) {
  const leftTime = Date.parse(left.closedAt || left.updatedAt || left.createdAt || "") || 0;
  const rightTime = Date.parse(right.closedAt || right.updatedAt || right.createdAt || "") || 0;
  return rightTime - leftTime;
}

export async function getPosterAccountOrders({
  clientId,
  phone,
}: {
  clientId: string;
  phone?: string;
}) {
  const normalizedClientId = String(clientId || "").trim();
  const normalizedPhone = normalizePhone(phone || "");
  if (!normalizedClientId && !normalizedPhone) return [];

  const dateTo = new Date();
  const dateFrom = new Date(dateTo.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
  const [incomingResult, transactionsResult, productCatalogResult] = await Promise.allSettled([
    fetchIncomingOrders(formatPosterDateTime(dateFrom), formatPosterDateTime(dateTo)),
    fetchTransactions(formatPosterDate(dateFrom), formatPosterDate(dateTo)),
    getProductCatalog(),
  ]);

  if (incomingResult.status === "rejected" && transactionsResult.status === "rejected") {
    throw new Error("Poster order history is unavailable");
  }

  const incomingOrders = incomingResult.status === "fulfilled" ? incomingResult.value : [];
  const transactions = transactionsResult.status === "fulfilled" ? transactionsResult.value : [];
  const productCatalog =
    productCatalogResult.status === "fulfilled" ? productCatalogResult.value : new Map<string, ProductCatalogEntry>();

  const filteredIncoming = incomingOrders.filter((order) => {
    const orderClientId = normalizeId(order?.client_id);
    if (orderClientId && normalizedClientId && orderClientId === normalizedClientId) return true;
    const orderPhone = normalizePhone(String(order?.phone ?? ""));
    return Boolean(orderPhone && normalizedPhone && orderPhone === normalizedPhone);
  });

  const filteredTransactions = transactions.filter((transaction) => {
    const transactionClientId = normalizeId(transaction?.client_id);
    return Boolean(transactionClientId && normalizedClientId && transactionClientId === normalizedClientId);
  });

  const transactionMap = new Map<string, PosterTransaction>();
  for (const transaction of filteredTransactions) {
    const transactionId = normalizeId(transaction?.transaction_id);
    if (!transactionId) continue;
    transactionMap.set(transactionId, transaction);
  }

  const linkedTransactionIds = new Set<string>();
  const orders: PosterAccountOrder[] = filteredIncoming.map((order) => {
    const incomingOrderId = normalizeId(order?.incoming_order_id);
    const transactionId = normalizeId(order?.transaction_id);
    const transaction = transactionId ? transactionMap.get(transactionId) : null;
    if (transactionId) linkedTransactionIds.add(transactionId);

    const transactionItems = Array.isArray(transaction?.products) ? transaction.products : [];
    const incomingItems = Array.isArray(order?.products) ? order.products : [];
    const items = transactionItems.length
      ? transactionItems.map((item) => buildItemFromTransaction(item, productCatalog))
      : incomingItems.map((item) => buildItemFromIncoming(item, productCatalog));

    return {
      id: `incoming:${incomingOrderId || transactionId || order?.created_at || order?.updated_at || "unknown"}`,
      source: "incoming",
      status: transaction?.date_close ? "closed" : mapIncomingStatus(order?.status),
      incomingOrderId,
      transactionId,
      serviceMode: parseInteger(order?.service_mode, 0) || null,
      createdAt: order?.created_at || null,
      updatedAt: order?.updated_at || null,
      closedAt: transaction?.date_close || null,
      totalMinor: parseMoneyToMinor(transaction?.sum),
      paymentType: parseInteger(transaction?.pay_type, 0) || null,
      discountPercent: parseNumeric(transaction?.discount),
      items,
    };
  });

  for (const transaction of filteredTransactions) {
    const transactionId = normalizeId(transaction?.transaction_id);
    if (!transactionId || linkedTransactionIds.has(transactionId)) continue;
    const items = Array.isArray(transaction?.products)
      ? transaction.products.map((item) => buildItemFromTransaction(item, productCatalog))
      : [];
    orders.push({
      id: `transaction:${transactionId}`,
      source: "transaction",
      status: "closed",
      incomingOrderId: null,
      transactionId,
      serviceMode: null,
      createdAt: transaction?.date_close || null,
      updatedAt: transaction?.date_close || null,
      closedAt: transaction?.date_close || null,
      totalMinor: parseMoneyToMinor(transaction?.sum),
      paymentType: parseInteger(transaction?.pay_type, 0) || null,
      discountPercent: parseNumeric(transaction?.discount),
      items,
    });
  }

  return orders.sort(sortOrdersDesc).slice(0, MAX_RETURNED_ORDERS);
}
