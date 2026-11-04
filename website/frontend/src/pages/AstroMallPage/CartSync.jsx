// Keeps the browser cart and the account's saved cart in step, so a cart started on one device shows up on another.
//  - page load while signed in: the saved cart wins (it is only ever written from a browser that was signed in); if it is empty, this browser's cart is saved
//  - signing in during this visit: items added as a guest are merged into the saved cart (quantities add up)
//  - any later change is saved after a short pause; signing out empties this browser's copy so the next person on a shared device starts clean
import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchServerCart, mergeServerCart, saveServerCart, quoteCart, isSignedIn } from './mallApi.js';
import { readCart, replaceCart, lineKey, CART_EVENT } from './cartStore.js';

// The saved cart holds no titles, photos or prices, so they are filled in from a quote.
async function hydrate(serverItems) {
  if (!serverItems.length) return [];
  const q = await quoteCart(serverItems.map((i) => ({ ...i, key: lineKey(i.product_id, i.options) })));
  return serverItems.map((i, idx) => {
    const l = q.lines[idx];
    return { key: lineKey(i.product_id, i.options), product_id: i.product_id, quantity: i.quantity, options: i.options || {}, title: l.title, image: l.image_url, unit_price: l.unit_price };
  });
}

export function CartSync() {
  const { currentUser } = useAuth();
  const prev = useRef(undefined); // undefined = first run, null = signed out, string = signed-in user id
  const busy = useRef(false);

  useEffect(() => {
    const id = currentUser ? currentUser.id : null;
    const before = prev.current;
    prev.current = id;
    if (id && before !== id) {
      const justSignedIn = before === null;
      busy.current = true;
      (async () => {
        try {
          const local = readCart();
          let server = (await fetchServerCart()).items;
          if (justSignedIn && local.length) server = (await mergeServerCart(local)).items;
          else if (!server.length && local.length) { await saveServerCart(local); return; }
          const items = await hydrate(server);
          if (JSON.stringify(items.map((i) => [i.key, i.quantity])) !== JSON.stringify(readCart().map((i) => [i.key, i.quantity]))) replaceCart(items);
        } catch (e) { /* offline or an item left the catalogue: this browser's cart keeps working on its own */ }
        finally { busy.current = false; }
      })();
    } else if (!id && before) {
      replaceCart([]);
    }
  }, [currentUser]);

  useEffect(() => {
    let timer = null;
    const flush = (keepalive) => {
      if (timer === null) return;
      clearTimeout(timer);
      timer = null;
      saveServerCart(readCart(), keepalive).catch(() => {});
    };
    const onChange = () => {
      if (busy.current || !isSignedIn()) return;
      clearTimeout(timer);
      timer = setTimeout(() => flush(false), 500);
    };
    // A change made just before the person leaves or reloads must still be saved, or the older saved cart would win on the next load.
    const onHide = () => { if (document.visibilityState === 'hidden') flush(true); };
    window.addEventListener(CART_EVENT, onChange);
    window.addEventListener('pagehide', () => flush(true));
    document.addEventListener('visibilitychange', onHide);
    return () => { window.removeEventListener(CART_EVENT, onChange); document.removeEventListener('visibilitychange', onHide); flush(false); };
  }, []);

  return null;
}
