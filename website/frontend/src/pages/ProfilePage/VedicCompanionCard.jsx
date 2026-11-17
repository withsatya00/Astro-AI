import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ALL_RASHIS = [
  { eng: 'Aries', hi: 'मेष', lord: 'Mars (मंगल)' },
  { eng: 'Taurus', hi: 'वृषभ', lord: 'Venus (शुक्र)' },
  { eng: 'Gemini', hi: 'मिथुन', lord: 'Mercury (बुध)' },
  { eng: 'Cancer', hi: 'कर्क', lord: 'Moon (चन्द्र)' },
  { eng: 'Leo', hi: 'सिंह', lord: 'Sun (सूर्य)' },
  { eng: 'Virgo', hi: 'कन्या', lord: 'Mercury (बुध)' },
  { eng: 'Libra', hi: 'तुला', lord: 'Venus (शुक्र)' },
  { eng: 'Scorpio', hi: 'वृश्चिक', lord: 'Mars (मंगल)' },
  { eng: 'Sagittarius', hi: 'धनु', lord: 'Jupiter (गुरु)' },
  { eng: 'Capricorn', hi: 'मकर', lord: 'Saturn (शनि)' },
  { eng: 'Aquarius', hi: 'कुम्भ', lord: 'Saturn (शनि)' },
  { eng: 'Pisces', hi: 'मीन', lord: 'Jupiter (गुरु)' }
];

