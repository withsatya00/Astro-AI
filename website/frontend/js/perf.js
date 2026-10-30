/* Image loading hygiene: below-the-fold images load lazily and decode off the main thread. The hero and navbar are left untouched. */
(function () {
  const SKIP = '#mount-hero, .site-navbar, .top-promo-bar';
  function tune(img) {
    if (img.closest(SKIP)) return;
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
  }
  function scan(root) { (root.querySelectorAll ? root.querySelectorAll('img') : []).forEach(tune); if (root.tagName === 'IMG') tune(root); }
  scan(document);
  new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && scan(n)))).observe(document.documentElement, { childList: true, subtree: true });
})();
