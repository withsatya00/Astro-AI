"""
Professional PDF Report Generator for AstroAI Agent using ReportLab.
Produces comprehensive Kundali and Consultation reports with planetary tables,
houses, Vimshottari dasha timelines, and interpretations.
"""
from typing import Dict, Any, Optional
import os
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from packages.core.config import settings
from packages.core.logging import logger

import re as _re


def _latin(text) -> str:
    """Drops Devanagari/non-Latin runs (the built-in PDF fonts cannot draw them) and tidies what is left."""
    out = _re.sub(r"[^\x00-\u024F\u2010-\u2027\u20B9]+", "", str(text or ""))
    out = _re.sub(r"\(\s*[/,]?\s*\)", "", out)
    return _re.sub(r"\s{2,}", " ", out).strip()


INDIGO = colors.HexColor("#1e1b4b")
GOLD = colors.HexColor("#b45309")
GOLD_SOFT = colors.HexColor("#fef3c7")


def _decorate_page(canvas, doc):
    """Indigo/gold rule at the top and a branded footer with the page number on every page."""
    canvas.saveState()
    w, h = doc.pagesize
    canvas.setFillColor(INDIGO)
    canvas.rect(0, h - 14, w, 14, stroke=0, fill=1)
    canvas.setFillColor(GOLD)
    canvas.rect(0, h - 17, w, 3, stroke=0, fill=1)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawString(36, 20, "Astro Jyotish - Vedic Astrology Report")
    canvas.drawRightString(w - 36, 20, f"Page {doc.page}")
    canvas.setStrokeColor(colors.HexColor("#e2e8f0"))
    canvas.line(36, 32, w - 36, 32)
    canvas.restoreState()


def _banner(title: str, subtitle: str, line: str = "") -> Table:
    """Full-width indigo banner used at the top of the premium reports."""
    t_style = ParagraphStyle("BannerTitle", fontName="Helvetica-Bold", fontSize=21, leading=26, textColor=colors.white, alignment=1)
    s_style = ParagraphStyle("BannerSub", fontName="Helvetica", fontSize=10.5, leading=14, textColor=colors.HexColor("#fde68a"), alignment=1)
    rows = [[Paragraph(title, t_style)], [Paragraph(subtitle, s_style)]]
    if line:
        rows.append([Paragraph(line, ParagraphStyle("BannerLine", fontName="Helvetica", fontSize=9, leading=12,
                                                    textColor=colors.HexColor("#c7d2fe"), alignment=1))])
    t = Table(rows, colWidths=[540])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), INDIGO), ("BOX", (0, 0), (-1, -1), 1.5, GOLD),
        ("TOPPADDING", (0, 0), (-1, 0), 16), ("BOTTOMPADDING", (0, -1), (-1, -1), 14),
    ]))
    return t


