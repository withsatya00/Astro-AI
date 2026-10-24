"""
Tests for PDF report generation and download endpoint.
"""
from fastapi.testclient import TestClient
from website.backend.app.main import app

client = TestClient(app)

def test_report_generation_and_download():
    # 1. Create a chart
    chart_payload = {
        "name": "Report Test Person",
        "date_of_birth": "1988-12-05",
        "time_of_birth": "09:15:00",
        "is_time_approximate": False,
        "latitude": 19.0760,
        "longitude": 72.8777,
        "timezone_offset": 5.5,
        "city": "Mumbai",
        "country": "India",
        "system": "Vedic",
        "ayanamsa": "Lahiri"
    }
    chart_resp = client.post("/api/v1/charts/calculate", json=chart_payload)
    assert chart_resp.status_code == 200
    chart_id = chart_resp.json()["id"]

    # 2. Generate report
    report_payload = {
        "chart_id": chart_id,
        "report_type": "comprehensive_kundali",
        "language": "en"
    }
    rep_resp = client.post("/api/v1/reports/generate", json=report_payload)
    assert rep_resp.status_code == 200
    report_data = rep_resp.json()
    assert report_data["status"] == "COMPLETED"
    report_id = report_data["id"]

    # 3. Download report PDF
    dl_resp = client.get(f"/api/v1/reports/{report_id}/download")
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/pdf"
    assert len(dl_resp.content) > 1000 # Valid non-empty PDF binary
    assert dl_resp.content.startswith(b"%PDF")
