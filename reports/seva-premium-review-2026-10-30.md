# Chadhava, Puja and Gau Seva review

Reviewed: 30 October 2026. Scope: current frontend source, booking/receipt logic and the six supplied reference screenshots.

## Verification boundary

Browser inventory contained no available browsers; attempts to open the local site in the in-app browser and Edge returned “Browser is not available”. This is a source audit, not a completed live click-through. Desktop/mobile appearance, browser history, payment handoff and actual API responses still need live verification. No production files, bookings or payments were changed. The active `previews/premium-concept/index.html` is an isolated consultation concept, not the three actual service pages.

## Issues and fixes

| Priority | Area | Finding supported by source | Recommended fix |
|---|---|---|---|
| High | Trust / delivery | `MandirSevaPage.html` advertises “Prasad at home / Prasad delivered to your home”. `ChadhavaExperience.faq()` and the review step explicitly exclude prasad delivery. | Make delivery event-specific. Show “Included”, “Optional” or “Not included” consistently on landing, detail, package, review and receipt. |
| High | Booking access | `hub()` hides the entire `.ch-heading` when `fixedKind` is set. That header contains the “My bookings & videos” action. The home booking button is also inside a home-only section. | Keep a separate persistent bookings action on both service subpages and detail views. |
| High | Reliability | Gau Seva loads config, gaushalas and updates in one `Promise.all`; any rejection sets `loadFailed`, replacing the entire page with an error. | Treat config/recipient as essential; let updates fail independently with an inline retry. Preserve available content and form values. |
| Medium | Price accuracy | “From ₹5” and “Start from ₹5” are hardcoded in the Chadhava entry copy and item introduction. Actual event card minimum is calculated from offerings. | Calculate advertised minimum from available bookable offerings. If none are available, avoid an actionable starting-price claim. |
| Medium | Availability | The confirmed-events group is headed “BOOKING OPEN”, but `hub()` maps every event of the current kind; individual cards can render “Booking closed”. | Filter open events into that group or label the group “Scheduled events” and separate closed/full events. Verify with real API data. |
| Medium | Puja catalogue | Confirmed event cards and calendar observances have different participation states. Calendar items have no confirmed venue/package and lead to notification signup. | Give “Book now” and “Upcoming calendar” separate sections or explicit filters. Explain availability on each card before the click. |
| Medium | Gotra consistency | Calendar FAQ recommends Kashyap when unknown; the real form supports an explicit unknown-gotra option and review text says unknown is accepted. | Use one policy: “I don't know my gotra”; show what the temple team will do without requiring the devotee to invent a value. |
| Medium | Date consistency | Calendar code fixes dates to Asia/Kolkata; confirmed event `dt()` and card day/month use browser-local timezone. | Format temple schedule and deadlines in Asia/Kolkata and label IST consistently. |
| Medium | Gau Seva recipient | `primary()` chooses the first accepting gaushala, or the first gaushala. Multiple gaushalas may be displayed, but there is no donor selection control. | If there is one recipient, state it plainly. If donors can choose, add a recipient selector and keep the same recipient through order, verification and receipt. |
| Medium | Gau Seva mobile hierarchy | DOM order puts purpose, steps, gaushalas and updates in the main column before the donation aside. The mobile CSS collapses the grid; hero CTA jumps to the form. | Move the donation form immediately after purpose selection on mobile. Put supporting photos and updates afterward. Consider a bottom “Contribute ₹…” shortcut. |
| Medium | Pending receipt | Receipt polling stops after approximately one minute; a pending receipt has no dedicated “Check payment status” control. | Add a manual status refresh, last checked time and reference-based support link. Do not encourage a second payment while verification is pending. |
| Medium | Receipt artifact | Gau Seva receipt download saves an `.html` file. | Offer a printable receipt with clear beneficiary, reference and payment status; add PDF if a downloadable document is the intended experience. Label HTML honestly if retained. |
| Medium | Detail architecture | Calendar detail is a full-page modal, internally scrolls and clones the global footer. Its breadcrumb is plain text. Confirmed events use a separate modal flow. | Prefer a shared routed detail layout with real breadcrumb links, one footer and predictable Back behavior. Keep checkout as a focused sheet or page. |
| Medium | Theme consistency | Current service banner and Gau Seva styles contain purple/plum values. `premium-system.css` overrides section headings to sans-serif, while editorial CSS requests serif. Chadhava CSS is appended dynamically. | Define shared cream/maroon/gold tokens and deliberate typography roles; consolidate conflicting overrides and ensure lazy-loaded CSS respects tokens. |

