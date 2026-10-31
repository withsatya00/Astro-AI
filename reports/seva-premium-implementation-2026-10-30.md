# Seva premium refresh — implementation

Implemented locally on 30 October 2026. The consultation-only concept in `previews/premium-concept/index.html` is preserved; changes apply to the real website.

## Delivered

- Shared ivory, maroon and gold colours across the website styles, navigation, buttons, footer and PWA theme. Added a shared service style layer, readable serif headings and consistent cards/forms. Existing branding artwork is retained.
- Cream photographic service heroes, responsive listings, readable detail pages and coherent checkout/tracking styling.
- Separate bookable/closed Puja events and the upcoming calendar; visible bookings access, honest starting-price copy and consistent IST schedule/deadline formatting.
- Shareable confirmed-event routes, working breadcrumbs and Back/Forward/refresh. Detail pages use the document's scrolling and original footer. Package checkout remains a focused dialog. Fixed navigation leaving an order dialog over the listing.
- Consistent unknown-gotra guidance and preserved package/quantity selections. Added duplicate-submit protection and corrected the secondary package shortcut.
- Gau Seva partial updates failure/retry, explicit beneficiary selection, recipient-specific updates and a mobile form positioned before supporting content. No-recipient checkout remains blocked.
- Pending-payment manual refresh, last checked time, support access, clearly labelled HTML receipt download and native Print / Save as PDF.
- Corrected delivery/price fallback copy and navigation claims. Added bilingual UI strings, FAQ guidance and consistent offering icons (photos are supported when supplied).
- Optimized 21 oversized gallery images to meet the existing 250 KB image budget. Existing illustrative imagery remains labelled.
- Rebuilt website Tailwind CSS. Added a token-based post-build normalizer so existing arbitrary colour utilities preserve the new palette on future builds.

## Validation

Passed:

- `node scripts/test_seva_refresh.cjs`: isolated browser journeys for open/closed events, direct detail routes, refresh, Back/Forward, filters, package/quantity totals, unknown gotra, review, payment confirmation, booking history, tracking and refund; Gau Seva partial failure/retry, recipient payload, receipt refresh/print controls; Hindi/dark mode and overflow at 360, 390, 768, 1024 and 1440px.
- `node scripts/test_gau_sewa_layout.cjs`: English/Hindi at eight widths, unavailable checkout, validation, presets and exact custom amount.
- `node scripts/test_puja_suggestions.cjs`: optional steps, totals, skip behaviour, participant preservation and login gate.
- `node scripts/test_seva_galleries.cjs`: gallery interaction, keyboard control, credits and image files.
- `node scripts/test_frontend_regressions.cjs`: FAQ, full-site static translation and existing calling regressions.
- `node scripts/test_design_system.cjs`: token contracts, focus/reduced-motion rules and core contrast checks.
- `node scripts/test_brand_source.cjs` and `node scripts/test_perf_budget.cjs`.
- JavaScript syntax checks, website Tailwind build and `git diff --check`.

Browser payments/refunds use intercepted test fixtures: no real bookings, donations, charges or refunds were made. Live provider credentials and real temple operations still determine production availability.

Screenshots are in `scratch/seva-refresh/`, including Puja listing/detail, Chadhava listing/mobile detail, Gau Seva desktop/mobile, dark Hindi and receipt views.

### Banner reference update

Following the subsequent Astro Mall reference, all seven service mastheads now share a deep maroon background, white/gold serif headings, cream action buttons, rounded corners and a right-hand photographic blend. Applied to Mandir Seva, Puja, Chadhava, Gau Seva, Astro Mall, Astrologers and Calculators. Mobile uses a photo above the maroon content area with a matching fade. Existing actions and page-specific images are preserved. Seven-page desktop/mobile banner screenshots and computed colour/overflow checks passed, along with the existing Gau Seva layout suite.

## Preview

- http://localhost:3000/mandir-seva/puja
- http://localhost:3000/mandir-seva/chadhava
- http://localhost:3000/gau-sewa