def generate_astrology_pdf_report(
    report_id: str,
    chart_info: Dict[str, Any],
    report_type: str = "comprehensive_kundali",
    language: str = "en"
) -> str:
    """
    Generates a PDF report and saves it to storage/reports/<report_id>.pdf.
    Returns the absolute path to the generated PDF.
    """
    reports_dir = Path(settings.REPORTS_DIR)
    reports_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = reports_dir / f"{report_id}.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#1e1b4b"), # Deep Indigo
        alignment=1 # Center
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#4338ca"), # Indigo accent
        alignment=1
    )

    h2_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e1b4b"),
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1f2937")
    )

    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#6b7280"),
        alignment=1
    )

    head_style = ParagraphStyle("TableHead", parent=body_style, fontName="Helvetica-Bold", textColor=colors.white)

    elements = []

    # Branded banner
    elements.append(_banner("Janam Kundali Report", "Precision Vedic astrology - Swiss Ephemeris calculations",
                            f"Prepared for {chart_info.get('name', 'Client')}"))
    elements.append(Spacer(1, 14))

    # Client & Birth Details Table
    name = chart_info.get("name", "Client")
    dob = chart_info.get("date_of_birth", "N/A")
    tob = chart_info.get("time_of_birth", "12:00:00")
    approx = " (Approximate)" if chart_info.get("is_time_approximate") else " (Exact)"
    city = chart_info.get("city", "Coordinates specified")
    country = chart_info.get("country", "")
    place = f"{city}, {country}".strip(", ")
    chart_data = chart_info.get("chart_data", {})
    ayanamsa = chart_data.get("ayanamsa", "Lahiri")
    engine = chart_data.get("calculation_engine", "Swiss Ephemeris")

    client_table_data = [
        [
            Paragraph("<b>Client Name:</b>", body_style), Paragraph(str(name), body_style),
            Paragraph("<b>Birth Date:</b>", body_style), Paragraph(str(dob), body_style)
        ],
        [
            Paragraph("<b>Birth Time:</b>", body_style), Paragraph(str(tob) + approx, body_style),
            Paragraph("<b>Birthplace:</b>", body_style), Paragraph(str(place), body_style)
        ],
        [
            Paragraph("<b>Zodiac System:</b>", body_style), Paragraph("Sidereal (Vedic)", body_style),
            Paragraph("<b>Ayanamsa:</b>", body_style), Paragraph(str(ayanamsa), body_style)
        ],
        [
            Paragraph("<b>Calculation Engine:</b>", body_style), Paragraph(str(engine), body_style),
            Paragraph("<b>Report Generated:</b>", body_style), Paragraph(datetime.now().strftime("%Y-%m-%d %H:%M UTC"), body_style)
        ]
    ]

    t_client = Table(client_table_data, colWidths=[110, 160, 110, 160])
    t_client.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_client)
    elements.append(Spacer(1, 15))

    # Core Signs Summary Box
    asc_sign = chart_data.get("ascendant_sign", "Aries")
    asc_nak = chart_data.get("ascendant_nakshatra", "Ashwini")
    sun_sign = chart_data.get("sun_sign", "Leo")
    moon_sign = chart_data.get("moon_sign", "Cancer")
    moon_nak = chart_data.get("moon_nakshatra", "Pushya")

    core_table_data = [
        [
            Paragraph(f"<b>Ascendant (Lagna):</b> {asc_sign}<br/><font color='#4338ca'>{asc_nak} Nakshatra</font>", body_style),
            Paragraph(f"<b>Moon Sign (Rashi):</b> {moon_sign}<br/><font color='#4338ca'>{moon_nak} Nakshatra</font>", body_style),
            Paragraph(f"<b>Sun Sign (Surya):</b> {sun_sign}<br/><font color='#4338ca'>Core Vitality & Purpose</font>", body_style)
        ]
    ]
    t_core = Table(core_table_data, colWidths=[180, 180, 180])
    t_core.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#eef2ff")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#6366f1")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t_core)
    elements.append(Spacer(1, 15))

    # Planetary Positions Table
    elements.append(Paragraph("Planetary Coordinates (Graha Sthiti)", h2_style))
    planets = chart_data.get("planets", [])
    planet_rows = [[
        Paragraph("Planet", head_style),
        Paragraph("Sign", head_style),
        Paragraph("Deg in Sign", head_style),
        Paragraph("House", head_style),
        Paragraph("Nakshatra", head_style),
        Paragraph("Pada", head_style),
        Paragraph("Motion", head_style)
    ]]

    for p in planets:
        motion = "Retrograde" if p.get("is_retrograde") else "Direct"
        deg_str = f"{p.get('degree_in_sign', 0.0):.2f}°"
        planet_rows.append([
            Paragraph(p.get("name", ""), body_style),
            Paragraph(p.get("sign", ""), body_style),
            Paragraph(deg_str, body_style),
            Paragraph(str(p.get("house", "")), body_style),
            Paragraph(p.get("nakshatra", ""), body_style),
            Paragraph(str(p.get("pada", 1)), body_style),
            Paragraph(motion, body_style)
        ])

    t_planets = Table(planet_rows, colWidths=[75, 80, 75, 55, 110, 50, 95])
    t_planets.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e1b4b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_planets)
    elements.append(Spacer(1, 15))

    # Vimshottari Mahadasha Timeline Table
    elements.append(Paragraph("Vimshottari Mahadasha Planetary Cycles", h2_style))
    dashas = chart_data.get("dashas", [])
    dasha_rows = [[
        Paragraph("Mahadasha Lord", head_style),
        Paragraph("Start Date", head_style),
        Paragraph("End Date", head_style),
        Paragraph("Duration (Years)", head_style)
    ]]
    for d in dashas[:9]:
        dasha_rows.append([
            Paragraph(d.get("planet", ""), body_style),
            Paragraph(d.get("start_date", ""), body_style),
            Paragraph(d.get("end_date", ""), body_style),
            Paragraph(str(d.get("duration_years", "")), body_style)
        ])
    t_dasha = Table(dasha_rows, colWidths=[135, 135, 135, 135])
    t_dasha.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#312e81")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_dasha)
    today_iso = datetime.now().strftime("%Y-%m-%d")
    current = next((d for d in dashas if d.get("start_date", "") <= today_iso < d.get("end_date", "")), None)
    if current:
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(
            f"<b>Running now:</b> {current['planet']} Mahadasha ({current['start_date']} to {current['end_date']}). "
            f"Themes of {current['planet']} are emphasised in this period.", body_style))
    elements.append(Spacer(1, 15))

    # Astrological Synthesis & Interpretations
    interp = chart_data.get("interpretations", {})
    if interp:
        elements.append(Paragraph("Astrological Synthesis & Insights", h2_style))
        asc_summary = interp.get("ascendant_summary", "")
        if asc_summary:
            elements.append(Paragraph(f"<b>Ascendant Reading:</b> {asc_summary}", body_style))
            elements.append(Spacer(1, 6))

        dasha_summary = interp.get("current_dasha_summary", "")
        if dasha_summary:
            elements.append(Paragraph(f"<b>Planetary Period Focus:</b> {dasha_summary}", body_style))
            elements.append(Spacer(1, 6))

    # Classical Yoga & Astrological Pattern Detection
    try:
        from packages.astrology.yoga_detection import analyze_all_chart_yogas
        yoga_analysis = analyze_all_chart_yogas(chart_data)
        detected_yogas = yoga_analysis.get("detected_yogas", [])
        kuja_info = yoga_analysis.get("kuja_dosha", {})
        sade_sati_info = yoga_analysis.get("sade_sati", {})

        if detected_yogas:
            elements.append(Spacer(1, 10))
            elements.append(Paragraph("Detected Classical Yogas", h2_style))
            yoga_rows = [[
                Paragraph("Yoga Name", head_style),
                Paragraph("Category", head_style),
                Paragraph("Planets Involved", head_style),
                Paragraph("Classical Influence & Strength", head_style)
            ]]
            for y in detected_yogas[:6]:
                yoga_rows.append([
                    Paragraph(f"<b>{y.get('yoga_name', '')}</b>", body_style),
                    Paragraph(y.get("category", "Classical Yoga"), body_style),
                    Paragraph(str(y.get("planet", "")), body_style),
                    Paragraph(f"{y.get('description', '')} ({y.get('strength', 'High')} Strength)", body_style)
                ])

            t_yogas = Table(yoga_rows, colWidths=[120, 110, 100, 210])
            t_yogas.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#78350f")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#fde68a")),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#fffbeb"), colors.white]),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(t_yogas)
            elements.append(Spacer(1, 10))

        # Kuja Dosha & Shani Sade Sati Status Box
        special_rows = []
        if kuja_info.get("has_kuja_dosha"):
            cancellation_note = f" (Cancellations: {'; '.join(kuja_info.get('cancellations', []))})" if kuja_info.get("cancellations") else ""
            special_rows.append([
                Paragraph("<b>Kuja Dosha (Manglik Status):</b>", body_style),
                Paragraph(f"Mars in House {kuja_info.get('mars_house')} ({kuja_info.get('mars_sign')}). Status: <b>{kuja_info.get('affliction_level')}</b>{cancellation_note}", body_style)
            ])
        else:
            special_rows.append([
                Paragraph("<b>Kuja Dosha Status:</b>", body_style),
                Paragraph("No significant Kuja Dosha affliction detected from Lagna or Moon.", body_style)
            ])

        if sade_sati_info.get("is_active"):
            special_rows.append([
                Paragraph("<b>Shani Sade Sati Status:</b>", body_style),
                Paragraph(f"<b>{sade_sati_info.get('phase')}</b> - {sade_sati_info.get('description')}", body_style)
            ])
        else:
            special_rows.append([
                Paragraph("<b>Shani Sade Sati Status:</b>", body_style),
                Paragraph("Saturn is currently in a neutral or favorable transit position relative to your Moon.", body_style)
            ])

        t_special = Table(special_rows, colWidths=[160, 380])
        t_special.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_special)
        elements.append(Spacer(1, 12))

        # Authentic Classical Remedial Guidance Box
        elements.append(Paragraph("Authentic Classical Remedial Guidance", h2_style))
        from packages.core.remedies import LORD_REMEDY, SIGNS, SIGN_LORDS
        sign_base = str(moon_sign).split("(")[0].strip().title()
        lord = SIGN_LORDS[SIGNS.index(sign_base)] if sign_base in SIGNS else None
        remedy_rows = []
        if lord:
            r = LORD_REMEDY[lord]
            remedy_rows.append([
                Paragraph(f"<b>For your Moon sign ({sign_base}, lord {lord}):</b>", body_style),
                Paragraph(f"Traditional gemstone: <b>{r['gem_en']}</b> (wear only after consulting an astrologer). "
                          f"Worship <b>{r['deity_en']}</b> on <b>{r['day']}s</b> and offer a seva at "
                          f"{r['temple'].replace('-', ' ').title()}.", body_style)])
        remedy_rows += [
            [
                Paragraph("<b>Anukul Ratna (Gemstone) Shastra:</b>", body_style),
                Paragraph("Wear gemstones ONLY for functional benefics (Lords of 1, 5, or 9). Never wear stones for Maraka (2, 7) or Dusthana (6, 8, 12) lords to avoid amplifying obstacles.", body_style)
            ],
            [
                Paragraph("<b>Vedic Stotra & Mantra Japa:</b>", body_style),
                Paragraph("Chant Aditya Hridaya Stotram for vitality and father; Mahamrityunjaya Mantra for longevity and Saturn pacification; Vishnu Sahasranama for overall intellectual and spiritual harmony.", body_style)
            ],
            [
                Paragraph("<b>Satvik Daan (Charity):</b>", body_style),
                Paragraph("Offer appropriate grains and charity directly to genuinely needy recipients with humility and without public ostentation on days corresponding to afflicted planets.", body_style)
            ]
        ]
        t_remedy = Table(remedy_rows, colWidths=[160, 380])
        t_remedy.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fffdf5")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#f59e0b")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#fde68a")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(t_remedy)

    except Exception as ex:
        logger.warning(f"Could not append advanced yoga section to PDF: {ex}")
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=8))
    elements.append(Paragraph(
        "Disclaimer: This report is generated by Astro Jyotish using Swiss Ephemeris astronomical calculations "
        "and classical Vedic astrological principles. It is intended for educational, philosophical, and personal contemplation.",
        disclaimer_style
    ))

    # Build PDF
    doc.build(elements, onFirstPage=_decorate_page, onLaterPages=_decorate_page)
    logger.info(f"Successfully generated PDF report at {pdf_path}")
    return str(pdf_path)


