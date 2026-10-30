# Brand rules

The palette lives in `website/frontend/src/styles/tokens.css` (`--brand-*`, `--bg-*`, `--text-*`). Components read tokens; they do not hard-code colours.

| Role | Token | Use |
| --- | --- | --- |
| Action | `--brand-primary` (`--brand-hover`, `--brand-deep`, `--brand-highlight`) | Every filled button, active tab and primary link. One family, no other fill colour for actions. |
| Highlight | `--color-gold-*` | Prices accents, underlines, badges, eyebrows. Never a heading colour. |
| Background | `--bg-page`, `--bg-card`, `--bg-muted` | Ivory page, white cards, one muted surface. At most four section surfaces per page. |
| Text | `--text-primary`, `--text-secondary`, `--text-muted` | All pass WCAG AA (4.5:1). |

Type floor: nothing smaller than 12px. Small text must keep 4.5:1 contrast in both light and dark themes.

Enforced by `npm run test:brand` (live pages, light and dark) and `npm run test:ds` (token contrast). `src/styles/brand-polish.css` is loaded last and holds the overrides that bring older components in line.
