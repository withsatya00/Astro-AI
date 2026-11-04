// The Astro Mall cart, kept in this browser so it survives a refresh and is shared by the shop, product and checkout pages.
// Prices stored here are only for display; the server prices every line again at quote and checkout time.
import { useCallback, useEffect, useState } from 'react';

const KEY = 'astro_mall_cart_v1';
const EVENT = 'astro-mall-cart-change';
export const MAX_QTY = 10; // the backend allows at most 10 of one item

export const lineKey = (productId, options = {}) => `${productId}|${JSON.stringify(Object.keys(options).sort().map((k) => [k, options[k]]))}`;

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((i) => i && i.product_id && i.quantity > 0) : [];
  } catch (e) { return []; }
};
const write = (items) => {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* storage unavailable: the cart lasts until the page closes */ }
  window.dispatchEvent(new Event(EVENT));
};

export function addToCart(product, quantity = 1, options = {}, unitPrice) {
  const key = lineKey(product.id, options);
  const items = read();
  const found = items.find((i) => i.key === key);
  if (found) found.quantity = Math.min(MAX_QTY, found.quantity + quantity);
  else {
    items.push({
      key, product_id: product.id, quantity: Math.min(MAX_QTY, quantity), options,
      title: product.title, image: product.image, unit_price: unitPrice ?? product.price,
    });
  }
  write(items);
}

export const setQuantity = (key, quantity) => write(read().map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(MAX_QTY, quantity)) } : i)));
export const removeLine = (key) => write(read().filter((i) => i.key !== key));
export const clearCart = () => write([]);

export function useCart() {
  const [items, setItems] = useState(read);
  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.unit_price * i.quantity, 0);
  return { items, count, subtotal, add: useCallback(addToCart, []), setQuantity, remove: removeLine, clear: clearCart };
}
