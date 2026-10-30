# Premium frontend experience

## Compact responsive refresh — 29 October 2026

- `src/styles/compact-premium.css` is the final presentation layer. Discovery uses three compact columns on laptops, two on tablets, and horizontal portrait/details/price-action rows on phones. Mobile secondary actions remain available from the astrologer profile. Mall/seva cards and dashboard panels have smaller spacing without shrinking primary tap targets below 40px.
- Directory recommendations use total consultation counts from the current API results. There is no invented weekly trending metric. The panel sits beside the desktop grid and becomes a scrollable strip on smaller screens; it is hidden when usable counts are absent.
- `/gau-sewa` has an ivory/saffron hero, an optimized 134KB illustrative WebP, three purpose cards, gaushala information, updates and a desktop side donation panel. On phones the donation panel follows purpose selection. Actual partner photos take precedence over the explicitly labelled illustration.
- When collection is unavailable, the donation form remains visible but its controls are disabled and its reason is displayed. The donation handler also checks availability. Existing server-side payment verification and donation records are unchanged.
- New Gau Sewa copy is maintained in `js/i18n.js`, not by manually editing the generated locale dictionary. Existing storefront dictionaries were synchronized using `node scripts/update_storefront_copy.cjs`.
- `node scripts/test_compact_premium.cjs` uses actual components/styles with controlled data and no account or payment mutations. It checks 360, 390, 768, 1024 and 1440px layouts, donation amount/purpose selection, disabled collection, Hindi, dark mode, and recommendation visibility. It requires the static frontend on port 3000 and installed Microsoft Edge. Screenshots are saved under `scratch/compact-premium/`.
- Existing `node scripts/test_frontend_regressions.cjs` passes: FAQ interactions, bilingual rendering of 33 templates, and consultation speech/microphone flows. The live directory was also checked with 37 cards and five recommendations, without browser runtime errors.

Release limits: this refresh does not configure live Razorpay credentials, beneficiary onboarding, email delivery, production error-monitoring services, scheduled backups or restore infrastructure. Backend payment tests were not rerun in this environment because available Python interpreters lack pytest. No production deployment or live payment was performed.

- `/dashboard` combines the signed-in account's wallet, orders, puja bookings, saved birth profiles, consultations, appointments and wishlist. Each source loads independently and failed sections have a retry action. Signing out clears account content.
- Mall and product pages offer comparison of up to three products. Comparison and the last twelve viewed product IDs are stored in this browser. Recently viewed history can be cleared; unavailable catalog items are omitted.
- Wishlist/cart continue using the existing account APIs. Their in-memory identity and pending writes now follow the active account, including direct account switches.
- Product galleries use the catalog's `image_url` and `extra_images`; they never fabricate additional photos. Gallery thumbnails, keyboard navigation, zoom, PIN estimates and product-specific returns remain available. Delivery dates are estimates, not courier commitments.
- Puja tracking follows actual booking status and video/prasad fields. Prasad dispatch appears only for prasad bookings and is complete only once a tracking reference exists. No future timestamps are invented.
- `src/styles/experience.css` supplies the shared surfaces and light/dark theme. New copy lives in `src/utils/experience.js` (English/Hindi). Run `node scripts/update_storefront_copy.cjs` after changing this copy to refresh the global dictionary.

Validation:

```powershell
node scripts/test_frontend_regressions.cjs
node scripts/test_storefront_browser.cjs
node scripts/test_premium_features.cjs
node scripts/test_account_layout.cjs
node scripts/test_frontend_audit.cjs
```

The browser scripts expect the static frontend on port 3100 and a **test database** backend on port 8012; they use installed Microsoft Edge headlessly. They register temporary test accounts and make simulated wallet/puja transactions. Screenshots are written under `scratch/`. The existing wallet remains in test mode.

The account-layout and final-audit scripts use frontend port 3000; the audit still targets the isolated backend on 8012. The final audit covers actual appointment creation/cancellation, recharge duplicate prevention, receipts, expired login, media failure/recovery and support links. Wallet and appointment forms now live in separate dialogs. Shared service details are rendered by `ServiceInfo.js`; the support dialogs describe current service behaviour rather than presenting invented legal or encryption guarantees.