## Premium direction from screenshots 5 and 6

Use screenshot 5 for section composition: maroon feature panels, cream inset cards, restrained gold controls and editorial headings. Use screenshot 6 for the overall colour balance, product photography and rounded cream campaign panel. Its large navigation and oversized offer headline need adapting to the service journey rather than copying literally.

Suggested starting tokens, to be checked for contrast in implementation:

- Canvas: warm ivory `#FFF9EF`; surface: `#FFFFFF`.
- Primary maroon: `#650F23`; hover: `#4E0B1B`.
- Gold accent: `#D5AA51`; pale border: `#E8D7BA`.
- Main text: `#34251F`; secondary text: `#71645C`.
- Use roughly 70% ivory/white, 20% maroon and 10% gold/detail accents. These are design targets, not measured reference colours.

Use a restrained serif for hero and major section headings, a clean sans-serif for body/UI, and a tested Devanagari face for Hindi. Body copy should generally be 16px with comfortable line height; avoid shrinking service information to fit crowded cards. Buttons/inputs should be at least 44–48px tall. Use a consistent 12–16px card radius and 20–28px hero radius, with thin borders and subtle shadows.

Use real temple, ritual, offering and gaushala photography wherever available. Clearly label illustrative images. Keep image crops and lighting consistent. Replace decorative emoji in primary UI with a small coherent icon family. Ornamental motifs should be subtle and confined to selected hero/feature sections.

## Proposed page sequences

### Chadhava

1. Breadcrumb, concise ivory hero, actual temple photography and clear starting price.
2. Temple/deity/location filters and bookable events.
3. Detail: image gallery, temple, date/deadline in IST, video delivery estimate and offering selector.
4. Offering rows with photo, short explanation, price and quantity control; persistent total on mobile.
5. Name/gotra/family details, then review with itemised price, delivery and cancellation terms.
6. Confirmation with reference, payment status, service timeline and bookings/video access.
7. Supporting temple information, process, FAQs and footer.

### Puja

1. Concise hero followed by clearly separated bookable pujas and future observances.
2. Consistent cards showing temple, date, package starting price and one primary action.
3. Detail hero: gallery left, key facts and package CTA right on desktop; stacked on mobile.
4. About, temple, benefits expressed as traditional beliefs, process and package comparison.
5. Packages show participants, inclusions, optional extras, prasad availability and total price.
6. Name/gotra, review, payment and confirmation use the same shared booking flow.
7. Authentic reviews only when available, FAQs and support.

### Gau Seva

1. Authentic gaushala photo, short purpose statement and contribution CTA.
2. Purpose selection: fodder, care and general support.
3. Donation form with presets/custom amount and clearly identified beneficiary; desktop side panel, earlier in mobile flow.
4. How funds are used, gaushala details and dated updates.
5. Receipt information, FAQs and support.
6. Server-verified success/pending/failed state with clear next action and downloadable receipt.

Only attach quantities such as “₹501 feeds X cows” when the recipient has supplied a defensible cost basis. Empty updates should not look like a broken content feed.

## Implementation order

1. Correct delivery claims, booking access, advertised minimum and availability labels.
2. Improve Gau Seva partial failures, recipient clarity and pending-payment recovery.
3. Establish shared tokens, typography, navigation, buttons, cards and form styles across all pages.
4. Refine listings and details, then checkout, tracking and receipts in the same visual system.
5. Verify desktop and mobile, English/Hindi, direct URLs and Back/Forward; complete payment tests in an isolated test environment.

## Live checks still required

Entry navigation; every filter and clear/reset; offering steppers and totals; package selection; required/invalid input; unknown gotra; Back preserving values; login return path; payment cancellation/failure/pending/success; duplicate-submit prevention; bookings and video access; FAQs; receipt download; footer links; keyboard focus/Escape; language switch; narrow-screen overflow and bottom action overlap.
