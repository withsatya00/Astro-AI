"""Seva certificate PDF and QR codes (verification links)."""
import io
from html import escape
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF: shapes Devanagari correctly through its HTML layout engine
import segno

FONT_DIR = Path(__file__).resolve().parents[3] / "frontend" / "assets" / "fonts"

LABELS = {
    "en": {
        "title": "Seva Sankalp Certificate", "sub": "This certifies that the sankalp below was booked on Astro Jyotish.",
        "yajman": "Yajman", "gotra": "Gotra", "family": "Family members included", "temple": "Temple", "seva": "Seva",
        "date": "Date", "tithi": "Tithi", "booking": "Booking ID", "code": "Certificate code", "purpose": "Sankalp",
        "verify": "Scan to verify this certificate", "foot": "Verify at the link under the QR code. Issued by Astro Jyotish.",
    },
    "hi": {
        "title": "सेवा संकल्प प्रमाण पत्र", "sub": "प्रमाणित किया जाता है कि नीचे दिया संकल्प एस्ट्रो ज्योतिष पर बुक किया गया।",
        "yajman": "यजमान", "gotra": "गोत्र", "family": "शामिल परिवारजन", "temple": "तीर्थ", "seva": "सेवा",
        "date": "दिनांक", "tithi": "तिथि", "booking": "बुकिंग आईडी", "code": "प्रमाण पत्र कोड", "purpose": "संकल्प",
        "verify": "सत्यापन के लिए स्कैन करें", "foot": "QR के नीचे दिए लिंक पर जाकर सत्यापित करें। जारीकर्ता: एस्ट्रो ज्योतिष।",
    },
}


def qr_png(url: str, scale: int = 6) -> bytes:
    buf = io.BytesIO()
    segno.make(url, error="m").save(buf, kind="png", scale=scale, border=2)
    return buf.getvalue()


def qr_svg(url: str) -> str:
    buf = io.BytesIO()
    segno.make(url, error="m").save(buf, kind="svg", scale=4, border=2, xmldecl=False)
    return buf.getvalue().decode("utf-8")


def seva_certificate_pdf(*, lang: str, yajman: str, gotra: str, family: Optional[str], temple: str, seva: str,
                         date_text: str, tithi: Optional[str], booking_number: str, code: str, purpose: Optional[str],
                         verify_url: str) -> bytes:
    L = LABELS["hi" if lang == "hi" else "en"]
    rows = [(L["yajman"], yajman), (L["gotra"], gotra)]
    if family:
        rows.append((L["family"], family))
    rows += [(L["temple"], temple), (L["seva"], seva)]
    if purpose:
        rows.append((L["purpose"], purpose))
    rows += [(L["date"], date_text)]
    if tithi:
        rows.append((L["tithi"], tithi))
    rows += [(L["booking"], booking_number), (L["code"], code)]
    table = "".join(f"<tr><td class='k' width='150'>{escape(k)}</td><td class='v' width='325'>{escape(v or '-')}</td></tr>" for k, v in rows)

    css = (
        "@font-face{font-family:ndr;src:url(NotoSansDevanagari-Regular.ttf);}"
        "@font-face{font-family:ndr;font-weight:bold;src:url(NotoSansDevanagari-Bold.ttf);}"
        "body{font-family:ndr,sans-serif;color:#1e1b4b;} h1{font-size:26px;color:#7c2d12;text-align:center;margin:0 0 6px;}"
        ".sub{text-align:center;font-size:12px;color:#475569;margin:0 0 18px;} table{width:100%;border-collapse:collapse;}"
        "td{padding:7px 8px;font-size:14px;border-bottom:1px solid #e7e2d8;vertical-align:top;} .k{color:#64748b;}"
        ".v{font-weight:bold;} .small{font-size:10px;color:#64748b;text-align:center;}"
    )
    html = f"<h1>{escape(L['title'])}</h1><p class='sub'>{escape(L['sub'])}</p><table width='475'>{table}</table>"

    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.draw_rect(fitz.Rect(24, 24, 571, 818), color=(0.71, 0.33, 0.04), width=2.5)
    page.draw_rect(fitz.Rect(32, 32, 563, 810), color=(0.96, 0.62, 0.04), width=0.8)
    archive = fitz.Archive(str(FONT_DIR))
    page.insert_htmlbox(fitz.Rect(60, 70, 535, 560), html, css=css, archive=archive)
    page.insert_image(fitz.Rect(228, 585, 368, 725), stream=qr_png(verify_url))
    page.insert_htmlbox(fitz.Rect(60, 728, 535, 760), f"<p class='small'>{escape(L['verify'])}<br>{escape(verify_url)}</p>", css=css, archive=archive)
    page.insert_htmlbox(fitz.Rect(60, 770, 535, 800), f"<p class='small'>{escape(L['foot'])}</p>", css=css, archive=archive)
    out = doc.tobytes()
    doc.close()
    return out