## Daily brief, remedies, gifts, trust and install (phase 2)

- `GET /api/v1/experience/daily-brief` builds today's brief from the user's default birth chart and today's panchang: Chandra Bala, Tara Bala, running dasha, Sade Sati, a day score (traditional rules, shown as guidance) and lucky colour/number. Without a saved chart it shows the panchang and asks for birth details.
- Remedies tracker (`/experience/remedies`): daily / weekly / one-time remedies with check-in, undo, streaks, progress and suggestions from the Moon-sign lord. Completed consultations can import their summary remedies.
- Gift cards (`/experience/gifts`): bought from the wallet, redeemed once with `AJ-XXXX-XXXX-XXXX`. Festival packs (`/experience/festival-packs`) bundle catalog items with a seva link; their coupons (DIWALI15 etc.) are created at startup and can be edited by an admin. Pack dates are listed in `FESTIVAL_PACKS` in `experience.py` and must be updated each year.
- Membership: 10% off scheduled appointments, priority flag on bookings, one wallet bonus claim per calendar month. Constants live in `packages/core/pricing.py`.
- Referrals: stats and milestone bonuses (3 / 5 / 10 friends) at `/rewards/referrals`.
- Trust (`/astrologers/{slug}/trust`): computed from real consultations and reviews; repeat-client rate needs 20 clients and reply time 10 conversations, otherwise it is hidden.
- `POST /charts/milan/pdf` returns a branded Kundali Milan PDF; the Kundali report PDF has a banner, header/footer and personalised remedies. Built-in PDF fonts cannot draw Devanagari, so the PDFs keep the Latin text only.
- PWA: `sw.js` (network-first code, cached media, offline shell), install banner, update prompt and offline strip in `components/premium/PwaInstall.js`.
- New copy lives in `src/utils/premium-copy.js` (English/Hindi); styles in `src/styles/premium-features.css`.

## Astrologer profile (phase 3)

- `src/components/premium/ProfileView.js` renders the profile: hero banner with portrait ring and live status, stat strip (count-up), sticky section nav (About / Trust / Reviews / Book), trust-first layout, rating summary, sticky booking card, similar-astrologer carousel and a mobile booking bar (moved to `<body>` because the view has a transform). `App.populateProfileHtml` in `js/app.js` only supplies the data.
- Next free slots come from the five fixed appointment slots and `/wallet/bookings/busy`; tapping one opens the booking modal with date and time filled in.
- Premium members see their discounted 15-minute price; others see a pointer to Premium.
- Save astrologer: `GET/PUT/DELETE /api/v1/experience/favourites` (signed-in users only).
- `profile-premium.css` makes `#app-views-container` and `#site-layout-outlet` overflow-clip instead of hidden while the profile is open; `overflow: hidden` on those parents would otherwise disable `position: sticky`.

## Astrologer card, directory and profile packages (phase 4)

- `AstrologerCard.js` renders the `.ac2` card (styles in `AstrologerCardPremium.css`): portrait ring with status dot, verified tick, 2-decimal rating, AI / Human badge plus up to two data-driven badges (Top rated: rating >= 4.97 with 1000+ reviews; Most consulted: 60k+ consultations; Featured; New: under 5 reviews), specialty chips, status line, price and Chat / Call / voice buttons. The price is "Free" only when `price_per_minute` is 0.
- `Favourites.js` owns the heart on every card and, through a MutationObserver, calls `AstrologerCardComponent.enhance()` on every newly rendered card (hearts, and the next free slot on human cards).
- `DirectoryChips.js` adds the sticky quick-filter bar (All, Online now, Human experts, Free AI, Top rated, and six specialties) on top of `App.directoryFilter`.
- Profile: consultation packages (15 / 30 / 60 min priced from the astrologer's rate), a 7-day availability strip, and the astrologer's name, price and Chat button in the sticky nav after the hero scrolls away.
- `App.loadAstrologerDirectory` now sends `is_ai` (it used to send `type`, which the API ignores, so the Human / AI mode filter never worked).
