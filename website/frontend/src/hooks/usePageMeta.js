import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO_DETAIL_PREFIXES, SEO_PAGES } from '../data/seoPages.js';

const isHindi = () => {
  try { return (window.I18n && window.I18n.currentLang) === 'hi' || localStorage.getItem('astro_preferred_lang') === 'hi'; } catch (e) { return false; }
};

function setMeta(selector, create, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(el.tagName === 'LINK' ? 'href' : 'content', value);
}

const metaByName = (name) => () => Object.assign(document.createElement('meta'), { name });
const metaByProperty = (property) => () => {
  const m = document.createElement('meta');
  m.setAttribute('property', property);
  return m;
};

function applyMeta({ title, description, noindex, path }) {
  document.title = title;
  if (description) {
    setMeta('meta[name="description"]', metaByName('description'), description);
    setMeta('meta[property="og:description"]', metaByProperty('og:description'), description);
  }
  setMeta('meta[property="og:title"]', metaByProperty('og:title'), title);
  setMeta('meta[name="robots"]', metaByName('robots'), noindex ? 'noindex, nofollow' : 'index, follow');
  setMeta('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), window.location.origin + path);
}

function setOrganizationJsonLd(enabled) {
  let el = document.getElementById('seo-jsonld');
  if (!enabled) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = Object.assign(document.createElement('script'), { type: 'application/ld+json', id: 'seo-jsonld' });
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Astro Jyotish',
    url: window.location.origin,
    logo: `${window.location.origin}/assets/brand/icon-512.png`,
  });
}

/** Keeps title, description, robots and canonical in sync with the current route. */
export function usePageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const key = pathname === '/home' ? '/' : pathname.replace(/\/+$/, '') || '/';
    const section = ['/calculators', '/bhakti'].find((prefix) => key.startsWith(`${prefix}/`));
    const page = SEO_PAGES[key] || (section ? SEO_PAGES[section] : null);
    const hi = isHindi();

    setOrganizationJsonLd(key === '/');
    if (page) {
      applyMeta({ title: hi ? page[1] : page[0], description: hi ? page[3] : page[2], noindex: !!page[4], path: key });
    } else if (!SEO_DETAIL_PREFIXES.test(key)) {
      applyMeta({ title: hi ? 'पृष्ठ नहीं मिला | Astro Jyotish' : 'Page not found | Astro Jyotish', noindex: true, path: key });
    }
  }, [pathname]);
}
