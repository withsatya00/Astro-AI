# Advanced Astro Workspace

Open **Dashboard → Advanced tools** after signing in. Existing birth-chart creation supplies the profiles; all new chart tools require a profile owned by the signed-in account.

## Features

1. **Timeline:** select a date or mahadasha to update the transit chart and natal-house table. Mahadasha and antardasha dates use a 365.25-day year; the first birth balance is clipped from the full period rather than divided incorrectly. Transits are sampled at local noon. Western profiles have transit exploration without Vedic dashas.
2. **AI memory:** explicitly save and enable up to 2,000 characters per profile. Review the latest consultation summary as a draft before saving; importing a draft does not enable it. Enabled notes are passed to the AI consultation streaming prompt as untrusted background information. They are never inferred or collected automatically. Disable or delete them in the same panel. Demo synthesis does not use live-model prompt memory.
3. **Family vault:** label saved profiles by relationship, create another chart through the existing birth form, and choose a profile for subsequent consultations. Existing profile APIs handle primary-profile selection and deletion.
4. **Reading evidence:** inspect calculated planetary placements, engine, ayanamsa and traditional interpretations. Streaming consultation answers have an expandable source panel that shows retrieved excerpts or explicitly reports their absence. Retrieved excerpts are evidence of the source used, not an independent guarantee of its accuracy.
5. **Muhurat finder:** shortlist up to 31 days for business, marriage, housewarming or vehicle events. Applies existing event rules, Bhadra/tithi exclusions and natal Tara Bala where available, with reasons for accepted/excluded days. Uses the existing Panchang's approximate timing model; this is a preliminary daily shortlist, not a minute-accurate electional calculation. Rahu Kaal is displayed for avoidance, not subtracted from an allegedly precise interval.
6. **Birth-time explorer:** compare five samples over ±15, ±30 or ±60 minutes, including date rollover, ascendant and planetary/house/navamsha changes. It is a sensitivity exploration, not automatic birth-time rectification.
7. **Voice:** preserves existing STT/TTS, microphone fallback, barge-in, captions and reconnect logic. Adds a running accessible transcript, local text download and an explicit interrupt-and-speak control. Microphone, network and actual audio hardware must be checked on the target device.
8. **Reminders:** future one-off/repeating reminders, IANA timezone, quiet hours, daily cap, enable/disable and deletion. The website worker checks every minute. In-app notifications are durable; optional browser push uses generic text so private reminder titles do not appear on the lock screen. Quiet hours and caps defer delivery. Occasion reminders retain their existing six-hour schedule.
9. **Astrologer workbench:** assigned staff can inspect consultation chart/messages and save their own private notes, chart annotations and follow-up drafts. These drafts are not automatically published or sent to clients. Admins can access consultations, but private drafts remain scoped to their author.
10. **AI quality:** admin-only dashboard of the latest 500 completed AI consultation streaming turns, response/first-token latency, citation counts, chart grounding, heuristic review flags and per-session reported-request cost. Flags are review suggestions, not factual verdicts. Birth-intake-only turns may have no verified grounding; non-streaming, refused and interrupted turns are not included.

## Setup

Tables `advanced_records`, `advanced_reminders` and `ai_quality_events` are created additively by the existing `init_db()` at startup. Existing tables/data are preserved. Both website and AI gateways expose `/api/v1/advanced`; the minute reminder worker runs in the website service, so keep that service running for scheduled delivery. Serverless installations need an external scheduled worker invoking `packages.core.advanced.send_due` with a database session.

Install the updated requirements, including `pywebpush` and `tzdata`. Browser push additionally requires HTTPS (localhost is supported), user notification permission and these environment settings:

```dotenv
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:your-admin@example.com
AI_MODEL_PRICING_JSON={}
AI_PRICING_CURRENCY=USD
```

Generate your own VAPID pair with a standard Web Push key generator. Keep the private key on the server. The public key is sent to the browser. Push endpoints are restricted to supported browser push-service domains. Expired subscriptions are removed; push delivery is best effort and does not replace the durable in-app notification. Use a single scheduled worker if strict per-user rate limits across replicas are required.

For each model to price, add an entry to `AI_MODEL_PRICING_JSON` with `input_per_million` and `output_per_million` using your applicable rates. Unconfigured/unreported costs remain unavailable. Reported costs cover the winning/successful request's reported input/output tokens only, and exclude discarded hedges, previous attempts and any extra provider billing categories. They are not billing reconciliation totals. Demo turns are zero-cost.

Assign a real staff account (role `astrologer`) to an astrologer profile as an admin:

```text
PUT    /api/v1/advanced/staff/{user_id}/{astrologer_id}
DELETE /api/v1/advanced/staff/{user_id}/{astrologer_id}
```

Admins can also assign or revoke staff access through the workbench form. Staff cannot grant themselves access. Client accounts cannot access staff notes or quality metrics. For an external reminder scheduler, run `python scripts/run_due_reminders.py` every minute.

## Validation

```powershell
$env:DEBUG='false'
python -m pytest website/backend/tests/test_advanced_workspace.py ai/backend/tests/test_chat_birth_intake.py ai/backend/tests/test_selected_language.py ai/backend/tests/test_consultation_context_regressions.py -q
```

Browser workflow check (use an isolated development database; it creates test users/charts):

```powershell
$env:ADVANCED_TEST_URL='http://127.0.0.1:8015'
node scripts/test_advanced_workspace.cjs
```

The browser test uses installed Microsoft Edge through Playwright and covers real API workflows plus 375/768/1440px overflow checks. Screenshots are written to `scratch/advanced-workspace`.
