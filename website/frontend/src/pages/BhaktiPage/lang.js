// Which language the visitor chose in the site-wide picker. Only English and Hindi have full Bhakti copy;
// any other choice falls back to English, the same way the home page does.
import { useEffect, useState } from 'react';

const read = () => {
  try { return localStorage.getItem('astro_preferred_lang') === 'hi' ? 'hi' : 'en'; } catch (e) { return 'en'; }
};

export function useLang() {
  const [lang, setLang] = useState(read);
  useEffect(() => {
    const on = (e) => setLang(e.detail && e.detail.language === 'hi' ? 'hi' : 'en');
    window.addEventListener('astro:languagechange', on);
    return () => window.removeEventListener('astro:languagechange', on);
  }, []);
  return lang;
}

// The text in the chosen language, falling back to the other one when it is missing.
export const pick = (lang, en, hi) => (lang === 'hi' ? (hi || en) : (en || hi));
// The language that is NOT chosen, for showing the second form of a bilingual name underneath.
export const other = (lang) => (lang === 'hi' ? 'en' : 'hi');
