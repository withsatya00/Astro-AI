const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const brainDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';

  // Helper to convert frontend assets directly to Base64 Data URI
  const toBase64 = (relPath) => {
    const absPath = path.resolve(__dirname, '..', 'website', 'frontend', relPath);
    if (fs.existsSync(absPath)) {
      const ext = path.extname(absPath).slice(1).toLowerCase();
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'webp' ? 'image/webp' : (ext === 'svg' ? 'image/svg+xml' : `image/${ext}`));
      return `data:${mime};base64,${fs.readFileSync(absPath).toString('base64')}`;
    }
    console.warn('File not found for base64:', absPath);
    return '';
  };

  const imgRameshwar = toBase64('assets/portraits/pt-rameshwar-dwivedi.jpg');
  const imgKnRao = toBase64('assets/portraits/acharya-kn-rao.jpg');
  const imgSunita = toBase64('assets/portraits/vidushi-sunita-sharma.jpg');
  const imgSomnath = toBase64('assets/img/temples/somnath-jyotirlinga-gujarat.webp') || toBase64('assets/img/temples/somnath-jyotirlinga-gujarat.jpg');
  const imgKedarnath = toBase64('assets/img/temples/kedarnath-dham-uttarakhand.webp') || toBase64('assets/img/temples/kedarnath-dham-uttarakhand.jpg');
  const imgRudraksha = toBase64('assets/img/products/rudraksha-5.jpg');
  const imgShankh = toBase64('assets/img/products/shankh.jpg');
  const imgShivling = toBase64('assets/img/products/parad-shivling.jpg');
  const imgEmerald = toBase64('assets/img/products/emerald.jpg');

  const mockupHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Post-Implementation UI Preview - Astro Jyotish</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', 'Noto Sans Devanagari', sans-serif;
      background: #FAF7F2;
      color: #1E1B4B;
      padding: 40px 24px;
    }
    .preview-container {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 56px;
    }
    .hero-banner {
      background: linear-gradient(135deg, #3E0B18 0%, #20040B 100%);
      color: #FFFDF8;
      border-radius: 24px;
      padding: 36px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 12px 36px rgba(62,11,24,0.18);
      border: 1px solid rgba(217,164,65,0.3);
    }
    .hero-title {
      font-family: 'Cinzel', serif;
      font-size: 32px;
      font-weight: 800;
      color: #F8D882;
      margin-bottom: 8px;
      letter-spacing: 0.03em;
    }
    .hero-subtitle {
      font-size: 15px;
      color: #E2E8F0;
      line-height: 1.5;
      max-width: 750px;
    }
    .hero-tag {
      background: #D9A441;
      color: #1E1B4B;
      font-weight: 800;
      font-size: 12px;
      padding: 8px 18px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .section-header {
      border-bottom: 2px solid #EADBCA;
      padding-bottom: 14px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-title {
      font-family: 'Cinzel', serif;
      font-size: 22px;
      font-weight: 700;
      color: #3E0B18;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-badge {
      background: #3E0B18;
      color: #F8D882;
      font-size: 11px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Grid 1: Astrologer Cards */
    .astro-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    .astro-card {
      background: #FFFFFF;
      border: 1.5px solid #E7E2D8;
      border-radius: 24px;
      padding: 22px;
      box-shadow: 0 4px 20px rgba(62, 11, 24, 0.06);
      transition: all 0.3s ease;
      position: relative;
    }
    .status-ribbon {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .status-ribbon.online {
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }
    .status-ribbon.busy {
      background: #FFFBEB;
      color: #92400E;
      border: 1px solid #FDE68A;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.35);
    }
    .pulse-dot.busy {
      background: #F59E0B;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.35);
    }
    .card-top {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
    }
    .avatar-wrapper {
      position: relative;
      width: 68px;
      height: 68px;
      flex-shrink: 0;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 2.5px solid #D9A441;
      display: block;
    }
    .verified-tick {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      background: #2563EB;
      color: #fff;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #fff;
    }
    .astro-info h3 {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      color: #3E0B18;
      margin-bottom: 3px;
    }
    .astro-spec {
      font-size: 12px;
      color: #64748B;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .rating-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #92400E;
      font-weight: 700;
    }
    .audio-sample-btn {
      background: #FFFDF8;
      border: 1px dashed #D9A441;
      border-radius: 12px;
      padding: 9px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      margin-bottom: 14px;
      font-size: 12px;
      color: #78350F;
      font-weight: 600;
    }
    .audio-wave {
      display: flex;
      align-items: center;
      gap: 2.5px;
    }
    .wave-bar {
      width: 3px;
      background: #D9A441;
      border-radius: 999px;
    }
    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 18px;
    }
    .tag-chip {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      padding: 4px 9px;
      border-radius: 6px;
      font-size: 11px;
      color: #475569;
      font-weight: 500;
    }
    .card-footer {
      border-top: 1px solid #F1ECE4;
      padding-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .price-wrap {
      display: flex;
      flex-direction: column;
    }
    .price-val {
      font-size: 18px;
      font-weight: 800;
      color: #3E0B18;
    }
    .price-offer {
      font-size: 10px;
      color: #059669;
      font-weight: 700;
    }
    .action-btn-group {
      display: flex;
      gap: 8px;
    }
    .call-btn {
      background: #F0FDF4;
      color: #166534;
      border: 1.5px solid #86EFAC;
      border-radius: 12px;
      padding: 9px 16px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .chat-btn {
      background: linear-gradient(135deg, #3E0B18 0%, #5B1324 100%);
      color: #FFFDF8;
      border: none;
      border-radius: 12px;
      padding: 9px 18px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 4px 12px rgba(62, 11, 24, 0.2);
    }

    /* Grid 2: Mandir Seva */
    .mandir-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 28px;
    }
    .mandir-card {
      background: #FFFFFF;
      border: 1.5px solid #E7E2D8;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 6px 24px rgba(62, 11, 24, 0.08);
    }
    .mandir-media-wrap {
      position: relative;
      height: 230px;
      overflow: hidden;
    }
    .mandir-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .mandir-countdown {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(180deg, transparent 0%, rgba(32, 4, 11, 0.95) 100%);
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #FFFDF8;
      font-size: 12px;
    }
    .countdown-timer {
      font-family: monospace;
      font-weight: 800;
      color: #F8D882;
      font-size: 15px;
      letter-spacing: 0.05em;
    }
    .mandir-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .mandir-title {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: #1E1B4B;
    }
    .mandir-loc {
      font-size: 12px;
      color: #64748B;
      font-weight: 500;
    }
    .progress-box {
      background: #FAF7F2;
      border: 1px solid #EADBCA;
      border-radius: 14px;
      padding: 12px 14px;
    }
    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #3E0B18;
    }
    .progress-bar-bg {
      height: 8px;
      border-radius: 999px;
      background: #EADBCA;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #D9A441 0%, #B45309 100%);
      border-radius: 999px;
    }
    .proof-guarantee-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #065F46;
      background: #ECFDF5;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid #A7F3D0;
    }

    /* Grid 3: Astro Mall */
    .mall-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    .mall-card {
      background: #FFFFFF;
      border: 1.5px solid #E7E2D8;
      border-radius: 24px;
      overflow: hidden;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(62, 11, 24, 0.06);
    }
    .mall-img-wrap {
      position: relative;
      height: 200px;
      border-radius: 18px;
      overflow: hidden;
      margin-bottom: 14px;
      background: #FAF7F2;
    }
    .mall-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .cert-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: #FFFDF8;
      border: 1px solid #D9A441;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 10.5px;
      font-weight: 800;
      color: #3E0B18;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .mall-title {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      font-weight: 700;
      color: #1E1B4B;
      margin-bottom: 6px;
    }
    .energized-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #B45309;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .mall-buy-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #D9A441 0%, #B3832B 100%);
      color: #1E1B4B;
      border: none;
      border-radius: 12px;
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
    }

    /* Section 4: Live Consultation App Showcase */
    .chat-showcase-box {
      background: #FFFFFF;
      border: 1.5px solid #E7E2D8;
      border-radius: 28px;
      box-shadow: 0 10px 30px rgba(62,11,24,0.08);
      overflow: hidden;
    }
    .chat-mock-header {
      background: #FFF;
      border-bottom: 1px solid #E7E2D8;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .chat-mock-body {
      padding: 24px;
      background: #FAF7F2;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 240px;
    }
    .mock-bubble-astro {
      background: #FFFFFF;
      border: 1px solid #EADBCA;
      border-radius: 16px 16px 16px 4px;
      padding: 14px 18px;
      font-size: 13.5px;
      line-height: 1.6;
      color: #1E1B4B;
      max-width: 620px;
      box-shadow: 0 2px 8px rgba(62,11,24,0.03);
    }
    .mock-prescription-card {
      background: linear-gradient(135deg, #FFFDF8 0%, #FDF7EB 100%);
      border: 1.5px solid #D9A441;
      border-radius: 18px;
      padding: 18px;
      max-width: 580px;
      box-shadow: 0 4px 16px rgba(217, 164, 65, 0.15);
    }
    .mock-input-bar {
      background: #FFF;
      border-top: 1px solid #E7E2D8;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mock-input-field {
      flex: 1;
      background: #F8FAFC;
      border: 1.5px solid #E2E8F0;
      border-radius: 999px;
      padding: 10px 18px;
      font-size: 13px;
      color: #64748B;
    }
    @media (max-width: 900px) {
      .astro-grid, .mandir-grid, .mall-grid {
        grid-template-columns: 1fr;
      }
      .hero-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="preview-container">

    <!-- Top Showcase Banner -->
    <div class="hero-banner">
      <div>
        <div class="hero-title">Astro Jyotish — UI Modernization Showcase</div>
        <p class="hero-subtitle">Visual demonstration of the proposed professional upgrades: Live dynamic astrologer status, audio bio previews, sacred puja urgency countdowns, devotee slot tracking, and in-chat Vedic remedies.</p>
      </div>
      <div class="hero-tag">✨ Recommended V2 Design</div>
    </div>
    
    <!-- 1. Astrologer Directory Enhancements -->
    <section>
      <div class="section-header">
        <h2 class="section-title">
          <span>🔮</span> 1. High-Converting Astrologer Directory & Live Cards
        </h2>
        <span class="section-badge">Live Status & Voice Bio</span>
      </div>
      <div class="astro-grid">
        <!-- Card 1: Online -->
        <div class="astro-card">
          <div>
            <div class="status-ribbon online">
              <span class="pulse-dot"></span> Available Now (0m wait)
            </div>
          </div>
          <div class="card-top">
            <div class="avatar-wrapper">
              <img src="${imgRameshwar}" class="avatar-img" alt="Pt. Rameshwar">
              <span class="verified-tick">✓</span>
            </div>
            <div class="astro-info">
              <h3>Pt. Rameshwar Dwivedi</h3>
              <p class="astro-spec">Senior Vedic Jyotish & Karmakand</p>
              <div class="rating-row">
                <span>★ 4.9 (2,850+ reviews)</span>
                <span>• 25+ Yrs</span>
              </div>
            </div>
          </div>
          <div class="audio-sample-btn">
            <span>🎙️ Listen to Voice Bio (30s)</span>
            <div class="audio-wave">
              <span class="wave-bar" style="height: 6px;"></span>
              <span class="wave-bar" style="height: 12px;"></span>
              <span class="wave-bar" style="height: 8px;"></span>
              <span class="wave-bar" style="height: 14px;"></span>
              <span class="wave-bar" style="height: 9px;"></span>
            </div>
          </div>
          <div class="tags-row">
            <span class="tag-chip">Kundli Milan</span>
            <span class="tag-chip">Career Growth</span>
            <span class="tag-chip">Vedic Remedies</span>
          </div>
          <div class="card-footer">
            <div class="price-wrap">
              <span class="price-val">₹35<small style="font-size:11px;font-weight:500;">/min</small></span>
              <span class="price-offer">First 5 Mins Free (Code: FREE5)</span>
            </div>
            <div class="action-btn-group">
              <button class="call-btn">📞 Call</button>
              <button class="chat-btn">💬 Chat</button>
            </div>
          </div>
        </div>

        <!-- Card 2: Busy in Call -->
        <div class="astro-card">
          <div>
            <div class="status-ribbon busy">
              <span class="pulse-dot busy"></span> In Consultation (Next: ~3 min)
            </div>
          </div>
          <div class="card-top">
            <div class="avatar-wrapper">
              <img src="${imgKnRao}" class="avatar-img" alt="Acharya KN Rao">
              <span class="verified-tick">✓</span>
            </div>
            <div class="astro-info">
              <h3>Acharya K.N. Rao Ji</h3>
              <p class="astro-spec">Shani Dasha & Financial Astrologer</p>
              <div class="rating-row">
                <span>★ 4.85 (2,100+ reviews)</span>
                <span>• 20+ Yrs</span>
              </div>
            </div>
          </div>
          <div class="audio-sample-btn">
            <span>🎙️ Listen to Voice Bio (30s)</span>
            <div class="audio-wave">
              <span class="wave-bar" style="height: 10px;"></span>
              <span class="wave-bar" style="height: 6px;"></span>
              <span class="wave-bar" style="height: 13px;"></span>
              <span class="wave-bar" style="height: 7px;"></span>
            </div>
          </div>
          <div class="tags-row">
            <span class="tag-chip">Shani Sade Sati</span>
            <span class="tag-chip">Business Finance</span>
            <span class="tag-chip">Dhan Yoga</span>
          </div>
          <div class="card-footer">
            <div class="price-wrap">
              <span class="price-val">₹51<small style="font-size:11px;font-weight:500;">/min</small></span>
              <span class="price-offer">100% Satisfaction Guarantee</span>
            </div>
            <div class="action-btn-group">
              <button class="chat-btn" style="background:#B45309;">🔔 Notify Me</button>
            </div>
          </div>
        </div>

        <!-- Card 3: Online Scholar -->
        <div class="astro-card">
          <div>
            <div class="status-ribbon online">
              <span class="pulse-dot"></span> Available Now (0m wait)
            </div>
          </div>
          <div class="card-top">
            <div class="avatar-wrapper">
              <img src="${imgSunita}" class="avatar-img" alt="Vidushi Sunita">
              <span class="verified-tick">✓</span>
            </div>
            <div class="astro-info">
              <h3>Vidushi Sunita Sharma</h3>
              <p class="astro-spec">Tarot Grandmaster & Relationship Guide</p>
              <div class="rating-row">
                <span>★ 4.95 (1,530+ reviews)</span>
                <span>• 16+ Yrs</span>
              </div>
            </div>
          </div>
          <div class="audio-sample-btn">
            <span>🎙️ Listen to Voice Bio (30s)</span>
            <div class="audio-wave">
              <span class="wave-bar" style="height: 8px;"></span>
              <span class="wave-bar" style="height: 14px;"></span>
              <span class="wave-bar" style="height: 11px;"></span>
              <span class="wave-bar" style="height: 6px;"></span>
            </div>
          </div>
          <div class="tags-row">
            <span class="tag-chip">Love & Marriage</span>
            <span class="tag-chip">Tarot Reading</span>
            <span class="tag-chip">Numerology</span>
          </div>
          <div class="card-footer">
            <div class="price-wrap">
              <span class="price-val">₹45<small style="font-size:11px;font-weight:500;">/min</small></span>
              <span class="price-offer">First 5 Mins Free (Code: FREE5)</span>
            </div>
            <div class="action-btn-group">
              <button class="call-btn">📞 Call</button>
              <button class="chat-btn">💬 Chat</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Mandir Seva with Live Countdown & Progress -->
    <section>
      <div class="section-header">
        <h2 class="section-title">
          <span>🛕</span> 2. Mandir Seva with Urgency Countdown & Slot Tracker
        </h2>
        <span class="section-badge">High Conversion Urgency</span>
      </div>
      <div class="mandir-grid">
        <!-- Event 1: Somnath -->
        <div class="mandir-card">
          <div class="mandir-media-wrap">
            <img src="${imgSomnath}" class="mandir-img" alt="Somnath Jyotirlinga">
            <div class="mandir-countdown">
              <span>⏳ Registration Closes In:</span>
              <span class="countdown-timer">04h : 18m : 42s</span>
            </div>
          </div>
          <div class="mandir-body">
            <div>
              <span style="font-size:11px;font-weight:800;color:#B45309;text-transform:uppercase;letter-spacing:0.05em;">🔱 FIRST JYOTIRLINGA • SPECIAL SANKALP</span>
              <h3 class="mandir-title">Maha Rudrabhishek & Bilva Patra Archana</h3>
              <p class="mandir-loc">📍 Shri Somnath Jyotirlinga, Prabhas Patan, Gujarat</p>
            </div>
            <div class="progress-box">
              <div class="progress-labels">
                <span>🔥 86 / 100 Sankalp Slots Booked</span>
                <span style="color:#B45309;">Only 14 Slots Left</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width:86%;"></div>
              </div>
            </div>
            <div class="proof-guarantee-pill">
              <span>📹</span>
              <span><strong>Guaranteed Video Proof:</strong> High-definition video of your sankalp with name & gotra.</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;">
              <div>
                <span style="font-size:11px;color:#64748B;">Starts From</span>
                <div style="font-size:20px;font-weight:800;color:#3E0B18;">₹251</div>
              </div>
              <button class="chat-btn" style="padding:12px 24px;font-size:13px;">Book Sankalp Puja →</button>
            </div>
          </div>
        </div>

        <!-- Event 2: Kedarnath -->
        <div class="mandir-card">
          <div class="mandir-media-wrap">
            <img src="${imgKedarnath}" class="mandir-img" alt="Kedarnath Dham">
            <div class="mandir-countdown">
              <span>⏳ Registration Closes In:</span>
              <span class="countdown-timer">18h : 45m : 10s</span>
            </div>
          </div>
          <div class="mandir-body">
            <div>
              <span style="font-size:11px;font-weight:800;color:#B45309;text-transform:uppercase;letter-spacing:0.05em;">🔥 MAHA YAGYA • AKHAND HAVAN</span>
              <h3 class="mandir-title">Akhand Mahamrityunjaya Jaap & Havan</h3>
              <p class="mandir-loc">📍 Shri Kedarnath Dham, Rudraprayag, Uttarakhand</p>
            </div>
            <div class="progress-box">
              <div class="progress-labels">
                <span>🔥 92 / 100 Sankalp Slots Booked</span>
                <span style="color:#B45309;">Only 8 Slots Left</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width:92%;"></div>
              </div>
            </div>
            <div class="proof-guarantee-pill">
              <span>📹</span>
              <span><strong>Guaranteed Video Proof:</strong> Consecrated Bhasma and Prasad sent to your address.</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;">
              <div>
                <span style="font-size:11px;color:#64748B;">Starts From</span>
                <div style="font-size:20px;font-weight:800;color:#3E0B18;">₹501</div>
              </div>
              <button class="chat-btn" style="padding:12px 24px;font-size:13px;">Book Sankalp Puja →</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Astro Mall with Certified Badges -->
    <section>
      <div class="section-header">
        <h2 class="section-title">
          <span>💎</span> 3. Astro Mall with Govt. Lab Certification & Vedic Energization
        </h2>
        <span class="section-badge">100% Genuine Lab Certified</span>
      </div>
      <div class="mall-grid">
        <div class="mall-card">
          <div class="mall-img-wrap">
            <img src="${imgRudraksha}" class="mall-img" alt="Rudraksha">
            <div class="cert-badge">
              <span>🛡️</span> GOVT. LAB CERTIFIED
            </div>
          </div>
          <h4 class="mall-title">Natural 5-Mukhi Rudraksha (Nepal)</h4>
          <div class="energized-row">
            <span>✨ Energized by Kashi Priests</span>
            <span>• Free Ganga Jal</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:18px;font-weight:800;color:#3E0B18;">₹699 <s style="font-size:12px;color:#94A3B8;font-weight:normal;">₹999</s></span>
            <span style="background:#ECFDF5;color:#065F46;font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px;">30% OFF</span>
          </div>
          <button class="mall-buy-btn">Add to Cart • Instant Dispatch →</button>
        </div>

        <div class="mall-card">
          <div class="mall-img-wrap">
            <img src="${imgShankh}" class="mall-img" alt="Dakshinavarti Shankh">
            <div class="cert-badge">
              <span>🛡️</span> AUTHENTIC CONCH
            </div>
          </div>
          <h4 class="mall-title">Sacred Dakshinavarti Lakshmi Shankh</h4>
          <div class="energized-row">
            <span>✨ Consecrated for Dhan Vriddhi</span>
            <span>• Silk Pouch</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:18px;font-weight:800;color:#3E0B18;">₹1,199 <s style="font-size:12px;color:#94A3B8;font-weight:normal;">₹1,599</s></span>
            <span style="background:#ECFDF5;color:#065F46;font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px;">25% OFF</span>
          </div>
          <button class="mall-buy-btn">Add to Cart • Instant Dispatch →</button>
        </div>

        <div class="mall-card">
          <div class="mall-img-wrap">
            <img src="${imgShivling}" class="mall-img" alt="Parad Shivling">
            <div class="cert-badge">
              <span>🛡️</span> 100% PURE MERCURY
            </div>
          </div>
          <h4 class="mall-title">Siddh Parad (Mercury) Shivling</h4>
          <div class="energized-row">
            <span>✨ Certified Sanskarit Parad</span>
            <span>• Puja Vidhi Book</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:18px;font-weight:800;color:#3E0B18;">₹1,499 <s style="font-size:12px;color:#94A3B8;font-weight:normal;">₹2,100</s></span>
            <span style="background:#ECFDF5;color:#065F46;font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px;">28% OFF</span>
          </div>
          <button class="mall-buy-btn">Add to Cart • Instant Dispatch →</button>
        </div>
      </div>
    </section>

    <!-- 4. Consultation Room Experience with Remedy Card -->
    <section>
      <div class="section-header">
        <h2 class="section-title">
          <span>💬</span> 4. Interactive Live Consultation Room with Remedy Drawer
        </h2>
        <span class="section-badge">Full-Screen Focus App</span>
      </div>
      <div class="chat-showcase-box">
        <div class="chat-mock-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:50%;overflow:hidden;border:2px solid #D9A441;flex-shrink:0;">
              <img src="${imgRameshwar}" style="width:100%;height:100%;object-fit:cover;" alt="Avatar">
            </div>
            <div>
              <strong style="font-size:15px;color:#1E1B4B;display:block;">Pt. Rameshwar Dwivedi <span style="color:#2563EB;">✓</span></strong>
              <small style="color:#059669;font-weight:600;">● Active Consultation • ₹35/min</small>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46;font-size:12px;font-weight:700;padding:6px 14px;border-radius:999px;">🟢 Live: 04:22</span>
            <span style="background:#FFFBEB;border:1px solid #FDE68A;color:#92400E;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;">🪙 ₹180</span>
            <button class="call-btn" style="padding:7px 16px;">📞 Audio Call</button>
          </div>
        </div>
        <div class="chat-mock-body">
          <div class="mock-bubble-astro">
            <strong>Pt. Rameshwar Dwivedi:</strong><br>
            आपकी कुंडली में शनि देव की साढ़ेसाती का प्रभाव कर्म स्थान पर पड़ रहा है। इसके निवारण हेतु हमने आपके लिए विशेष वैदिक उपाय निर्धारित किया है। नीचे दिए गए उपाय का नियमित पालन करें।
          </div>

          <!-- Prescription Card Inside Chat -->
          <div class="mock-prescription-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:11px;font-weight:800;color:#B45309;text-transform:uppercase;">📜 VEDIC REMEDY PRESCRIPTION</span>
              <span style="font-size:10px;background:#ECFDF5;color:#065F46;padding:2px 8px;border-radius:4px;font-weight:700;">AUTHENTIC SHASTRA</span>
            </div>
            <h5 style="font-size:14.5px;font-weight:700;color:#3E0B18;margin-bottom:6px;">शनि तैलाभिषेक एवं नीला पुखराज (Amethyst) उपाय</h5>
            <p style="font-size:12.5px;color:#475569;margin-bottom:12px;line-height:1.5;">नित्य शनिवार सायंकाल पीपल के नीचे तिल के तेल का दीपक एवं 108 बार <i>'ॐ शं शनैश्चराय नमः'</i> का जप करें।</p>
            <div style="display:flex;gap:10px;">
              <button class="chat-btn" style="padding:8px 16px;font-size:12px;">Book Shani Puja (₹151) →</button>
              <button class="call-btn" style="padding:8px 16px;font-size:12px;">Save to Profile</button>
            </div>
          </div>
        </div>
        <div class="mock-input-bar">
          <span style="font-size:20px;cursor:pointer;">📎</span>
          <div class="mock-input-field">✦ Type your reply or birth details here (Press Enter to send)...</div>
          <button class="chat-btn" style="padding:10px 22px;">Send ↑</button>
        </div>
      </div>
    </section>

  </div>
</body>
</html>
  `;

  const mockupFilePath = path.join(__dirname, 'mockup_preview.html');
  fs.writeFileSync(mockupFilePath, mockupHtml, 'utf8');

  // Desktop captures
  const page = await browser.newPage({ viewport: { width: 1440, height: 2600 } });
  await page.goto('file:///' + mockupFilePath.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.waitForTimeout(600);

  // Full length preview
  await page.screenshot({
    path: `${brainDir}/post_implementation_full_preview.png`,
    fullPage: true,
  });

  // Section 1: Astrologers
  const astroSection = await page.$('section:nth-of-type(1)');
  if (astroSection) {
    await astroSection.screenshot({ path: `${brainDir}/preview_astrologers_enhanced.png` });
  }

  // Section 2: Mandir Seva
  const mandirSection = await page.$('section:nth-of-type(2)');
  if (mandirSection) {
    await mandirSection.screenshot({ path: `${brainDir}/preview_mandir_urgency_countdown.png` });
  }

  // Section 3: Astro Mall
  const mallSection = await page.$('section:nth-of-type(3)');
  if (mallSection) {
    await mallSection.screenshot({ path: `${brainDir}/preview_mall_certified.png` });
  }

  // Section 4: Chatroom with Prescription Card
  const chatSection = await page.$('section:nth-of-type(4)');
  if (chatSection) {
    await chatSection.screenshot({ path: `${brainDir}/preview_chatroom_remedy.png` });
  }

  // Mobile preview
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('file:///' + mockupFilePath.replace(/\\/g, '/'), { waitUntil: 'load' });
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({
    path: `${brainDir}/preview_mobile_enhanced.png`,
    fullPage: false,
  });

  console.log('Post-implementation high-res screenshots created successfully with base64 assets!');
  await browser.close();
})();
