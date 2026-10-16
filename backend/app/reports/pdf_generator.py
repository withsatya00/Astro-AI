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
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from backend.app.core.config import settings
from backend.app.core.logging import logger

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

    elements = []

    # Title & Subtitle
    elements.append(Paragraph("AstroAI Agent - Kundali Consultation Report", title_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("Precision Vedic Astrological Calculations & Synthesis", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4338ca"), spaceAfter=15))

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
        Paragraph("<b>Planet</b>", body_style),
        Paragraph("<b>Sign</b>", body_style),
        Paragraph("<b>Deg in Sign</b>", body_style),
        Paragraph("<b>House</b>", body_style),
        Paragraph("<b>Nakshatra</b>", body_style),
        Paragraph("<b>Pada</b>", body_style),
        Paragraph("<b>Motion</b>", body_style)
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
        Paragraph("<b>Mahadasha Lord</b>", body_style),
        Paragraph("<b>Start Date</b>", body_style),
        Paragraph("<b>End Date</b>", body_style),
        Paragraph("<b>Duration (Years)</b>", body_style)
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
        from backend.app.astrology.yoga_detection import analyze_all_chart_yogas
        yoga_analysis = analyze_all_chart_yogas(chart_data)
        detected_yogas = yoga_analysis.get("detected_yogas", [])
        kuja_info = yoga_analysis.get("kuja_dosha", {})
        sade_sati_info = yoga_analysis.get("sade_sati", {})

        if detected_yogas:
            elements.append(Spacer(1, 10))
            elements.append(Paragraph("Detected Classical Yogas (शास्त्रीय योग)", h2_style))
            yoga_rows = [[
                Paragraph("<b>Yoga Name</b>", body_style),
                Paragraph("<b>Category</b>", body_style),
                Paragraph("<b>Planets Involved</b>", body_style),
                Paragraph("<b>Classical Influence & Strength</b>", body_style)
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
        elements.append(Paragraph("Authentic Classical Remedial Guidance (शास्त्रीय उपाय)", h2_style))
        remedy_rows = [
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
        "Disclaimer: This report is generated by AstroAI Agent using Swiss Ephemeris astronomical calculations "
        "and classical Vedic astrological principles. It is intended for educational, philosophical, and personal contemplation.",
        disclaimer_style
    ))

    # Build PDF
    doc.build(elements)
    logger.info(f"Successfully generated PDF report at {pdf_path}")
    return str(pdf_path)
