"""Unhashed frontend files must always be revalidated, otherwise browsers keep showing old code after an update.
Content-hashed Vite bundles under /static are the exception: they never change, so they are cached for a year."""
import pytest
from fastapi.testclient import TestClient

from packages.database.session import init_db
from website.backend.app.main import app, static_root


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c


@pytest.mark.parametrize("path", ["/", "/index.html", "/sw.js", "/manifest.webmanifest",
                                  "/legacy/i18n.js", "/gau-sewa", "/mandir-seva"])
def test_code_and_shell_are_revalidated_every_time(client, path):
    res = client.get(path)
    assert res.status_code == 200
    assert "no-cache" in res.headers.get("cache-control", ""), f"{path}: {res.headers.get('cache-control')}"


def test_hashed_bundles_are_cached_immutably(client):
    bundles = sorted((static_root / "static").glob("*.js")) if (static_root / "static").exists() else []
    if not bundles:
        pytest.skip("React site not built (run `npm run build:react`)")
    res = client.get(f"/static/{bundles[0].name}")
    assert res.status_code == 200
    assert "immutable" in res.headers.get("cache-control", "")


def test_conditional_request_still_returns_304(client):
    first = client.get("/legacy/i18n.js")
    etag = first.headers.get("etag")
    assert etag
    again = client.get("/legacy/i18n.js", headers={"If-None-Match": etag})
    assert again.status_code == 304  # revalidation is cheap: no re-download when nothing changed


def test_api_responses_are_not_given_static_cache_rules(client):
    assert "no-cache" not in client.get("/api/v1/gau-sewa/config").headers.get("cache-control", "")
