import sys
import os
import json
sys.path.insert(0, os.getcwd())

from packages.database.session import SessionLocal
from website.backend.app.api import (
    bhakti, bhakti_content, bhakti_gita, bhakti_radio, 
    bhakti_temples, bhakti_vedanta, bhakti_guide, bhakti_calendar
)

db = SessionLocal()
results = []

def run_test(name, fn, check_fn):
    try:
        data = fn()
        ok = check_fn(data)
        results.append({
            "name": name,
            "ok": ok is True,
            "detail": "" if ok is True else str(ok),
            "summary": f"List ({len(data)} items)" if isinstance(data, list) else f"Dict ({len(data)} keys)" if isinstance(data, dict) else str(data)[:60]
        })
    except Exception as e:
        results.append({
            "name": name,
            "ok": False,
            "detail": f"Exception: {e}",
            "summary": "Error"
        })

print("=== TESTING BHAKTI ROUTER FUNCTIONS DIRECTLY ===\n", flush=True)

# 1. Deities
run_test(
    "Deities List (8 Deities)",
    lambda: bhakti.list_deities(db=db),
    lambda d: len(d) == 8 and 'slug' in d[0] and 'name_en' in d[0] and 'name_hi' in d[0]
)

# 2. Mantras (Naam Jaap)
run_test(
    "Mantras List (9 Mantras)",
    lambda: bhakti.list_mantras(db=db, user=None),
    lambda d: len(d) >= 9 and 'text_hi' in d[0] and 'slug' in d[0]
)

# 3. Aarti & Chalisa (Content)
run_test(
    "Aartis & Chalisas List",
    lambda: bhakti_content.list_content(kind=None, deity=None, q=None, page=1, page_size=24, db=db),
    lambda d: 'items' in d and len(d['items']) > 0 and 'slug' in d['items'][0]
)
run_test(
    "Aarti Detail (hanuman-chalisa)",
    lambda: bhakti_content.get_content(slug='hanuman-chalisa', db=db, user=None),
    lambda d: 'body_hi' in d and len(d['body_hi']) > 50
)

# 4. Bhagavad Gita
run_test(
    "Gita Chapters List (18 Chapters)",
    lambda: bhakti_gita.chapters(db=db, user=None),
    lambda d: len(d) == 18 and d[0]['number'] == 1 and d[17]['number'] == 18
)
run_test(
    "Gita Chapter 1 Detail with Verses",
    lambda: bhakti_gita.chapter(number=1, db=db, user=None),
    lambda d: 'verses' in d and len(d['verses']) > 0 and 'text_sa' in d['verses'][0]
)
run_test(
    "Gita Daily Verse",
    lambda: bhakti_gita.daily(db=db),
    lambda d: 'verse' in d and d['verse'] is not None and 'text_sa' in d['verse']
)
run_test(
    "Gita Search ('कर्म')",
    lambda: bhakti_gita.search(q='कर्म', db=db),
    lambda d: isinstance(d, list) and len(d) > 0
)

# 5. Temples (Mandir Darshan)
run_test(
    "Bhakti Temples Directory (12 Temples)",
    lambda: bhakti_temples.list_temples(state=None, q=None, db=db),
    lambda d: len(d) >= 10 and 'city' in d[0] and 'slug' in d[0]
)
run_test(
    "Bhakti Temples States List",
    lambda: bhakti_temples.states(db=db),
    lambda d: len(d) > 0
)
run_test(
    "Temple Detail (kashi-vishwanath)",
    lambda: bhakti_temples.get_temple(slug='kashi-vishwanath', db=db),
    lambda d: 'summary' in d and 'deity' in d and len(d['summary']) > 20
)

# 6. Puja Vidhi
run_test(
    "Puja Vidhi List (6 Guides)",
    lambda: bhakti_calendar.list_pujas(db=db),
    lambda d: len(d) >= 6 and 'title_en' in d[0] and 'slug' in d[0]
)
run_test(
    "Puja Detail (daily-home-puja)",
    lambda: bhakti_calendar.get_puja(slug='daily-home-puja', db=db),
    lambda d: 'samagri' in d and 'steps' in d and len(d['steps']) > 0
)

# 7. Calendar Locations & Upcoming Festivals
run_test(
    "Calendar Locations (9 Cities)",
    lambda: bhakti_calendar.locations(),
    lambda d: len(d) >= 9
)
run_test(
    "Upcoming Festivals (30 days)",
    lambda: bhakti_calendar.upcoming(days=30, location=None, lat=None, lon=None, tz=None, db=db),
    lambda d: 'items' in d and isinstance(d['items'], list)
)
run_test(
    "Monthly Calendar (2026-11)",
    lambda: bhakti_calendar.month(year=2026, month=11, location=None, lat=None, lon=None, tz=None, db=db),
    lambda d: 'days' in d and len(d['days']) == 30
)
run_test(
    "Yearly Festivals (2026)",
    lambda: bhakti_calendar.festivals(year=2026, location=None, lat=None, lon=None, tz=None, db=db),
    lambda d: 'festivals' in d and len(d['festivals']) > 0
)

# 8. Vedanta & Shankaracharya
run_test(
    "Four Amnaya Peethas",
    lambda: bhakti_vedanta.peethas(),
    lambda d: 'peethas' in d and len(d['peethas']) == 4
)
run_test(
    "Vedanta Articles List",
    lambda: bhakti_vedanta.articles(section='vedanta', kind=None, db=db),
    lambda d: len(d) > 0 and 'slug' in d[0]
)
run_test(
    "Shankaracharya Articles List",
    lambda: bhakti_vedanta.articles(section='shankaracharya', kind=None, db=db),
    lambda d: len(d) > 0 and 'slug' in d[0]
)

# 9. Bhajan Radio
run_test(
    "Bhajan Radio Categories (9 Categories)",
    lambda: bhakti_radio.categories(),
    lambda d: len(d) == 9 and 'slug' in d[0]
)
run_test(
    "Bhajan Radio Tracks",
    lambda: bhakti_radio.tracks(category=None, q=None, page_size=100, db=db, user=None),
    lambda d: isinstance(d, list)
)

# 10. Bhakti Guide
run_test(
    "Bhakti Guide Status",
    lambda: bhakti_guide.status(db=db),
    lambda d: isinstance(d, dict)
)

db.close()

print("=== TEST RESULTS ===", flush=True)
pass_count = sum(1 for r in results if r['ok'])
fail_count = sum(1 for r in results if not r['ok'])

for r in results:
    mark = "PASS" if r['ok'] else "FAIL"
    print(f"[{mark}] {r['name']:<42} -> {r['summary']}")
    if not r['ok']:
        print(f"      --> Failure Detail: {r['detail']}")

print(f"\nTOTAL: {pass_count} PASSED, {fail_count} FAILED out of {len(results)} features tested.", flush=True)
