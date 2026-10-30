# Mandir Sewa: event-based chadhava

The public Mandir Sewa experience now uses dated chadhava events rather than opening an undated single-offering wallet form. Existing temple pages, legacy bookings, packages and their API records are preserved. New purchase entry points route to event selection; recurring packages and unconfirmed “today” purchase suggestions are no longer advertised in the new flow.

## Puja and single-item chadhava

Events have a `kind`: **chadhava** or **puja**. The same engine (capacity holds, payment, refunds, staff fulfilment, video) serves both.

- **Chadhava items.** Every temple has a catalogue of single items (flowers ₹5, matchbox ₹5, diya, tulsi, bhog thali ...) seeded from `website/backend/app/temple_items.py`. Items are matched to the deity (Ayodhya leads with diya, tulsi dal, pitambar; Kashi with bilva, Gangajal, milk; Shani with mustard oil and til). The first four are flagged *Most offered* and listed first. A chadhava event automatically sells the temple's whole item catalogue, 0-99 of each, plus any special sevas listed on the event. Seeding only adds missing rows, so prices an admin has changed are kept.
- **Puja.** A puja event sells one package (individual, couple, family of 4, family of 6; `category = puja_tier`, `max_members`) plus optional chadhava add-ons. The booking form asks for each extra devotee's name and gotra (limited to the package size) and stores them in `family_members`, one per line. Event pages show benefits, a booking countdown and how many bookings have joined.
- Items and puja packages cannot be bought through the old undated `/mandir/chadawa/book` endpoint.
- Admin: **Create a chadhava event** now has an *Event type* switch and benefit lines; tick the puja packages for a puja.

Demo events for local testing (refuses `APP_ENV=production`; use a scratch database to keep your data untouched):

```powershell
$env:DATABASE_URL='sqlite:///scratch/demo.db'
python scripts/seed_mandir_events.py
```

## Customer flow

1. Browse published upcoming events or select a temple to see its events.
2. Review temple, event description, scheduled date, booking deadline, collective/individual participation and video delivery estimate.
3. Select offerings and quantities. Prices come from the active temple catalogue, in integer paise. No prasad delivery is included in this event checkout.
4. Enter devotee name, phone, gotra and optional family/sankalp. Unknown gotra is available only when the event's temple team has explicitly enabled it; no gotra is silently invented.
5. Review items, total and cancellation terms. Pay from a funded account wallet or through Razorpay UPI/card/netbanking when configured.
6. Open **My chadhava & videos** to follow payment and service status separately, download a payment receipt, request eligible cancellation or watch the private published video. **Previous seva bookings** retains access to older bookings.

```text
Payment: PENDING → PAID → REFUND_PENDING → REFUNDED
                  ↘ expired reservations cannot silently create a paid booking

Seva: CONFIRMED → SCHEDULED → PERFORMED → VIDEO_AVAILABLE → COMPLETED
       ↘ CANCELLED

Late captured payment after a released/expired reservation: PAYMENT_REVIEW
```

An expired checkout can still receive a late provider capture. That payment is recorded for support/refund review; it does not overbook an event or falsely confirm a seva.

## Admin and temple-team setup

Open **Admin → Chadhava Events & Temple Team → Open Chadhava Operations**. The same dashboard is available from Mandir Sewa to admins and explicitly assigned temple staff.

Create an event with:

- An active temple and one or more of its active offerings.
- Event title/description, with optional Hindi text.
- Future seva time, booking deadline, cancellation deadline, capacity in **bookings** and video delivery estimate.
- Collective or individual participation.
- Whether the temple accepts unknown gotra.
- Confirmation that the temple team has actually agreed to perform this event and supply video evidence.
- Publication status. Unconfirmed partnerships cannot be published. No live events or partnerships are fabricated or automatically seeded.

Dates entered in the admin form use the operator's local timezone and are sent/stored with timezone information. Existing event times and policies become part of each order's immutable checkout snapshot. Publication can be closed/reopened before the deadline; existing orders retain their booked terms. To change event timing or price policy, arrange affected bookings with customers and create an appropriate new event rather than silently rewriting paid orders.

