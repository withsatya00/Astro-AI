import os
import re

def check_images():
    files = [
        "website/frontend/src/pages/BhaktiPage/BhaktiHome.jsx",
        "website/frontend/src/pages/BhaktiPage/BhaktiLayout.jsx",
        "website/frontend/src/pages/BhaktiPage/AartiLibrary.jsx",
        "website/frontend/src/pages/BhaktiPage/dailyRitual.js"
    ]
    
    missing = []
    found = []
    
    for f in files:
        if not os.path.exists(f):
            continue
        txt = open(f, encoding="utf-8").read()
        paths = re.findall(r"['\"](/assets/[^'\"]+\.(?:webp|png|jpg|jpeg))['\"]", txt)
        for p in set(paths):
            disk_path1 = os.path.normpath(os.path.join("website/frontend", p.lstrip("/")))
            disk_path2 = os.path.normpath(os.path.join("dist", p.lstrip("/")))
            if os.path.exists(disk_path1) or os.path.exists(disk_path2):
                found.append((f, p))
            else:
                missing.append((f, p, disk_path1))

    print(f"Total Found: {len(found)}")
    print(f"Total Missing: {len(missing)}")
    for f, p, dp in missing:
        print(f"[MISSING] in {f}: {p} (Expected at: {dp})")

if __name__ == "__main__":
    check_images()
