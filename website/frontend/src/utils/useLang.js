import { useEffect, useState } from 'react';

const read = () => {
  try { return localStorage.getItem('astro_preferred_lang') === 'hi' ? 'hi' : 'en'; } catch (e) { return 'en'; }
};

export const currentLang = read;

// The page language ('en' | 'hi'), kept in step with the language picker.
export default function useLang() {
  const [lang, setLang] = useState(read);
  useEffect(() => {
    const on = (e) => setLang(e.detail && e.detail.language === 'hi' ? 'hi' : 'en');
    window.addEventListener('astro:languagechange', on);
    return () => window.removeEventListener('astro:languagechange', on);
  }, []);
  return lang;
}
