import sys
import os
import json
sys.path.insert(0, os.getcwd())

from starlette.testclient import TestClient
from website.backend.app.main import app

client = TestClient(app)
results = []

def test_endpoint(name, url, expected_status=200, check_fn=None):
    try:
        r = client.get(url)
        status = r.status_code
        ok = (status == expected_status)
        detail = ""
        data = None
        try:
            data = r.json()
        except Exception:
            detail = f"Non-JSON response ({len(r.content)} bytes)"
            
        if ok and check_fn and data is not None:
            check_result = check_fn(data)
            if check_result is not True:
                ok = False
                detail = str(check_result)
        elif not ok:
            detail = f"Expected {expected_status}, got {status}: {r.text[:200]}"
            
        results.append({
            "name": name,
            "url": url,
            "status": status,
            "ok": ok,
            "detail": detail,
            "data_summary": f"Items: {len(data)}" if isinstance(data, list) else f"Keys: {list(data.keys())[:6]}" if isinstance(data, dict) else str(type(data))
        })
        return ok, data
    except Exception as e:
        results.append({
            "name": name,
            "url": url,
            "status": 500,
            "ok": False,
            "detail": str(e),
            "data_summary": "Exception"
        })
        return False, None

print("=== STARTING COMPREHENSIVE BHAKTI BACKEND TESTS ===\n")

# 1. Deities
test_endpoint(
    "Deities List (English)",
    "/api/v1/bhakti/deities?lang=en",
    check_fn=lambda d: len(d) > 0 and 'slug' in d[0] and 'name' in d[0]
)
test_endpoint(
    "Deities List (Hindi)",
    "/api/v1/bhakti/deities?lang=hi",
    check_fn=lambda d: len(d) > 0 and d[0].get('name') != ''
)

# 2. Mantras (for Naam Jaap)
test_endpoint(
    "Mantras List",
    "/api/v1/bhakti/mantras",
    check_fn=lambda d: len(d) > 0 and 'text_hi' in d[0]
)

# 3. Aarti & Chalisa Content
ok, aartis = test_endpoint(
    "Aartis & Chalisas List",
    "/api/v1/bhakti/content",
    check_fn=lambda d: len(d) > 0 and 'slug' in d[0] and 'title' in d[0]
)
if ok and aartis and len(aartis) > 0:
    first_slug = aartis[0]['slug']
    test_endpoint(
        f"Aarti Detail ({first_slug})",
        f"/api/v1/bhakti/content/{first_slug}?lang=hi",
        check_fn=lambda d: 'body' in d or 'body_hi' in d
    )

# 4. Bhagavad Gita
test_endpoint(
    "Gita Chapters List (18 Chapters)",
    "/api/v1/bhakti/gita/chapters?lang=en",
    check_fn=lambda d: len(d) == 18 and d[0]['number'] == 1
)
test_endpoint(
    "Gita Chapter 1 Detail with Verses",
    "/api/v1/bhakti/gita/chapters/1?lang=hi",
    check_fn=lambda d: 'verses' in d and len(d['verses']) > 0
)
test_endpoint(
    "Gita Daily Verse",
    "/api/v1/bhakti/gita/daily?lang=en",
    check_fn=lambda d: 'chapter' in d and 'verse' in d and 'text_sa' in d
)
test_endpoint(
    "Gita Search ('karma')",
    "/api/v1/bhakti/gita/search?q=karma",
    check_fn=lambda d: isinstance(d, list)
)

# 5. Temples (Mandir Darshan)
ok, temples = test_endpoint(
    "Bhakti Temples Directory",
    "/api/v1/bhakti/temples?lang=en",
    check_fn=lambda d: len(d) > 0 and 'name' in d[0] and 'city' in d[0]
)
test_endpoint(
    "Bhakti Temples States List",
    "/api/v1/bhakti/temples/states",
    check_fn=lambda d: len(d) > 0
)
if ok and temples and len(temples) > 0:
    t_slug = temples[0]['slug']
    test_endpoint(
        f"Temple Detail ({t_slug})",
        f"/api/v1/bhakti/temples/{t_slug}?lang=hi",
        check_fn=lambda d: 'history' in d or 'summary' in d or 'deity' in d
    )

# 6. Puja Vidhi
ok, pujas = test_endpoint(
    "Puja Vidhi List",
    "/api/v1/bhakti/puja?lang=en",
    check_fn=lambda d: len(d) > 0 and 'title' in d[0]
)
if ok and pujas and len(pujas) > 0:
    p_slug = pujas[0]['slug']
    test_endpoint(
        f"Puja Detail ({p_slug})",
        f"/api/v1/bhakti/puja/{p_slug}?lang=hi",
        check_fn=lambda d: 'samagri' in d and 'steps' in d
    )

# 7. Calendar & Festivals
test_endpoint(
    "Calendar Locations",
    "/api/v1/bhakti/calendar/locations",
    check_fn=lambda d: len(d) > 0
)
test_endpoint(
    "Upcoming Festivals (next 30 days)",
    "/api/v1/bhakti/calendar/upcoming?days=30",
    check_fn=lambda d: 'items' in d
)
test_endpoint(
    "Monthly Calendar (2026-11)",
    "/api/v1/bhakti/calendar/month?year=2026&month=11",
    check_fn=lambda d: 'days' in d and len(d['days']) == 30
)
test_endpoint(
    "Yearly Festivals (2026)",
    "/api/v1/bhakti/calendar/festivals?year=2026",
    check_fn=lambda d: 'festivals' in d and len(d['festivals']) > 0
)

# 8. Vedanta & Shankaracharya
test_endpoint(
    "Four Amnaya Peethas",
    "/api/v1/bhakti/vedanta/peethas",
    check_fn=lambda d: 'peethas' in d and len(d['peethas']) == 4
)
test_endpoint(
    "Vedanta Articles List",
    "/api/v1/bhakti/vedanta/articles?lang=en",
    check_fn=lambda d: len(d) > 0 and 'slug' in d[0]
)

# 9. Bhajan Radio
test_endpoint(
    "Bhajan Radio Categories",
    "/api/v1/bhakti/radio/categories",
    check_fn=lambda d: len(d) > 0 and 'slug' in d[0]
)
test_endpoint(
    "Bhajan Radio Tracks",
    "/api/v1/bhakti/radio/tracks",
    check_fn=lambda d: isinstance(d, list)
)

# 10. Bhakti Guide
test_endpoint(
    "Bhakti Guide Status",
    "/api/v1/bhakti/guide/status",
    check_fn=lambda d: 'sources' in d or 'count' in d or 'ready' in d or isinstance(d, dict)
)

print("\n=== TEST RESULTS SUMMARY ===")
pass_count = sum(1 for r in results if r['ok'])
fail_count = sum(1 for r in results if not r['ok'])

for r in results:
    mark = "PASS" if r['ok'] else "FAIL"
    print(f"[{mark}] {r['name']:<40} {r['url']:<45} {r['data_summary']}")
    if not r['ok']:
        print(f"      --> Reason: {r['detail']}")

print(f"\nTOTAL: {pass_count} PASSED, {fail_count} FAILED out of {len(results)} tests.")
