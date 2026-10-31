import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from packages.database.session import SessionLocal
from packages.database.models import Gaushala, generate_uuid, utc_now
import json

def seed():
    db = SessionLocal()
    try:
        existing = db.query(Gaushala).first()
        if existing:
            existing.donations_enabled = True
            existing.is_active = True
            if not existing.beneficiary_name:
                existing.beneficiary_name = "Shri Krishna Gaushala Trust"
            db.commit()
            print("Existing gaushala updated:", existing.name, existing.id)
            return

        photos = json.dumps([
            "/assets/img/gausewa/cow-mother-calf.webp",
            "/assets/img/gausewa/cow-portrait.webp",
            "/assets/img/gausewa/gaushala-shelter-real.webp"
        ])

        g = Gaushala(
            id=generate_uuid(),
            slug="shri-krishna-gaushala-vrindavan",
            name="Shri Krishna Gaushala (Cow Care Center)",
            location="Vrindavan, Mathura, Uttar Pradesh",
            introduction="A registered sanctuary providing loving care, daily green fodder, medical treatment, and shelter to 350+ sacred cows.",
            photos=photos,
            beneficiary_name="Shri Krishna Gaushala Trust",
            beneficiary_details="Direct monthly disbursement for nutritious green fodder, 24/7 veterinarian aid, and seasonal cow shelter.",
            donations_enabled=True,
            is_active=True,
            created_at=utc_now(),
            updated_at=utc_now()
        )
        db.add(g)
        db.commit()
        print("Seeded Shri Krishna Gaushala:", g.id)
    finally:
        db.close()

if __name__ == "__main__":
    seed()
