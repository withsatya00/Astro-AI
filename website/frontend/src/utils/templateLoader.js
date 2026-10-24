/**
 * Universal Component Template Loader
 * Asynchronously fetches and caches component HTML templates from the server.
 */

const templateCache = new Map();

/**
 * Loads an HTML template from a given URL path with caching.
 * @param {string} url - Absolute or relative URL to the component's .html file.
 * @returns {Promise<string>} - The raw HTML markup string.
 */
export async function loadTemplate(url) {
  if (templateCache.has(url)) {
    return templateCache.get(url);
  }

  try {
    const bustUrl = url.includes('?') ? `${url}&v=${Date.now()}` : `${url}?v=${Date.now()}`;
    const res = await fetch(bustUrl);
    if (!res.ok) {
      throw new Error(`[TemplateLoader] HTTP ${res.status} while fetching template: ${url}`);
    }
    const html = await res.text();
    templateCache.set(url, html);
    return html;
  } catch (err) {
    console.error(`[TemplateLoader] Error loading ${url}:`, err);
    throw err;
  }
}

/**
 * Parses an HTML string into a DOM element or DocumentFragment.
 * @param {string} html 
 * @returns {DocumentFragment}
 */
export function parseHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

export default { loadTemplate, parseHTML };