Assign an existing staff account's user ID to a temple. This grants only that temple's chadhava operations, not general admin permissions. Staff see paid orders for their assigned temples, can filter/export a selected event's devotee/offerings list, and must advance fulfilment in order. A future event cannot be marked performed. Staff access can be revoked from the dashboard.

After a seva is performed, upload its MP4/WebM/MOV evidence (50 MB maximum) on the **correct order**, then publish `VIDEO_AVAILABLE`. Complete the order after evidence delivery. Collective events can share a ceremony, but video evidence is explicitly attached to each participant's order; the system does not generate or claim a personalized ceremony automatically.

## Payments and refunds

The existing Razorpay credentials are reused:

```dotenv
APP_ENV=production
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Configure a Razorpay webhook at:

```text
https://YOUR_HOST/api/v1/mandir/chadhava/webhook
```

Subscribe to payment capture/failure, order paid and refund events. Verify on the Razorpay test environment before accepting real payments. Callback verification checks both the signature and the provider's captured payment record: order ID, amount and INR currency must match. Signed webhooks provide recovery when a browser closes before the checkout callback. Browser reports alone never mark an order paid.

Wallet checkout debits the existing wallet ledger atomically. In production, the existing wallet recharge service disables free development credits. Chadhava checkout itself does not mint credits or simulate successful payment.

Checkout keys are unique per account; retries cannot double-charge or create another booking. A reused key with different details is rejected. The reviewed total must match the server total before payment. Capacity reservations are conditional database updates; unpaid holds expire after 15 minutes or the event deadline. The existing minute worker releases holds, and booking/list requests also sweep expired holds. Up to five unpaid holds per account are permitted.

Customers can self-cancel an unscheduled booking before its snapshot cancellation deadline. Wallet refunds go back to the wallet once. Online refunds are requested against the original captured payment and remain `REFUND_PENDING` until the provider confirms the full refund. A network timeout never causes a blind second refund request. Admins can reconcile pending refunds or cancel/refund an unperformed missed seva. Post-performance disputes require manual review; partial refunds are not implemented in this flow.

If a refund request times out with uncertain outcome, the dashboard reconciliation checks the provider's payment status. If it remains unrefunded, review the payment in Razorpay and resolve it there; subsequent signed refund webhooks reconcile the application. Do not issue duplicate manual refunds.

## Storage and compatibility

`init_db()` creates `chadhava_events`, `chadhava_orders` and `temple_staff_assignments` additively. No legacy bookings or catalogue rows are deleted. A verified new order creates a linked legacy `ChadawaBooking` so existing account counts, certificates and fulfilment history continue to work. Legacy status/cancellation endpoints cannot bypass the new order's policy.

Video files are stored under `storage/private/chadhava/<order-id>/`, outside public uploads and Git. The video endpoint authenticates the booking owner or assigned staff/admin; owners cannot view unpublished evidence. The browser fetches authenticated video bytes and uses a temporary blob URL. Keep this directory on persistent storage with backups. Ephemeral/serverless deployments require persistent private storage and an external scheduled worker; do not treat local ephemeral files as durable evidence.

The existing account export includes chadhava orders; account closure anonymizes the order's devotee/contact snapshot and removes staff access. Financial amounts and booking references are retained as part of the existing transaction-record policy.

## Validation and isolated preview

```powershell
$env:DEBUG='false'
python -m pytest website/backend/tests/test_chadhava_events.py website/backend/tests/test_mandir_and_marketplace.py website/backend/tests/test_premium_experience.py -q
```

Browser preview (always creates a separate database under `scratch/`; no changes to normal application data):

```powershell
python scripts/preview_chadhava.py
# In another terminal:
node scripts/test_chadhava_flow.cjs
```

The test uses Playwright with installed Microsoft Edge. It covers 375/768/1440px layouts, multi-offering review, unknown-gotra consent, wallet checkout, staff assignment/scheduling, rejection of premature performance, cancellation and refund. Backend tests additionally cover payment signatures/capture matching, webhook deduplication, concurrent capacity/checkout races, late payment review, refund ambiguity, sequential fulfilment and private video access. Live provider charges and physical temple fulfilment are not exercised by these tests.
