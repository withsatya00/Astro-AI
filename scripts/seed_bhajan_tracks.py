import sys, os, uuid
from datetime import datetime
sys.path.insert(0, os.getcwd())

from packages.database.session import SessionLocal
from packages.database.bhakti import BhajanTrack

TRACKS = [
    {
        "youtube_id": "7X8v_S2E5hA",
        "title": "Achyutam Keshavam Krishna Damodaram",
        "category": "krishna",
        "channel": "Sacred Devotional Chants",
        "rights_note": "Traditional Krishna Bhajan - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "Y87x9XoH-1E",
        "title": "Shri Krishna Govind Hare Murari",
        "category": "krishna",
        "channel": "Vedic Dhun Heritage",
        "rights_note": "Traditional Naam Dhun - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "gN7qa1d8g_8",
        "title": "Shiv Tandav Stotram (Original Divine Chants)",
        "category": "shiva",
        "channel": "Sacred Stotras & Chants",
        "rights_note": "Ravan Rachit Shiv Tandav - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "Hk3Xf4C7gU4",
        "title": "Har Har Shambhu Shiv Mahadeva",
        "category": "shiva",
        "channel": "Bhakti Sangeet Mandir",
        "rights_note": "Devotional Shiva Bhajan - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "AETFvQonfV8",
        "title": "Shri Hanuman Chalisa - Complete Chanting",
        "category": "hanuman",
        "channel": "T-Series Bhakti",
        "rights_note": "Traditional Chalisa - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "Lz8f8U8v8nU",
        "title": "Bajrang Baan Path with Meaning",
        "category": "hanuman",
        "channel": "Hanuman Bhakti Sangam",
        "rights_note": "Sacred Baan Path - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "P77V8a4K2uI",
        "title": "Shri Ram Chandra Kripalu Bhajman",
        "category": "ram",
        "channel": "Ram Bhakti Heritage",
        "rights_note": "Goswami Tulsidas Ram Stuti - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "M7F7s3N0x3w",
        "title": "Aigiri Nandini - Mahishasura Mardini Stotram",
        "category": "durga",
        "channel": "Devi Stotram Chants",
        "rights_note": "Adi Shankaracharya Stotra - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "S1zX3-j2sWw",
        "title": "Gayatri Mantra 108 Times with Morning Flute",
        "category": "morning",
        "channel": "Morning Vedic Mantras",
        "rights_note": "Daily Rigvedic Gayatri Chant - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "kZ7J3n9v6pQ",
        "title": "Om Jai Jagdish Hare - Sampoorna Sandhya Aarti",
        "category": "evening-aarti",
        "channel": "Divine Aarti Collection",
        "rights_note": "Traditional Aarti - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "8sAKX04vW-8",
        "title": "432Hz Sacred Om Meditation - Deep Healing Vibrations",
        "category": "meditation",
        "channel": "Spiritual Frequencies",
        "rights_note": "Sacred Drone & Om Meditation - YouTube Embed Permitted",
        "published": True
    },
    {
        "youtube_id": "bY9_oW1eY8M",
        "title": "Soulful Bansuri - Krishna Divine Flute Meditation",
        "category": "instrumental",
        "channel": "Sacred Flute Harmony",
        "rights_note": "Classical Raga Instrumental - YouTube Embed Permitted",
        "published": True
    }
]

def seed():
    db = SessionLocal()
    count = 0
    try:
        for t_data in TRACKS:
            existing = db.query(BhajanTrack).filter(BhajanTrack.youtube_id == t_data["youtube_id"]).first()
            if not existing:
                track = BhajanTrack(
                    id=str(uuid.uuid4()),
                    youtube_id=t_data["youtube_id"],
                    title=t_data["title"],
                    category=t_data["category"],
                    channel=t_data["channel"],
                    rights_note=t_data["rights_note"],
                    published=t_data["published"],
                    created_at=datetime.utcnow()
                )
                db.add(track)
                count += 1
            else:
                existing.title = t_data["title"]
                existing.category = t_data["category"]
                existing.channel = t_data["channel"]
                existing.rights_note = t_data["rights_note"]
                existing.published = t_data["published"]
        db.commit()
        print(f"Seeded {count} new tracks. Total in DB: {db.query(BhajanTrack).count()}")
    finally:
        db.close()

if __name__ == '__main__':
    seed()
