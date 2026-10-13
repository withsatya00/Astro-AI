"""
North Indian Diamond Kundali (Lagna D1) SVG Generation Module.
Renders clean, beautiful, light-theme Vedic astrological charts directly into chat messages.
"""
from typing import Dict, Any, List, Optional

PLANET_ABBR = {
    "Sun": "Su", "Moon": "Mo", "Mars": "Ma", "Mercury": "Me",
    "Jupiter": "Ju", "Venus": "Ve", "Saturn": "Sa", "Rahu": "Ra",
    "Ketu": "Ke", "Uranus": "Ur", "Neptune": "Ne", "Pluto": "Pl"
}

HOUSE_COORDS = {
    1:  (200, 155),  # Lagna (top center diamond)
    2:  (100, 75),   # Top-left triangle
    3:  (50, 125),   # Upper-left corner
    4:  (125, 200),  # Left diamond
    5:  (50, 280),   # Lower-left corner
    6:  (100, 330),  # Bottom-left triangle
    7:  (200, 255),  # Bottom center diamond
    8:  (300, 330),  # Bottom-right triangle
    9:  (350, 280),  # Lower-right corner
    10: (275, 200),  # Right diamond
    11: (350, 125),  # Upper-right corner
    12: (300, 75)    # Top-right triangle
}

def generate_north_indian_kundli_svg(chart_data: Optional[Dict[str, Any]], width: int = 340, height: int = 340) -> str:
    """
    Renders an authentic North Indian Diamond Lagna Kundali (D1) in SVG format
    styled for the premium light theme.
    """
    if not chart_data or not isinstance(chart_data, dict):
        return ""

    planets = chart_data.get("planets", [])
    house_planets: Dict[int, List[str]] = {h: [] for h in range(1, 13)}

    for p in planets:
        if isinstance(p, dict):
            h = p.get("house", 1)
            name = p.get("name", "")
            abbr = PLANET_ABBR.get(name, name[:2] if name else "")
            retro = "(R)" if p.get("is_retrograde") else ""
            if 1 <= h <= 12 and abbr:
                house_planets[h].append(f"{abbr}{retro}")

    planet_labels = []
    for h in range(1, 13):
        x, y = HOUSE_COORDS[h]
        items = house_planets[h]
        planets_str = " ".join(items) if items else ""
        label_svg = f"""
        <text x="{x}" y="{y - 9}" fill="#d97706" font-size="9" font-weight="700" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif">H{h}</text>
        <text x="{x}" y="{y + 6}" fill="#1f2937" font-size="10" font-weight="600" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif">{planets_str}</text>
        """
        planet_labels.append(label_svg)

    all_labels = "".join(planet_labels)

    return f"""<svg class="chat-kundali-svg" viewBox="0 0 400 400" width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="384" height="384" fill="#ffffff" stroke="#c4b5fd" stroke-width="1.5" rx="8" />
        <line x1="8" y1="8" x2="392" y2="392" stroke="#ddd6fe" stroke-width="1.2" />
        <line x1="392" y1="8" x2="8" y2="392" stroke="#ddd6fe" stroke-width="1.2" />
        <polygon points="200,8 392,200 200,392 8,200" fill="#f5f3ff" stroke="#a78bfa" stroke-width="1.5" />
        {all_labels}
    </svg>"""
