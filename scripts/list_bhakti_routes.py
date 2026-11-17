import sys
import os
sys.path.insert(0, os.getcwd())

from website.backend.app.main import app

bhakti_routes = []
for route in app.routes:
    path = getattr(route, 'path', '')
    methods = getattr(route, 'methods', None)
    if '/bhakti' in path:
        bhakti_routes.append((path, sorted(list(methods or []))))

print(f"Total Bhakti API routes found: {len(bhakti_routes)}")
for p, m in sorted(bhakti_routes):
    methods_str = ', '.join([x for x in m if x not in ('HEAD', 'OPTIONS')])
    print(f"  {methods_str:6s} {p}")
