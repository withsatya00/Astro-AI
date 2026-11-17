import sqlite3
import json

con = sqlite3.connect('astro_ai.db')
cur = con.cursor()

tables = [row[0] for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%bhakti%'").fetchall()]
print(f"Total Bhakti tables found: {len(tables)}")
for t in tables:
    count = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    sample = cur.execute(f"SELECT * FROM {t} LIMIT 1").fetchone()
    cols = [d[0] for d in cur.description] if cur.description else []
    print(f"\n--- Table: {t} ({count} records) ---")
    print(f"Columns: {', '.join(cols[:8])}...")
    if sample:
        print(f"Sample row 1: {sample[:4]}")

# Also check other related tables like temple, festival, jaap
other_tables = [row[0] for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%jaap%' OR name LIKE '%temple%' OR name LIKE '%gita%')").fetchall()]
print(f"\nOther related tables: {other_tables}")
for t in other_tables:
    count = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"  {t}: {count} records")

con.close()