def generate_milan_pdf(result: Dict[str, Any]) -> bytes:
    """Kundali Milan (Ashtakoota) report as PDF bytes: score, koota breakdown and Manglik status."""
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=40, bottomMargin=44)
    styles = getSampleStyleSheet()
    body = ParagraphStyle("MBody", parent=styles["Normal"], fontName="Helvetica", fontSize=9.5, leading=13, textColor=colors.HexColor("#1f2937"))
    head = ParagraphStyle("MHead", parent=body, fontName="Helvetica-Bold", textColor=colors.white)
    h2 = ParagraphStyle("MH2", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=INDIGO, spaceBefore=12, spaceAfter=6)
    L = _latin
    score = float(result.get("total_score", 0))
    tone = colors.HexColor("#047857") if score >= 25 else colors.HexColor("#b45309") if score >= 18 else colors.HexColor("#b91c1c")
    els = [_banner("Kundali Milan Report", "Ashtakoota - 36 Guna matching", f"{L(result.get('boy_name'))}  &amp;  {L(result.get('girl_name'))}"), Spacer(1, 14)]
    big = ParagraphStyle("Big", fontName="Helvetica-Bold", fontSize=34, leading=38, textColor=tone, alignment=1)
    verdict = ParagraphStyle("Verdict", fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=INDIGO, alignment=1)
    summary = Table([[Paragraph(f"{score:g} / 36", big)],
                     [Paragraph(f"{result.get('percentage', 0)}% match - {L(result.get('verdict'))}", verdict)]], colWidths=[540])
    summary.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), GOLD_SOFT), ("BOX", (0, 0), (-1, -1), 1, GOLD),
                                 ("TOPPADDING", (0, 0), (-1, 0), 12), ("BOTTOMPADDING", (0, -1), (-1, -1), 10)]))
    rec = L(result.get("recommendation"))
    els += [summary, Spacer(1, 8)] + ([Paragraph(rec, body)] if len(rec) > 30 else [])

    els.append(Paragraph("Koota-wise score", h2))
    rows = [[Paragraph(h, head) for h in ("Koota", "Boy", "Girl", "Score", "Meaning")]]
    for k in result.get("kootas", []):
        rows.append([Paragraph(L(k.get("koota")), body), Paragraph(L(k.get("boy_value")), body), Paragraph(L(k.get("girl_value")), body),
                     Paragraph(f"<b>{k.get('obtained_points', 0):g}</b> / {k.get('max_points', 0):g}", body), Paragraph(L(k.get("description")), body)])
    t = Table(rows, colWidths=[70, 70, 70, 55, 275], repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), INDIGO), ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                           ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    els.append(t)

    mc = result.get("manglik_compatibility") or {}
    text = next((L(mc[k]) for k in ("note", "verdict", "status", "summary", "recommendation", "description") if mc.get(k)), "")
    if text:
        els += [Paragraph("Manglik (Kuja Dosha) compatibility", h2), Paragraph(text, body)]
    els += [Spacer(1, 12), HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=6),
            Paragraph("Kundali Milan is a traditional guide to compatibility. Marriage decisions should also weigh values, health and family consultation. "
                      "Generated by Astro Jyotish on " + datetime.now().strftime("%d %b %Y") + ".",
                      ParagraphStyle("Disc", parent=body, fontName="Helvetica-Oblique", fontSize=8, textColor=colors.HexColor("#6b7280"), alignment=1))]
    doc.build(els, onFirstPage=_decorate_page, onLaterPages=_decorate_page)
    return buf.getvalue()
