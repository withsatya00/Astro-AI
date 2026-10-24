import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/index.html', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for i, line in enumerate(lines, 1):
    if 'panchang' in line.lower() and ('id=' in line.lower() or 'class="modal' in line.lower() or 'section' in line.lower() or 'view-' in line.lower()):
        print(f"L{i}: {line.strip()[:110]}")
