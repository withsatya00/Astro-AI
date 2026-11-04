"""Import Astro Mall products from a CSV file.

    python scripts/import_products.py products.csv --images-dir photos            # check only (nothing is written)
    python scripts/import_products.py products.csv --images-dir photos --apply    # add the products

Columns: title, category, price, description are required; original_price, stock, material, origin, image, extra_images (separate with |),
seller_name, energized_details, return_days are optional. See docs/product-import-template.csv.
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from packages.database.session import SessionLocal, init_db  # noqa: E402
from website.backend.app.product_import import COLUMNS, import_products, parse_csv  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv_file", type=Path)
    ap.add_argument("--images-dir", type=Path, help="folder holding the photo files named in the image columns")
    ap.add_argument("--seller-name", default="Astro Jyotish", help="shown as the seller when a row has no seller_name")
    ap.add_argument("--apply", action="store_true", help="actually add the products (without it nothing is written)")
    args = ap.parse_args()

    rows = parse_csv(args.csv_file.read_text(encoding="utf-8-sig"))
    if not rows:
        print("The file has no product rows.")
        return 1
    unknown = sorted({k for r in rows for k in r} - set(COLUMNS))
    if unknown:
        print(f"Ignoring unknown columns: {', '.join(unknown)}")

    init_db()
    with SessionLocal() as db:
        report = import_products(db, rows, args.images_dir, args.apply, args.seller_name)

    for item in report["created"]:
        print(f"  {'ADDED' if report['applied'] else 'OK   '} line {item['line']}: {item['title']} ({item['category']}, ₹{item['price']:g}, stock {item['stock']})")
    for item in report["skipped"]:
        print(f"  SKIP  line {item['line']}: {item['title']} - {item['reason']}")
    for item in report["errors"]:
        print(f"  ERROR line {item['line']}: {item['title'] or '(no title)'}")
        for problem in item["problems"]:
            print(f"        - {problem}")

    print(f"\n{len(report['created'])} product(s) {'added' if report['applied'] else 'ready'}, {len(report['skipped'])} skipped, {len(report['errors'])} with errors.")
    if report["errors"]:
        print("Nothing was added. Fix the rows above and run again.")
        return 2
    if not args.apply:
        print("This was a check only. Run again with --apply to add them.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
