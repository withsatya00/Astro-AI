"""Frontend code must always be revalidated, otherwise browsers keep showing old CSS/JS after an update."""
import pytest
from fastapi.testclient import TestClient

from packages.database.session import init_db
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c


@pytest.mark.parametrize("path", ["/", "/index.html", "/sw.js", "/js/app.js", "/css/styles.css",
                                  "/src/styles/brand-polish.css", "/src/pages/TemplePage/TemplePage.js", "/gau-sewa", "/mandir-seva"])
def test_code_and_shell_are_revalidated_every_time(client, path):
    res = client.get(path)
    assert res.status_code == 200
    assert "no-cache" in res.headers.get("cache-control", ""), f"{path}: {res.headers.get('cache-control')}"


def test_conditional_request_still_returns_304(client):
    first = client.get("/src/styles/brand-polish.css")
    etag = first.headers.get("etag")
    assert etag
    again = client.get("/src/styles/brand-polish.css", headers={"If-None-Match": etag})
    assert again.status_code == 304  # revalidation is cheap: no re-download when nothing changed


def test_api_responses_are_not_given_static_cache_rules(client):
    assert "no-cache" not in client.get("/api/v1/gau-sewa/config").headers.get("cache-control", "")
