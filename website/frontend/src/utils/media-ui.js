import { x } from './experience.js';

export function initMediaUI() {
  const container = img => img.closest('.shop-card__media, .pp-stage, .pp-thumbs button, .exp-mini-card a, .consultation-avatar');
  const fail = img => {
    if (!(img instanceof HTMLImageElement)) return;
    const parent = container(img);
    if (!parent || parent.querySelector('.media-fallback')) return;
    parent.classList.add('media-failed');
    const label = document.createElement('span');
    label.className = 'media-fallback';
    label.textContent = parent.classList.contains('consultation-avatar') ? parent.dataset.initial || 'A' : x('mediaUnavailable');
    parent.append(label);
  };
  document.addEventListener('error', e => fail(e.target), true);
  document.addEventListener('load', e => {
    if (!(e.target instanceof HTMLImageElement)) return;
    const parent = container(e.target);
    parent?.classList.remove('media-failed');
    parent?.querySelector('.media-fallback')?.remove();
  }, true);
  document.querySelectorAll('img').forEach(img => { if (img.complete && !img.naturalWidth) fail(img); });
  window.addEventListener('astro:languagechange', () => document.querySelectorAll('.media-fallback').forEach(label => { if (!label.parentElement.classList.contains('consultation-avatar')) label.textContent = x('mediaUnavailable'); }));
}
