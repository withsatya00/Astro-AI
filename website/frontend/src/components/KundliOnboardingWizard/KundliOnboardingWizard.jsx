import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SAMPLE_CITIES = [
  { name: 'Varanasi (Kashi)', lat: 25.3176, lon: 82.9739 },
  { name: 'New Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Ayodhya', lat: 26.7922, lon: 82.1998 },
  { name: 'Ujjain', lat: 23.1765, lon: 75.7885 },
  { name: 'Haridwar', lat: 29.9457, lon: 78.1642 }
];

export default function KundliOnboardingWizard({ onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Form, 2 = Synthesis & Welcome Gift
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('आदित्य शर्मा');
  const [dob, setDob] = useState('1998-05-14');
  const [tob, setTob] = useState('07:30');
  const [cityIndex, setCityIndex] = useState(0);

  const [result, setResult] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const selectedCity = SAMPLE_CITIES[cityIndex] || SAMPLE_CITIES[0];

    try {
      const res = await fetch('/api/v1/calculators/onboarding-kundli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'जिज्ञासु भक्त',
          date_of_birth: dob,
          time_of_birth: tob ? `${tob}:00` : '12:00:00',
          city: selectedCity.name,
          latitude: selectedCity.lat,
          longitude: selectedCity.lon,
          timezone_offset: 5.5
        })
      });

      if (!res.ok) {
        throw new Error('कुंडली गणना में त्रुटि आई। कृपया विवरण जांचें।');
      }

      const data = await res.json();
      setResult(data);
      setStep(2);

      // Persist to localStorage for automatic profile & sadhana sync
      try {
        localStorage.setItem('astro_profile_rashi', `${data.moon_sign.sign} (${data.moon_sign.hindi})`);
        localStorage.setItem('astro_profile_ishta', data.ishta_devata.deity);
        localStorage.setItem('astro_welcome_voucher', JSON.stringify(data.welcome_voucher));
      } catch {}

      if (onComplete) onComplete(data);
    } catch (err) {
      setError(err.message || 'नेटवर्क समस्या आई, पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFFDF5 0%, #FAF5EB 100%)',
      borderRadius: 24, border: '1.5px solid #C49A3A',
      padding: '28px 24px', boxShadow: '0 12px 36px rgba(62, 11, 24, 0.08)',
      maxWidth: 820, margin: '24px auto'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 14px', borderRadius: 999, background: 'rgba(212,175,55,0.15)',
          border: '1px solid #D4AF37', color: '#164B32', fontSize: 11.5, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
        }}>
          <span>✦ त्वरित वैदिक जन्म-पत्रिका एवं इष्ट साधन ✦</span>
        </div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: 800, color: '#164B32', margin: '4px 0' }}>
          {step === 1 ? 'अपनी जन्म-पत्रिका बनाएं एवं ₹100 प्रथम परामर्श उपहार पाएं' : 'आपकी वैदिक कुंडली एवं इष्ट साधना का संश्लेषण'}
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#56675B', maxWidth: 600, margin: '0 auto', lineHeight: 1.5 }}>
          {step === 1
            ? 'सटीक स्विस एफिमरिस द्वारा लग्न, चंद्र राशि, वर्तमान महादशा व इष्ट देव का निर्धारण।'
            : `हरि ॐ ${result?.name || 'भक्त जी'}! आपकी जन्मकुंडली के प्रमुख वैदिक आयाम संकलित हैं:`}
        </p>
      </div>

      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 12, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#164B32', marginBottom: 4 }}>
                श्रद्धालु का नाम (Full Name)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="उदा. आदित्य शर्मा"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #C49A3A',
                  background: '#FFFFFF', fontSize: 14, color: '#183C2B'
                }}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#164B32', marginBottom: 4 }}>
                जन्म तिथि (Date of Birth)
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #C49A3A',
                  background: '#FFFFFF', fontSize: 14, color: '#183C2B'
                }}
              />
            </div>

            {/* Time of Birth */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#164B32', marginBottom: 4 }}>
                जन्म समय (Time of Birth)
              </label>
              <input
                type="time"
                required
                value={tob}
                onChange={(e) => setTob(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #C49A3A',
                  background: '#FFFFFF', fontSize: 14, color: '#183C2B'
                }}
              />
            </div>

            {/* City */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#164B32', marginBottom: 4 }}>
                जन्म स्थान (Birth City)
              </label>
              <select
                value={cityIndex}
                onChange={(e) => setCityIndex(Number(e.target.value))}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #C49A3A',
                  background: '#FFFFFF', fontSize: 14, color: '#183C2B'
                }}
              >
                {SAMPLE_CITIES.map((c, idx) => (
                  <option key={c.name} value={idx}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 36px', borderRadius: 999, border: 'none',
                background: 'linear-gradient(135deg, #164B32, #164B32)', color: '#C49A3A',
                fontSize: 15, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(62,11,24,0.3)', transition: 'all 0.2s',
                display: 'inline-flex', alignItems: 'center', gap: 8
              }}
            >
              <span>{loading ? 'गणना की जा रही है…' : '🌟 पत्रिका बनाएं एवं ₹100 वाउचर प्राप्त करें'}</span>
              <span>→</span>
            </button>
            <div style={{ fontSize: 11.5, color: '#56675B', marginTop: 8 }}>
              ✓ १००% निःशुल्क · कोई छिपा हुआ शुल्क नहीं · स्विस एफिमरिस द्वारा प्रमाणित
            </div>
          </div>
        </form>
      ) : result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Grid of Kundli Synthesized Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: 16, border: '1px solid #DDEBD5', textAlign: 'center' }}>
              <small style={{ color: '#56675B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>जन्म लग्न (Ascendant)</small>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 800, color: '#164B32', marginTop: 4 }}>
                {result.lagna.sign} लग्न ({result.lagna.degree}°)
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: 16, border: '1px solid #DDEBD5', textAlign: 'center' }}>
              <small style={{ color: '#56675B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>चंद्र राशि (Rashi & Lord)</small>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 800, color: '#164B32', marginTop: 4 }}>
                {result.moon_sign.hindi} ({result.moon_sign.sign})
              </div>
              <small style={{ color: '#D97706', fontSize: 11, fontWeight: 600 }}>स्वामी: {result.moon_sign.lord}</small>
            </div>

            <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: 16, border: '1px solid #DDEBD5', textAlign: 'center' }}>
              <small style={{ color: '#56675B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>जन्म नक्षत्र (Nakshatra)</small>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 800, color: '#164B32', marginTop: 4 }}>
                {result.nakshatra.name} (पद {result.nakshatra.pada})
              </div>
              <small style={{ color: '#4B5563', fontSize: 11 }}>स्वामी: {result.nakshatra.lord}</small>
            </div>

            <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: 16, border: '1px solid #DDEBD5', textAlign: 'center' }}>
              <small style={{ color: '#56675B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>सक्रिय महादशा (Dasha)</small>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 800, color: '#164B32', marginTop: 4 }}>
                {result.active_mahadasha.planet || 'गुरु (Jupiter)'}
              </div>
              <small style={{ color: '#059669', fontSize: 11, fontWeight: 700 }}>प्रभावी काल</small>
            </div>
          </div>

          {/* Ishta Devata & Sadhana Card */}
          <div style={{
            background: '#FAF5EA', padding: '18px 20px', borderRadius: 18,
            border: '1.5px solid #C49A3A', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 14
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#164B32', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                📿 आपकी जन्मकुंडली अनुसार इष्ट देव एवं नित्य साधना:
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 800, color: '#164B32', margin: '4px 0' }}>
                {result.ishta_devata.deity}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#B45309', fontFamily: 'monospace' }}>
                {result.ishta_devata.mantra}
              </div>
              <small style={{ color: '#56675B', fontSize: 11.5 }}>
                सुझाव: {result.ishta_devata.count} · मन में स्थिरता व सात्विक तेज हेतु।
              </small>
            </div>

            <Link
              to="/bhakti/naam-jaap"
              style={{
                padding: '10px 18px', borderRadius: 999, background: '#164B32',
                color: '#C49A3A', fontWeight: 800, fontSize: 13, textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(62,11,24,0.2)'
              }}
            >
              📿 नाम जप काउंटर खोलें →
            </Link>
          </div>

          {/* Welcome Voucher & Free Consultation Card */}
          <div style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
            color: '#ECFDF5', padding: '18px 20px', borderRadius: 18,
            border: '1.5px solid #34D399', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 14
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#A7F3D0', letterSpacing: '0.05em' }}>
                🎁 प्रथम वैदिक परामर्श उपहार सक्रिय (WELCOME VOUCHER)
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF', margin: '3px 0' }}>
                ₹100 परिचयात्मक छूट · प्रथम ३ मिनट निःशुल्क
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#D1FAE5' }}>
                सत्यापित वैदिक आचार्यों से अपनी कुंडली के राजयोग, विवाह, व करियर पर निःसंकोच बात करें।
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                to="/consultation/acharya-shastri"
                style={{
                  padding: '12px 22px', borderRadius: 999, background: '#F59E0B',
                  color: '#183C2B', fontWeight: 800, fontSize: 13, textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.35)'
                }}
              >
                ☎ अभी परामर्श शुरू करें →
              </Link>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: '10px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)', color: '#FFFFFF', fontSize: 12,
                  fontWeight: 700, cursor: 'pointer'
                }}
              >
                🔄 नया विवरण
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
