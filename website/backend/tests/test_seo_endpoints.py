"""robots.txt and sitemap.xml: crawlers find the sitemap, and private/token pages stay out."""
import pytest
from fastapi.testclient import TestClient

from packages.database.session import init_db
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c


def test_robots_points_to_the_sitemap_and_hides_private_pages(client):
    res = client.get("/robots.txt")
    assert res.status_code == 200 and res.headers["content-type"].startswith("text/plain")
    text = res.text
    assert "Sitemap: http://testserver/sitemap.xml" in text
    for private in ("/admin", "/dashboard", "/seller", "/my-account", "/rewards", "/gau-sewa/receipt/"):
        assert f"Disallow: {private}" in text, private
    assert "Allow: /" in text


def test_robots_uses_site_url_when_configured(client, monkeypatch):
    monkeypatch.setenv("SITE_URL", "https://astro.example/")
    assert "Sitemap: https://astro.example/sitemap.xml" in client.get("/robots.txt").text


def test_sitemap_lists_public_pages_but_no_receipts_or_private_routes(client):
    xml = client.get("/sitemap.xml").text
    for path in ("/gau-sewa", "/gifts", "/mandir-seva", "/astro-mall", "/astrologers"):
        assert f"{path}</loc>" in xml, path
    for private in ("/receipt", "/dashboard", "/admin", "/seller", "/rewards"):
        assert private not in xml, private
