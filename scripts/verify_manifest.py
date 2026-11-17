import json
from pathlib import Path
import hashlib

manifest_path = Path('documents/manifests/source_manifest.json')
with open(manifest_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

entries = data.get('manifest', [])
print(f'Total manifest entries: {len(entries)}')
errors = []

for item in entries:
    fp = Path(item['file_path'])
    if not fp.exists():
        errors.append(f'Missing file: {fp}')
        continue
    with open(fp, 'rb') as f:
        actual_hash = hashlib.sha256(f.read()).hexdigest()
    if item.get('checksum') and item['checksum'] != actual_hash:
        errors.append(f"Checksum mismatch on {fp}: expected {item['checksum'][:8]}, got {actual_hash[:8]}")

if errors:
    print('ERRORS FOUND:', errors)
else:
    print('SUCCESS: ALL MANIFEST ENTRIES ARE 100% VALID AND CHECKSUMS MATCH!')
