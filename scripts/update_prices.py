import sqlite3
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
db_path = ROOT / 'astro_ai.db'
seed_path = ROOT / 'packages/database/seed_astrologers.py'

conn = sqlite3.connect(str(db_path))
c = conn.cursor()
c.execute('SELECT slug, price_per_minute FROM astrologers')
prices = dict(c.fetchall())
conn.close()

with open(str(seed_path), 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
current_slug = None
for line in lines:
    m_slug = re.search(r'"slug":\s*"([^"]+)"', line)
    if m_slug:
        current_slug = m_slug.group(1)
    
    m_price = re.search(r'("price_per_minute":\s*)([0-9\.]+)(.*)', line)
    if m_price and current_slug and current_slug in prices:
        new_val = prices[current_slug]
        line = f'{m_price.group(1)}{new_val}{m_price.group(3)}\n'
    new_lines.append(line)

with open(str(seed_path), 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'Successfully updated seed_astrologers.py with {len(prices)} prices!')

