export type CartItem = {
  product_id: string;
  name: string;
  price: number; // tiyin
  qty: number;
  image?: string;
};

const KEY = "wasabi_cart_v1";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
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
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((s, it) => s + it.price * it.qty, 0);
}