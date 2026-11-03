"""Bulk-load Bhakti library texts (and optional audio) from a JSON file you supply.

Usage:  python scripts/import_bhakti_content.py content.json [--audio-dir DIR]

content.json is a list of objects with the same fields as the admin API (slug, kind, deity, title_hi, title_en,
body_hi, body_roman, meaning_hi, meaning_en, source, license, is_verified, published), plus an optional
"audio": [{"file": "name.mp3", "title": "...", "source": "...", "license": "..."}] resolved against --audio-dir.
Every published item needs text, source and licence; audio always needs title, source and licence.
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from packages.database.bhakti import BhaktiAudio, BhaktiContent, BhaktiDeity  # noqa: E402
from packages.database.models import generate_uuid  # noqa: E402
from packages.database.session import SessionLocal, init_db  # noqa: E402
from website.backend.app.api import bhakti_content as lib  # noqa: E402
from website.backend.app.api.bhakti import seed_bhakti_if_empty  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("json_file")
    ap.add_argument("--audio-dir", default=".")
    args = ap.parse_args()
    items = json.loads(Path(args.json_file).read_text(encoding="utf-8"))
    init_db()
    errors = 0
    with SessionLocal() as db:
        seed_bhakti_if_empty(db)
        for raw in items:
            audio = raw.pop("audio", [])
            try:
                p = lib.ContentIn(**raw)
                if p.published and not (p.body_hi.strip() and p.source.strip() and p.license.strip()):
                    raise ValueError("published items need text, source and licence")
                deity = db.query(BhaktiDeity).filter(BhaktiDeity.slug == p.deity).first() if p.deity else None
                if p.deity and not deity:
                    raise ValueError(f"unknown deity {p.deity}")
                c = db.query(BhaktiContent).filter(BhaktiContent.slug == p.slug).first() or BhaktiContent(slug=p.slug)
                for f in ("kind", "title_hi", "title_en", "body_hi", "body_roman", "meaning_hi", "meaning_en", "source", "license", "is_verified", "published"):
                    setattr(c, f, getattr(p, f))
                c.deity_id = deity.id if deity else None
                db.add(c)
                db.flush()
                for a in audio:
                    if not all(str(a.get(k, "")).strip() for k in ("file", "title", "source", "license")):
                        raise ValueError("audio needs file, title, source and licence")
                    src = Path(args.audio_dir) / a["file"]
                    data = src.read_bytes()
                    kind = lib._audio_kind(data[:16])
                    if not kind or len(data) > lib.MAX_AUDIO_BYTES:
                        raise ValueError(f"{a['file']}: not a valid audio file under 25 MB")
                    lib.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
                    name = f"{generate_uuid()}.{kind}"
                    shutil.copyfile(src, lib.AUDIO_DIR / name)
                    db.add(BhaktiAudio(content_id=c.id, title=a["title"], url=f"/uploads/bhakti-audio/{name}", source=a["source"], license=a["license"]))
                db.commit()
                print(f"ok    {p.slug}")
            except Exception as e:  # keep going so one bad row does not block the rest
                db.rollback()
                errors += 1
                print(f"FAIL  {raw.get('slug', '?')}: {e}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
