// PostCSS plugin: keeps arbitrary Tailwind colour classes (e.g. text-[#4a1b9a]) in sync with the brand theme.
// Older templates still use the previous purple/navy palette; this maps those colours to the tokens in
// tokens.css. Only rules that come from the listed source files change, so hand-written CSS is untouched.
const fs = require('node:fs');
const path = require('node:path');

const TOKENS_FILE = path.resolve(__dirname, '../website/frontend/src/styles/tokens.css');

function buildPalette() {
  const tokens = fs.readFileSync(TOKENS_FILE, 'utf8');
  const token = (name) => {
    const value = tokens.match(new RegExp(name + ':\\s*(#[0-9a-f]{6})', 'i'))?.[1];
    if (!value) throw new Error('Missing theme token ' + name);
    return value.slice(1).toLowerCase();
  };
  return {
    '4a1b9a': token('--brand-primary'),
    '3b1580': token('--brand-hover'),
    '1e0b44': token('--brand-deep'),
    '6b3fc4': token('--brand-highlight'),
    'f4eefb': token('--brand-soft'),
    '211d50': token('--text-primary'),
    '1e1b4b': token('--color-navy-deep'),
    'e3d8f3': 'edd9dc',
    '0d0b24': '2b1019',
    '2d1b41': '4b1727',
  };
}

function remap(value, palette) {
  return value
    .replace(/#([a-f0-9]{6})([a-f0-9]{2})?\b/gi, (whole, rgb, alpha) => {
      const mapped = palette[rgb.toLowerCase()];
      return mapped ? '#' + mapped + (alpha || '') : whole;
    })
    // Tailwind emits opacity-aware utility colours as space-separated RGB values.
    .replace(/rgb\(\s*(\d+)\s+(\d+)\s+(\d+)(?=[\s/)])/g, (whole, r, g, b) => {
      const key = [r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
      const mapped = palette[key];
      return mapped ? 'rgb(' + [0, 2, 4].map((at) => parseInt(mapped.slice(at, at + 2), 16)).join(' ') : whole;
    });
}

/** @param {{ files?: string[] }} options  basenames of the source files whose declarations are remapped */
module.exports = ({ files = ['tailwind-input.css', 'CalculatorsModal.css'] } = {}) => {
  const palette = buildPalette();
  return {
    postcssPlugin: 'brand-palette',
    OnceExit(root) {
      root.walkDecls((decl) => {
        const source = decl.source && decl.source.input && decl.source.input.file;
        if (source && files.includes(path.basename(source))) decl.value = remap(decl.value, palette);
      });
    },
  };
};
module.exports.postcss = true;
