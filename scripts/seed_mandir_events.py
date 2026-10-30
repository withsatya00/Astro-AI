"""Create DEMO puja and chadhava events so the Mandir Seva booking flow can be tried locally.

Real events are created by an admin under Admin -> Chadhava Events after the temple team has agreed to perform them.
These demo events mark that confirmation as given, so this script refuses to run in production.

    python scripts/seed_mandir_events.py            # uses the configured DATABASE_URL
    DATABASE_URL=sqlite:///scratch/demo.db python scripts/seed_mandir_events.py
"""
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

if os.environ.get("APP_ENV", "").lower() == "production":
    sys.exit("Refusing to create demo events with APP_ENV=production.")

from packages.database.session import init_db, SessionLocal  # noqa: E402
from packages.database.models import Temple, TempleOffering  # noqa: E402
from packages.database.chadhava import ChadhavaEvent  # noqa: E402
from website.backend.app.api import mandir  # noqa: E402

# slug -> (puja title en, puja title hi, benefits en, benefits hi)
PUJAS = {
    "ram-janmabhoomi-ayodhya": ("Ramlala Sankalp Puja", "रामलला संकल्प पूजा",
                                ["Family peace and harmony", "Blessings of Maryada Purushottam Ram", "Protection from hardship"],
                                ["परिवार में शांति और सद्भाव", "मर्यादा पुरुषोत्तम श्रीराम का आशीर्वाद", "कष्टों से रक्षा"]),
    "mahakaleshwar-ujjain": ("Mahakal Rudrabhishek Puja", "महाकाल रुद्राभिषेक पूजा",
                             ["Relief from fear and obstacles", "Good health and long life"], ["भय और बाधाओं से मुक्ति", "उत्तम स्वास्थ्य और दीर्घायु"]),
    "kashi-vishwanath-varanasi": ("Kashi Vishwanath Rudrabhishek", "काशी विश्वनाथ रुद्राभिषेक",
                                  ["Pacifies graha doshas", "Peace of mind and moksha"], ["ग्रह दोष शांति", "मन की शांति और मोक्ष"]),
    "shani-shingnapur": ("Shani Shanti Tailabhishek", "शनि शांति तैलाभिषेक",
                         ["Relief during Sade Sati and Dhaiya", "Removes Shani-related hardship"], ["साढ़ेसाती और ढैय्या में राहत", "शनि कष्ट निवारण"]),
    "siddhivinayak-mumbai": ("Ganpati Karya Siddhi Puja", "गणपति कार्य सिद्धि पूजा",
                             ["Removes obstacles in new ventures", "Success in career and business"], ["नए कार्यों में बाधा निवारण", "करियर और व्यापार में सफलता"]),
}


def main() -> None:
    init_db()
    with SessionLocal() as db:
        mandir.seed_temples_if_empty(db)  # temples, bundles, items and puja packages
        now = datetime.now(timezone.utc)
        made = 0
        for temple in db.query(Temple).filter(Temple.is_active == True).all():  # noqa: E712
            def exists(kind):
                return db.query(ChadhavaEvent).filter(ChadhavaEvent.temple_id == temple.id, ChadhavaEvent.kind == kind,
                                                      ChadhavaEvent.starts_at > now).count()
            if not exists("chadhava"):
                db.add(ChadhavaEvent(temple_id=temple.id, kind="chadhava", title="Daily chadhava seva",
                                     title_hi="दैनिक चढ़ावा सेवा", description="Offerings placed at the temple in your name by the temple team, with a video of the offering.",
                                     description_hi="मंदिर टीम द्वारा आपके नाम से चढ़ावा अर्पित और उसका वीडियो।", starts_at=now + timedelta(days=3, hours=1),
                                     deadline=now + timedelta(days=2), cancellation_deadline=now + timedelta(days=1), capacity=500, mode="collective",
                                     offering_ids=[], video_hours=72, unknown_gotra_allowed=True, partner_confirmed=True, published=True))
                made += 1
            spec = PUJAS.get(temple.slug)
            if spec and not exists("puja"):
                tiers = db.query(TempleOffering).filter_by(temple_id=temple.id, category="puja_tier", is_active=True).order_by(TempleOffering.sort_order).all()
                db.add(ChadhavaEvent(temple_id=temple.id, kind="puja", title=spec[0], title_hi=spec[1],
                                     description="A puja performed by the temple priests with sankalp in the name and gotra of every devotee in your package.",
                                     description_hi="मंदिर के पुजारियों द्वारा आपके पैकेज के हर भक्त के नाम व गोत्र से संकल्प सहित पूजा।",
                                     starts_at=now + timedelta(days=6, hours=2), deadline=now + timedelta(days=5), cancellation_deadline=now + timedelta(days=4),
                                     capacity=200, mode="collective", offering_ids=[t.id for t in tiers], video_hours=72, unknown_gotra_allowed=True,
                                     partner_confirmed=True, published=True, benefits={"en": spec[2], "hi": spec[3]}))
                made += 1
        db.commit()
    print(f"Created {made} demo event(s).")


if __name__ == "__main__":
    main()
