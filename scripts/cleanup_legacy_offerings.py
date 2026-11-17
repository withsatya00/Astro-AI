import sqlite3

def run():
    conn = sqlite3.connect('astro_ai.db')
    cur = conn.cursor()
    legacy_titles = [
        'माचिस', 'फूल', 'दूध', 'गंगाजल', 'धतूरा', 'भस्म', 'घी का दीपक',
        'अगरबत्ती', 'चंदन', 'मिश्री', 'भोग थाली', 'गुग्गुल धूप', 'बेलपत्र',
        'लाल चुनरी', 'वस्त्र', 'सरसों का तेल', 'सिंदूर', 'सिंदूर-चोला'
    ]
    q_marks = ','.join(['?'] * len(legacy_titles))
    cur.execute(f"SELECT count(*) FROM temple_offerings WHERE category='item' AND title IN ({q_marks})", legacy_titles)
    count = cur.fetchone()[0]
    print(f"Found {count} legacy item rows")

    # Delete those legacy rows
    cur.execute(f"DELETE FROM temple_offerings WHERE category='item' AND title IN ({q_marks})", legacy_titles)
    conn.commit()
    print(f"Deleted {count} legacy items successfully.")

    # Check remaining items for Mahakaleshwar
    cur.execute("SELECT id FROM temples WHERE slug='mahakaleshwar-ujjain'")
    temple_id = cur.fetchone()[0]
    cur.execute("SELECT title, price, category FROM temple_offerings WHERE temple_id=? ORDER BY category, price", (temple_id,))
    rows = cur.fetchall()
    print(f"Remaining offerings for Mahakaleshwar ({len(rows)}):")
    for r in rows:
        print(f"  [{r[2]}] {r[0]} - ₹{r[1]}")

    conn.close()

if __name__ == '__main__':
    run()
