"""CSV product import: honest defaults, strict validation, dry run by default, and nothing applied when any row is wrong."""
import uuid
from pathlib import Path

import pytest
from PIL import Image

from packages.database.models import MarketplaceProduct
from packages.database.session import SessionLocal, init_db
from website.backend.app import product_import
from website.backend.app.product_import import import_products, parse_csv

HEADER = "title,category,price,original_price,stock,description,material,origin,image,extra_images,seller_name,energized_details,return_days\n"


@pytest.fixture(autouse=True)
def _db_and_upload_dir(tmp_path, monkeypatch):
    init_db()
    monkeypatch.setattr(product_import, "UPLOAD_DIR", tmp_path / "uploads")  # never write into the real uploads folder
    yield


def _name():
    return f"Import Test {uuid.uuid4().hex[:8]}"


def _photo(folder: Path, name="p.jpg", size=(400, 400)):
    folder.mkdir(exist_ok=True)
    Image.new("RGB", size, (200, 120, 40)).save(folder / name)
    return name


def _rows(*lines):
    return parse_csv(HEADER + "\n".join(lines) + "\n")


def _find(title):
    with SessionLocal() as db:
        return db.query(MarketplaceProduct).filter(MarketplaceProduct.title == title).first()


def test_dry_run_writes_nothing(tmp_path):
    t = _name()
    with SessionLocal() as db:
        rep = import_products(db, _rows(f'"{t}",mala,299,,10,"A sacred tulsi mala for daily japa.",,,,,,,'), apply=False)
    assert rep["created"][0]["title"] == t and rep["applied"] is False
    assert _find(t) is None


def test_apply_uses_honest_defaults(tmp_path):
    t = _name()
    folder = tmp_path / "photos"
    photo = _photo(folder)
    with SessionLocal() as db:
        rep = import_products(db, _rows(f'"{t}",mala,"₹1,299",,,"A sacred tulsi mala for daily japa.",,,{photo},,,,'), folder, apply=True)
    assert rep["applied"] is True and not rep["errors"]
    p = _find(t)
    assert p.price == 1299 and p.original_price == 1299          # no invented discount
    assert p.has_lab_certificate is False and p.certificate_url is None
    assert p.is_energized is False and not p.energized_details  # not advertised as energized unless stated
    assert p.rating == 0 and p.review_count == 0                  # no invented reviews
    assert p.listing_status == "APPROVED" and p.is_active is True and p.seller_name == "Astro Jyotish"
    assert p.image_url.startswith("/uploads/products/") and (tmp_path / "uploads" / Path(p.image_url).name).is_file()
    assert p.return_days == 7


def test_energized_note_and_gemstone_return_window(tmp_path):
    t = _name()
    with SessionLocal() as db:
        import_products(db, _rows(f'"{t}",gemstone,4500,5000,3,"Natural emerald, certificate on request.",Emerald,Zambia,,,Gem House,"Energized with 108 Budh mantras",'), apply=True)
    p = _find(t)
    assert p.is_energized is True and p.energized_details == "Energized with 108 Budh mantras"
    assert p.return_days == 2 and p.seller_name == "Gem House" and p.original_price == 5000
    assert p.image_url == "/assets/img/products/rudraksha-5.jpg"  # the shared placeholder when no photo is supplied


def test_category_alias_and_blank_stock(tmp_path):
    t = _name()
    with SessionLocal() as db:
        import_products(db, _rows(f'"{t}",puja_essentials,150,,,"Dhoop and camphor set for daily puja.",,,,,,,'), apply=True)
    p = _find(t)
    assert p.category == "samagri" and p.stock == 10


@pytest.mark.parametrize("line, problem", [
    ('"",mala,299,,10,"A sacred tulsi mala for daily japa.",,,,,,,', "'title' is required"),
    ('"Some Item",toys,299,,10,"A sacred tulsi mala for daily japa.",,,,,,,', "category"),
    ('"Some Item",mala,abc,,10,"A sacred tulsi mala for daily japa.",,,,,,,', "numbers"),
    ('"Some Item",mala,0,,10,"A sacred tulsi mala for daily japa.",,,,,,,', "more than 0"),
    ('"Some Item",mala,500,400,10,"A sacred tulsi mala for daily japa.",,,,,,,', "lower than price"),
    ('"Some Item",mala,500,,-3,"A sacred tulsi mala for daily japa.",,,,,,,', "stock"),
    ('"Some Item",mala,500,,10,"short",,,,,,,', "description"),
    ('"Some Item",mala,500,,10,"A sacred tulsi mala for daily japa.",,,https://example.com/x.jpg,,,,', "external link"),
    ('"Some Item",mala,500,,10,"A sacred tulsi mala for daily japa.",,,missing.jpg,,,,', "needs --images-dir"),
])
def test_invalid_rows_are_reported(line, problem):
    with SessionLocal() as db:
        rep = import_products(db, _rows(line), apply=True)
    assert rep["errors"] and any(problem in p for p in rep["errors"][0]["problems"]), rep["errors"]
    assert rep["applied"] is False


def test_photo_checks(tmp_path):
    folder = tmp_path / "photos"
    small = _photo(folder, "small.jpg", (100, 100))
    folder.mkdir(exist_ok=True)
    (folder / "bad.jpg").write_text("not an image")
    base = '"Some Item",mala,500,,10,"A sacred tulsi mala for daily japa.",,,'
    for ref, text in ((small, "too small"), ("bad.jpg", "valid JPG"), ("nope.jpg", "not found"), ("../outside.jpg", "inside the images folder")):
        with SessionLocal() as db:
            rep = import_products(db, _rows(f"{base}{ref},,,,"), folder, apply=True)
        assert any(text in p for p in rep["errors"][0]["problems"]), (ref, rep["errors"])


def test_one_bad_row_means_nothing_is_added():
    good = _name()
    with SessionLocal() as db:
        rep = import_products(db, _rows(f'"{good}",mala,299,,10,"A sacred tulsi mala for daily japa.",,,,,,,',
                                        '"Bad Row",toys,299,,10,"A sacred tulsi mala for daily japa.",,,,,,,'), apply=True)
    assert len(rep["errors"]) == 1 and rep["applied"] is False
    assert _find(good) is None


def test_duplicates_are_skipped_not_doubled():
    t = _name()
    row = f'"{t}",mala,299,,10,"A sacred tulsi mala for daily japa.",,,,,,,'
    with SessionLocal() as db:
        rep = import_products(db, _rows(row, row), apply=True)
    assert len(rep["created"]) == 1 and len(rep["skipped"]) == 1
    with SessionLocal() as db:
        again = import_products(db, _rows(row), apply=True)
    assert again["skipped"] and not again["created"]
    with SessionLocal() as db:
        assert db.query(MarketplaceProduct).filter(MarketplaceProduct.title == t).count() == 1


def test_excel_bom_and_header_spacing_are_accepted():
    rows = parse_csv("﻿Title, Category ,Price,Description\nX Item,mala,10,Ten characters or more.\n")
    assert rows[0]["title"] == "X Item" and rows[0]["category"] == "mala"


def test_imported_product_appears_in_the_public_catalogue():
    from fastapi.testclient import TestClient
    from website.backend.app.main import app
    t = _name()
    with SessionLocal() as db:
        import_products(db, _rows(f'"{t}",yantra,799,,5,"Shree Yantra on copper plate, ready for puja.",Copper,India,,,,,'), apply=True)
    with TestClient(app) as c:
        titles = [p["title"] for p in c.get("/api/v1/marketplace/products?lang=en").json()["products"]]
    assert t in titles
