export type CartItem = {
  product_id: string;
  name: string;
  price: number; // tiyin
  qty: number;
  image?: string;
};

const KEY = "wasabi_cart_v1";
export const PACKAGE_ITEM_ID = "package_fee";
export const CHOPSTICKS_ITEM_ID = "chopsticks";
const PACKAGE_OPT_OUT_KEY = "wasabi_cart_package_opt_out_v1";
const CHOPSTICKS_OPT_OUT_KEY = "wasabi_cart_chopsticks_opt_out_v1";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("wasabi-cart-updated"));
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.product_id === item.product_id);
  if (idx >= 0) cart[idx].qty += qty;
  else cart.push({ ...item, qty });
  setCart(cart);
  return cart;
}

export function updateQty(product_id: string, qty: number) {
  const cart = getCart().map((x) => (x.product_id === product_id ? { ...x, qty } : x));
  const filtered = cart.filter((x) => x.qty > 0);
  setCart(filtered);
  return filtered;
}

export function clearCart() {
  setCart([]);
  clearPackageOptOut();
  clearChopsticksOptOut();
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((s, it) => s + it.price * it.qty, 0);
}

export function isPackageItem(item: CartItem) {
  return item.product_id === PACKAGE_ITEM_ID;
}

export function isChopsticksItem(item: CartItem) {
  return item.product_id === CHOPSTICKS_ITEM_ID;
}

export function isExtraItem(item: CartItem) {
  return isPackageItem(item) || isChopsticksItem(item);
}

export function getPackageTotal(items: CartItem[]) {
  return items.reduce((sum, item) => (isPackageItem(item) ? sum + item.price * item.qty : sum), 0);
}

export function getItemsSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => (isExtraItem(item) ? sum : sum + item.price * item.qty), 0);
}

export function getPackageOptOut() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PACKAGE_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPackageOptOut(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) localStorage.setItem(PACKAGE_OPT_OUT_KEY, "1");
    else localStorage.removeItem(PACKAGE_OPT_OUT_KEY);
  } catch {
    // ignore storage errors
  }
}

export function clearPackageOptOut() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PACKAGE_OPT_OUT_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getChopsticksOptOut() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CHOPSTICKS_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setChopsticksOptOut(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) localStorage.setItem(CHOPSTICKS_OPT_OUT_KEY, "1");
    else localStorage.removeItem(CHOPSTICKS_OPT_OUT_KEY);
  } catch {
    // ignore storage errors
  }
}

export function clearChopsticksOptOut() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CHOPSTICKS_OPT_OUT_KEY);
  } catch {
    // ignore storage errors
  }
}