export default function VedicCompanionCard({ userRashi, userPhone }) {
  const [channel, setChannel] = useState('whatsapp'); // whatsapp | telegram | push
  const [deliveryTime, setDeliveryTime] = useState('05:30');
  const [phoneOrHandle, setPhoneOrHandle] = useState(userPhone || '+919876543210');
  const [selectedRashi, setSelectedRashi] = useState(userRashi || 'Leo');
  const [isActive, setIsActive] = useState(true);

  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState('');
  const [testSent, setTestSent] = useState(false);

  // Fetch initial preferences from server
  useEffect(() => {
    const token = localStorage.getItem('astro_access_token');
    fetch('/api/v1/companion/preferences', {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.channel) setChannel(data.channel);
          if (data.delivery_time) setDeliveryTime(data.delivery_time);
          if (data.phone_or_handle && data.phone_or_handle !== '+919876543210') setPhoneOrHandle(data.phone_or_handle);
          if (data.is_active !== undefined) setIsActive(data.is_active);
          if (data.rashi) setSelectedRashi(data.rashi);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch digest preview whenever rashi changes
  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/companion/digest/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rashi: selectedRashi, language: 'hi' })
    })
      .then((r) => r.json())
      .then((data) => {
        setDigest(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedRashi]);

  const handleSave = async () => {
    setSaving(true);
    setSaveToast('');
    try {
      const token = localStorage.getItem('astro_access_token');
      const res = await fetch('/api/v1/companion/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          channel,
          phone_or_handle: phoneOrHandle,
          delivery_time: deliveryTime,
          language: 'hi',
          rashi: selectedRashi,
          is_active: isActive
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveToast('✓ आपकी प्राथमिकताएं सहेज ली गईं! प्रतिदिन प्रातः संदेश प्राप्त होगा।');
        setTimeout(() => setSaveToast(''), 4000);
      }
    } catch {
      setSaveToast('⚠️ सहेजने में त्रुटि आई, पुनः प्रयास करें।');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setTestSent(false);
    try {
      const token = localStorage.getItem('astro_access_token');
      const res = await fetch('/api/v1/companion/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ rashi: selectedRashi, language: 'hi' })
      });
      const data = await res.json();
      if (data.success) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 5000);
      }
    } catch {}
  };

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 24, border: '1px solid #E6D7BE',
      padding: '28px 24px', boxShadow: '0 8px 30px rgba(62,11,24,0.04)',
      margin: '0 0 28px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(212,175,55,0.12)', border: '1px solid #D4AF37', color: '#720720', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
            <span>🕉️</span> <span>PROACTIVE VEDIC COMPANION</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#3E0B18', fontFamily: 'serif' }}>
            दैनिक वैदिक साथी (WhatsApp & Telegram Brahmamuhurta Companion)
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>
            प्रतिदिन प्रातः ब्रह्ममुहूर्त में आपके <strong>इष्ट देव का मंत्र</strong>, <strong>अभिजीत मुहूर्त</strong> व <strong>सटीक ग्रह गोचर</strong> सीधे आपके फोन पर।
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            style={{
              padding: '8px 18px', borderRadius: 999, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.2s',
              background: isActive ? '#059669' : '#E2E8F0',
              color: isActive ? '#FFFFFF' : '#64748B',
              border: 'none', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <span>{isActive ? '🟢 सेवा सक्रिय' : '⚪ सेवा रोकी गई'}</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Settings Left, WhatsApp Mockup Right */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24, alignItems: 'start'
      }}>
        {/* Left: Preferences Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 1. Channel Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
              प्राथमिक संदेश माध्यम (Delivery Channel)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { id: 'whatsapp', label: 'WhatsApp', icon: '🟢' },
                { id: 'telegram', label: 'Telegram', icon: '🔵' },
                { id: 'push', label: 'Web Push', icon: '🔔' }
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setChannel(ch.id)}
                  style={{
                    padding: '10px 8px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                    background: channel === ch.id ? '#3E0B18' : '#FAF7F2',
                    color: channel === ch.id ? '#F8D882' : '#334155',
                    border: channel === ch.id ? '1.5px solid #D4AF37' : '1px solid #E2E8F0'
                  }}
                >
                  <span style={{ marginRight: 4 }}>{ch.icon}</span> {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Destination Number / Handle */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              {channel === 'telegram' ? 'टेलीग्राम यूजरनेम (@handle)' : 'व्हाट्सएप मोबाइल नंबर (WhatsApp Number)'}
            </label>
            <input
              type="text"
              value={phoneOrHandle}
              onChange={(e) => setPhoneOrHandle(e.target.value)}
              placeholder={channel === 'telegram' ? '@username' : '+91 98765 43210'}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #CBD5E1',
                fontSize: 14, fontFamily: 'monospace', color: '#1E293B', background: '#F8FAFC'
              }}
            />
          </div>

          {/* 3. Delivery Time Slot */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
              दैनिक आगमन समय (Preferred Time Slot)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: '05:30', title: '05:30 AM', sub: 'ब्रह्ममुहूर्त (सर्वोत्तम)' },
                { id: '07:00', title: '07:00 AM', sub: 'प्रातःकाल (सूर्योदय)' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDeliveryTime(t.id)}
                  style={{
                    padding: '10px 12px', borderRadius: 12, fontSize: 13, textAlign: 'left',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: deliveryTime === t.id ? '#FAF5EB' : '#FFFFFF',
                    border: deliveryTime === t.id ? '1.5px solid #D4AF37' : '1px solid #E2E8F0',
                    color: deliveryTime === t.id ? '#720720' : '#475569'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: 14 }}>{t.title}</strong>
                  <span style={{ fontSize: 11, opacity: 0.85 }}>{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Moon Sign (Rashi) Sync */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              आपकी चंद्र राशि (Moon Sign for Daily Ishta Sadhana)
            </label>
            <select
              value={selectedRashi}
              onChange={(e) => setSelectedRashi(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #CBD5E1',
                fontSize: 14, color: '#1E293B', background: '#FFFFFF'
              }}
            >
              {ALL_RASHIS.map((r) => (
                <option key={r.eng} value={r.eng}>
                  {r.eng} ({r.hi}) · स्वामी: {r.lord}
                </option>
              ))}
            </select>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '12px 18px', borderRadius: 999, fontWeight: 800, fontSize: 13.5,
                background: '#3E0B18', color: '#F8D882', border: '1px solid #D4AF37',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(62,11,24,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <span>{saving ? 'सहेज रहे हैं…' : '💾 प्राथमिकताएं सहेजें'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendTest}
              style={{
                padding: '12px 18px', borderRadius: 999, fontWeight: 800, fontSize: 13,
                background: '#10B981', color: '#FFFFFF', border: 'none',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <span>📲 टेस्ट भेजें</span>
            </button>
          </div>

          {saveToast && (
            <div style={{ padding: '8px 14px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: 13, fontWeight: 700 }}>
              {saveToast}
            </div>
          )}

          {testSent && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓</span> <span>सफलतापूर्वक प्रेषित! आपके WhatsApp पर टेस्ट सन्देश डिलीवर हुआ।</span>
            </div>
          )}
        </div>

        {/* Right: Live Realistic WhatsApp Chat Mockup */}
        <div style={{
          background: '#0B141A', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,0.18)', border: '1px solid #2A3942'
        }}>
          {/* WhatsApp Chat Top Header */}
          <div style={{
            background: '#1F2C34', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: '1px solid #2A3942'
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#3E0B18', border: '1.5px solid #D4AF37',
              display: 'grid', placeItems: 'center', fontSize: 18, color: '#F8D882'
            }}>
              🕉️
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#E9EDEF', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Astro Jyotish वैदिक साथी
                </span>
                <span style={{ color: '#25D366', fontSize: 12 }}>✓</span>
              </div>
              <small style={{ color: '#8696A0', fontSize: 11 }}>प्रतिदिन {deliveryTime} AM · आधिकारिक चैनल</small>
            </div>
            <span style={{ color: '#8696A0', fontSize: 16 }}>⋮</span>
          </div>

          {/* WhatsApp Chat Bubble Body */}
          <div style={{
            background: '#0B141A', backgroundImage: 'radial-gradient(#182229 1px, transparent 1px)',
            backgroundSize: '16px 16px', padding: '16px 14px', minHeight: 320
          }}>
            {loading ? (
              <div style={{ color: '#8696A0', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
                वैदिक पंचांग एवं गोचर गणना की जा रही है…
              </div>
            ) : digest ? (
              <div style={{
                background: '#005C4B', color: '#E9EDEF', borderRadius: '12px 12px 0 12px',
                padding: '12px 14px', maxWidth: '92%', marginLeft: 'auto',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)', fontSize: 13, lineHeight: 1.55,
                border: '1px solid #0E6B56'
              }}>
                <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 800, marginBottom: 4, letterSpacing: '0.04em' }}>
                  🕉️ SHUBH BRAHMAMUHURTA DIGEST
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#FFFDF9', marginBottom: 6 }}>
                  {digest.rashi_hindi} ({digest.rashi}) दैनिक वैदिक मार्गदर्शन
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px', margin: '8px 0', fontSize: 12 }}>
                  <div>📅 <strong>पंचांग:</strong> {digest.tithi} ({digest.paksha})</div>
                  <div>⭐ <strong>नक्षत्र:</strong> {digest.nakshatra} · <strong>योग:</strong> {digest.yoga}</div>
                  <div>⚡ <strong>अभिजीत मुहूर्त:</strong> <span style={{ color: '#86EFAC' }}>{digest.abhijit_muhurta}</span></div>
                </div>

                <div style={{ borderLeft: '3px solid #D4AF37', paddingLeft: 8, margin: '8px 0' }}>
                  <div style={{ fontSize: 11, color: '#FCD34D', fontWeight: 700 }}>📿 आज का इष्ट साधना मंत्र:</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: '2px 0' }}>
                    {digest.ishta_mantra}
                  </div>
                  <div style={{ fontSize: 11, color: '#D1D5DB' }}>
                    देवता: {digest.ishta_deity} · संख्या: {digest.ishta_count}
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: '#E5E7EB', marginTop: 8, lineHeight: 1.45 }}>
                  {digest.sadhana_guideline}
                </div>

                {/* Quick Link Pills inside WhatsApp Bubble */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
                  <Link
                    to="/bhakti/naam-jaap"
                    style={{
                      background: 'rgba(212,175,55,0.2)', border: '1px solid #D4AF37', color: '#FDE68A',
                      padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, textDecoration: 'none'
                    }}
                  >
                    📿 नाम जप
                  </Link>
                  <Link
                    to="/bhakti/aarti-chalisa"
                    style={{
                      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF',
                      padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, textDecoration: 'none'
                    }}
                  >
                    🕉️ दैनिक आरती
                  </Link>
                  <Link
                    to="/mandir-seva"
                    style={{
                      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF',
                      padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, textDecoration: 'none'
                    }}
                  >
                    🙏 संकल्प
                  </Link>
                </div>

                <div style={{ textAlign: 'right', marginTop: 6, fontSize: 10, color: '#8696A0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                  <span>{deliveryTime} AM</span>
                  <span style={{ color: '#53BDEB' }}>✓✓</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
