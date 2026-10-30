// Banner titles read as two tones: the first half white, the second half gold (same as "Vedic Astro Mall").
// Titles that already carry an <em> are left alone; the rest are split by words, and re-split after a language change.
(function () {
  var busy = false;
  function split(h1) {
    if (h1.querySelector('em') || h1.children.length || h1.childNodes.length !== 1) return;
    var words = h1.textContent.trim().split(/\s+/);
    if (words.length < 2) return;
    var cut = Math.floor(words.length / 2);
    var em = document.createElement('em');
    em.textContent = words.slice(cut).join(' ');
    h1.textContent = words.slice(0, cut).join(' ') + ' ';
    h1.appendChild(em);
  }
  function run() {
    if (busy) return;
    busy = true;
    document.querySelectorAll('.service-banner h1').forEach(split);
    busy = false;
  }
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  run();
})();
