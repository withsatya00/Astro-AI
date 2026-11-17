import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWallet } from '../../components/WalletModal/walletApi.js';
import WalletModal from '../../components/WalletModal/WalletModal.jsx';
import VedicCompanionCard from './VedicCompanionCard.jsx';
import { useLang } from '../BhaktiPage/lang.js';
import { listConsultations, parseUtc } from '../ConsultationPage/consultApi.js';

// Astrologer avatars and names for rich display
const SAMPLE_ASTROLOGERS = [
  { name: 'Pt. Rameshwar Dwivedi', exp: 'Vedic Kundli & Career', img: '/assets/img/astrologers/pt-rameshwar.webp' },
  { name: 'Vidushi Meera Devi', exp: 'Marriage & Relationship', img: '/assets/img/astrologers/meera-devi.webp' },
  { name: 'Acharya K.N. Rao Ji', exp: 'Dasha & Prashna Kundli', img: '/assets/img/astrologers/acharya-rao.webp' },
  { name: 'Pandit Radheshyam Joshi', exp: 'Graha Shanti & Remedies', img: '/assets/img/astrologers/radheshyam.webp' },
];

const RASHI_SADHANA = {
  'Mesh (Aries)': { lord: 'मंगल देव (Mars)', mantra: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः', deity: 'hanuman', name: 'Hanuman Ji', aarti: 'hanuman', seva: 'संकट मोचन हनुमान मंदिर, वाराणसी', desc: 'आत्मबल, ऊर्जा व पराक्रम वृद्धि हेतु।' },
  'Vrishabh (Taurus)': { lord: 'शुक्र देव (Venus)', mantra: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः', deity: 'durga', name: 'Maa Mahalakshmi', aarti: 'durga', seva: 'महालक्ष्मी मंदिर, कोल्हापुर', desc: 'ऐश्वर्य, सौम्यता व दांपत्य सुख हेतु।' },
  'Mithun (Gemini)': { lord: 'बुध देव (Mercury)', mantra: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः', deity: 'ganesh', name: 'Lord Ganesha', aarti: 'ganesh', seva: 'सिद्धि विनायक मंदिर, मुंबई', desc: 'बुद्धि, व्यापारिक लाभ व एकाग्रता हेतु।' },
  'Kark (Cancer)': { lord: 'चंद्र देव (Moon)', mantra: 'ॐ नमः शिवाय / ॐ सों सोमाय नमः', deity: 'shiva', name: 'Lord Shiva', aarti: 'shiva', seva: 'श्री सोमनाथ ज्योतिर्लिंग धाम', desc: 'मानसिक शांति, तनाव मुक्ति व आरोग्य हेतु।' },
  'Singh (Leo)': { lord: 'सूर्य देव (Sun)', mantra: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः / ॐ राम रामाय नमः', deity: 'ram', name: 'Shri Ram & Surya Dev', aarti: 'ram', seva: 'श्री राम जन्मभूमि मंदिर, अयोध्या', desc: 'मान-सम्मान, नेतृत्व व पितृ आशीर्वाद हेतु।' },
  'Kanya (Virgo)': { lord: 'बुध देव (Mercury)', mantra: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः', deity: 'ganesh', name: 'Lord Ganesha', aarti: 'ganesh', seva: 'महागणेश मंदिर, उज्जैन', desc: 'विश्लेषण क्षमता, परीक्षा व सफलता हेतु।' },
  'Tula (Libra)': { lord: 'शुक्र देव (Venus)', mantra: 'ॐ शुं शुक्राय नमः / ॐ दुं दुर्गायै नमः', deity: 'durga', name: 'Maa Durga', aarti: 'durga', seva: 'माँ कामाख्या धाम, असम', desc: 'आकर्षण, कलात्मक सिद्धि व समृद्धि हेतु।' },
  'Vrishchik (Scorpio)': { lord: 'मंगल देव (Mars)', mantra: 'ॐ अं अंगारकाय नमः / ॐ हनुमते नमः', deity: 'hanuman', name: 'Hanuman Ji', aarti: 'hanuman', seva: 'हनुमान गढ़ी, अयोध्या', desc: 'शत्रु बाधा शांति व असीम साहस हेतु।' },
  'Dhanu (Sagittarius)': { lord: 'देवगुरु बृहस्पति (Jupiter)', mantra: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः', deity: 'krishna', name: 'Shri Krishna', aarti: 'krishna', seva: 'श्री बांके बिहारी मंदिर, वृन्दावन', desc: 'ज्ञान, धर्म, संतति सुख व उच्च पद हेतु।' },
  'Makar (Capricorn)': { lord: 'शनि देव (Saturn)', mantra: 'ॐ शं शनैश्चराय नमः / महामृत्युंजय', deity: 'shiva', name: 'Lord Shiva & Shani Dev', aarti: 'shiva', seva: 'श्री महाकालेश्वर ज्योतिर्लिंग, उज्जैन', desc: 'कर्म सिद्धि, दीर्घायु व धैर्य हेतु।' },
  'Kumbh (Aquarius)': { lord: 'शनि देव (Saturn)', mantra: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः', deity: 'shiva', name: 'Lord Shiva', aarti: 'shiva', seva: 'श्री काशी विश्वनाथ ज्योतिर्लिंग, वाराणसी', desc: 'अनुसंधान, लोककल्याण व मोक्ष मार्ग हेतु।' },
  'Meen (Pisces)': { lord: 'देवगुरु बृहस्पति (Jupiter)', mantra: 'ॐ नमो भगवते वासुदेवाय', deity: 'krishna', name: 'Shri Hari Vishnu', aarti: 'krishna', seva: 'श्री बद्रीनाथ धाम, उत्तराखंड', desc: 'आध्यात्मिक शांति, भाग्य वृद्धि व परमानंद हेतु।' },
};

const SAMPLE_VERIFIED_SEVAS = [
  {
    id: 'sankalp-kv-001',
    temple: 'श्री काशी विश्वनाथ ज्योतिर्लिंग धाम, वाराणसी',
    deity: 'भगवान शिव',
    pujaName: 'विशेष प्रदोष काल रुद्राभिषेक एवं महामृत्युंजय जप संकल्प',
    date: '14 नवम्बर 2026',
    priest: 'पं. विद्याधर शास्त्री (मुख्य अर्चक)',
    videoUrl: '/storage/uploads/proofs/02616bf3-3a39-4178-a2d4-43750d188b9c.mp4',
    status: 'संकल्प संपन्न ✓',
    prasadStatus: 'गंगाजल एवं भस्म प्रसाद प्रेषित'
  },
  {
    id: 'sankalp-sm-002',
    temple: 'संकट मोचन हनुमान मंदिर, वाराणसी',
    deity: 'हनुमान जी महाराज',
    pujaName: 'मंगलवार विशेष मारुति स्तोत्र पाठ एवं सिंदूर चोला अर्पण',
    date: '10 नवम्बर 2026',
    priest: 'पं. राधेश्याम त्रिपाठी (सेवादार)',
    videoUrl: '/storage/uploads/proofs/074b5b08-258c-421d-9569-dc853fc59cf1.mp4',
    status: 'संकल्प संपन्न ✓',
    prasadStatus: 'सिंदूर एवं तुलसी पत्र प्रसाद डिलीवर'
  }
];

export default function UserProfilePage() {
  const { currentUser, openAuthModal, logout } = useAuth();
  const wallet = useWallet(true);
  const navigate = useNavigate();
  const lang = useLang();
  const isHi = lang === 'hi';

  const [activeTab, setActiveTab] = useState('consultations'); // consultations | profile | sevas
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [rechargePreset, setRechargePreset] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loadingConsults, setLoadingConsults] = useState(false);

  // Vedic Profile State (saved in localStorage)
  const [dob, setDob] = useState(() => localStorage.getItem('astro_profile_dob') || '1995-08-15');
  const [tob, setTob] = useState(() => localStorage.getItem('astro_profile_tob') || '08:45');
  const [pob, setPob] = useState(() => localStorage.getItem('astro_profile_pob') || 'Varanasi, Uttar Pradesh');
  const [gotra, setGotra] = useState(() => localStorage.getItem('astro_profile_gotra') || 'Kashyapa (कश्यप)');
  const [rashi, setRashi] = useState(() => localStorage.getItem('astro_profile_rashi') || 'Singh (Leo)');
  const [ishta, setIshta] = useState(() => localStorage.getItem('astro_profile_ishta') || 'Lord Shiva (भगवान शिव)');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoProof, setSelectedVideoProof] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (currentUser) {
      setLoadingConsults(true);
      listConsultations(20)
        .then((res) => {
          const items = Array.isArray(res) ? res : res.items || [];
          setConsultations(items);
        })
        .catch(() => setConsultations([]))
        .finally(() => setLoadingConsults(false));
    }
  }, [currentUser]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('astro_profile_dob', dob);
      localStorage.setItem('astro_profile_tob', tob);
      localStorage.setItem('astro_profile_pob', pob);
      localStorage.setItem('astro_profile_gotra', gotra);
      localStorage.setItem('astro_profile_rashi', rashi);
      localStorage.setItem('astro_profile_ishta', ishta);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {}
  };

  const handleLogout = () => {
    const confirmText = isHi
      ? 'क्या आप वास्तव में अपने खाते से लॉग आउट करना चाहते हैं?'
      : 'Are you sure you want to sign out?';
    if (window.confirm(confirmText)) {
      logout();
      navigate('/');
    }
  };

  if (!currentUser) {
    return (
      <div style={{ backgroundColor: '#FAF7F2', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ maxWidth: 440, width: '100%', background: '#fff', borderRadius: 24, boxShadow: '0 20px 45px rgba(62,11,24,0.08)', border: '1px solid #DDEBD5', padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FFFDF5', border: '2px solid #C49A3A', fontSize: 28, display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#A77B25' }}>
            🔒
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#164B32', margin: '0 0 8px' }}>
            {isHi ? 'भक्त प्रोफ़ाइल हेतु साइन इन करें' : 'Sign In to View Your Profile'}
          </h1>
          <p style={{ fontSize: 13, color: '#56675B', lineHeight: 1.5, margin: '0 0 24px' }}>
            {isHi
              ? 'अपने परामर्श, वॉलेट बैलेंस, मंदिर पूजा संकल्प एवं वैदिक विवरण देखने के लिए कृपया साइन इन करें।'
              : 'Sign in to access your consultations, wallet balance, sacred puja sankalps, and personalized Vedic kundli profile.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              style={{ width: '100%', padding: '12px', borderRadius: 999, background: 'linear-gradient(90deg, #E7D39B, #A77B25)', color: '#164B32', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,150,47,0.25)' }}
            >
              {isHi ? 'साइन इन करें' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              style={{ width: '100%', padding: '12px', borderRadius: 999, background: '#FFFDF5', color: '#164B32', fontWeight: 700, fontSize: 13, border: '1px solid #C49A3A', cursor: 'pointer' }}
            >
              {isHi ? 'नया खाता बनाएं' : 'Create Free Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = currentUser?.full_name || currentUser?.name || currentUser?.email?.split('@')[0] || 'Devotee';
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <div style={{ backgroundColor: '#FAF7F2', minHeight: '100vh', padding: '32px 16px 64px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* ============================================================== */}
        {/* 1. SACRED DEVOTEE MASTHEAD                                     */}
        {/* ============================================================== */}
        <section style={{
          background: 'linear-gradient(135deg, #4A0E1C 0%, #300712 100%)',
          borderRadius: 24,
          padding: '28px 32px',
          color: '#FFFDF5',
          border: '1.5px solid rgba(212,175,55,0.45)',
          boxShadow: '0 16px 40px -12px rgba(62,11,24,0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Golden Mandala in background */}
          <div style={{
            position: 'absolute', right: -30, top: '50%', transform: 'translateY(-50%)',
            width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.12)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Devotee Avatar */}
              <div style={{
                width: 76, height: 76, borderRadius: '50%',
                background: 'linear-gradient(135deg, #F9E29B, #C49A3A)',
                color: '#164B32', fontWeight: 800, fontSize: 32,
                display: 'grid', placeItems: 'center',
                boxShadow: '0 0 0 4px rgba(255,255,255,0.15), 0 8px 20px rgba(0,0,0,0.3)',
                flexShrink: 0
              }}>
                {initial}
              </div>

              {/* Devotee Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, margin: 0, color: '#FFFDF5' }}>
                    {displayName}
                  </h1>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                    background: 'rgba(212,175,55,0.22)', border: '1px solid #C49A3A', color: '#FCE7A1',
                    display: 'inline-flex', alignItems: 'center', gap: 4
                  }}>
                    <span>✨</span>
                    <span>{isHi ? 'सत्यापित साधक' : 'Verified Devotee'}</span>
                  </span>
                </div>

                <p style={{ margin: '0 0 6px', fontSize: 13, color: '#FCE7A1', opacity: 0.9 }}>
                  ✉️ {currentUser.email} {currentUser.phone && <span>· 📞 +91 {currentUser.phone}</span>}
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11.5 }}>
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6, color: '#FFECCC', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {isHi ? 'गोत्र:' : 'Gotra:'} <b>{gotra}</b>
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6, color: '#FFECCC', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {isHi ? 'राशि:' : 'Rashi:'} <b>{rashi}</b>
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6, color: '#FFECCC', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {isHi ? 'इष्ट:' : 'Ishta:'} <b>{ishta}</b>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {currentUser.role === 'admin' && (
                <Link
                  to="/admin"
                  style={{
                    padding: '8px 16px', borderRadius: 10,
                    background: 'linear-gradient(90deg, #F5D061, #C49A3A)', border: '1px solid #A77B25',
                    color: '#164B32', fontSize: 12, fontWeight: 800, textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 12px rgba(212,175,55,0.35)'
                  }}
                >
                  <span>⚡</span>
                  <span>{isHi ? 'एडमिन पैनल' : 'Admin Panel'}</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
                  color: '#FFFDF5', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}
              >
                ✏️ {isHi ? 'विवरण बदलें' : 'Edit Profile'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: '#164B32', border: '1px solid #C49A3A',
                  color: '#C49A3A', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}
              >
                {isHi ? 'लॉग आउट' : 'Sign Out'}
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. REFINED ASTRO WALLET CARD (COMPACT & BALANCED)               */}
        {/* ============================================================== */}
        <section style={{
          background: '#FFFDF5',
          borderRadius: 20,
          border: '1px solid #DDEBD5',
          padding: '20px 26px',
          boxShadow: '0 4px 16px rgba(62,11,24,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap'
        }}>
          {/* Balance display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'radial-gradient(circle, #5a1222, #164B32)',
              border: '1.5px solid #C49A3A',
              display: 'grid', placeItems: 'center',
              fontSize: 26, color: '#C49A3A',
              boxShadow: '0 4px 12px rgba(62,11,24,0.18)',
              flexShrink: 0
            }}>
              🪙
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8C4A28', display: 'block' }}>
                {isHi ? 'उपलब्ध वॉलेट शेष' : 'Available Wallet Balance'}
              </span>
              <strong style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#164B32', fontWeight: 800 }}>
                {wallet.loading ? '…' : `₹${Number(wallet.balance || 0).toFixed(2)}`}
              </strong>
            </div>
          </div>

          {/* Quick Recharge Chips & Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setRechargePreset(amt); setWalletModalOpen(true); }}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    background: '#F2F5EA', border: '1px solid #C49A3A',
                    color: '#164B32', fontSize: 11.5, fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + ₹{amt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => { setRechargePreset(null); setWalletModalOpen(true); }}
              style={{
                padding: '9px 20px', borderRadius: 999,
                background: 'linear-gradient(90deg, #E7D39B, #A77B25)',
                color: '#164B32', fontWeight: 800, fontSize: 12.5,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(201,150,47,0.25)',
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              <span>+</span>
              <span>{isHi ? 'वॉलेट रिचार्ज करें' : 'Recharge Wallet'}</span>
            </button>

            <Link
              to="/wallet"
              style={{
                padding: '8px 14px', borderRadius: 999,
                background: '#F2F5EA', border: '1px solid #E2D2B8',
                color: '#164B32', fontWeight: 600, fontSize: 12,
                textDecoration: 'none'
              }}
            >
              {isHi ? 'पासबुक देखें →' : 'View Ledger →'}
            </Link>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. DEVOTIONAL TABS NAVIGATION                                   */}
        {/* ============================================================== */}
        <nav style={{
          display: 'flex', gap: 8, background: '#FFFDF5',
          padding: 6, borderRadius: 16, border: '1px solid #DDEBD5',
          overflowX: 'auto'
        }}>
          {[
            { id: 'consultations', labelHi: 'मेरे परामर्श सत्र', labelEn: 'My Consultations', icon: '💬' },
            { id: 'profile', labelHi: 'वैदिक कुंडली विवरण', labelEn: 'Vedic Kundli Profile', icon: '📜' },
            { id: 'sevas', labelHi: 'मंदिर सेवा एवं संकल्प', labelEn: 'Mandir Seva & Orders', icon: '🛕' },
            { id: 'companion', labelHi: 'दैनिक वैदिक साथी (WhatsApp)', labelEn: 'Vedic Companion', icon: '🟢' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: '1 1 auto', padding: '10px 16px', borderRadius: 12,
                fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                background: activeTab === t.id ? '#164B32' : 'transparent',
                color: activeTab === t.id ? '#FFFDF5' : '#6A564A',
                boxShadow: activeTab === t.id ? '0 4px 12px rgba(62,11,24,0.2)' : 'none'
              }}
            >
              <span>{t.icon}</span>
              <span>{isHi ? t.labelHi : t.labelEn}</span>
            </button>
          ))}
        </nav>

        {/* ============================================================== */}
        {/* 4. TAB 1: RICH CONSULTATIONS LIST                              */}
        {/* ============================================================== */}
        {activeTab === 'consultations' && (
          <section style={{
            background: '#FFFDF5', borderRadius: 20, border: '1px solid #DDEBD5',
            padding: '24px 28px', boxShadow: '0 4px 16px rgba(62,11,24,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#164B32', margin: '0 0 2px' }}>
                  {isHi ? 'परामर्श सत्र इतिहास' : 'Consultation History'}
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: '#56675B' }}>
                  {isHi ? 'आपके द्वारा बुक किए गए सभी लाइव चैट एवं ऑडियो कॉल परामर्श' : 'All your active and completed live chat and call guidance sessions'}
                </p>
              </div>
              <Link
                to="/astrologers"
                style={{
                  fontSize: 12.5, fontWeight: 700, color: '#164B32', textDecoration: 'none',
                  padding: '6px 14px', borderRadius: 8, background: '#F2F5EA', border: '1px solid #C49A3A'
                }}
              >
                {isHi ? 'नये ज्योतिषी से परामर्श लें →' : 'Find Astrologers →'}
              </Link>
            </div>

            {loadingConsults ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: '#56675B', fontSize: 13 }}>
                {isHi ? 'परामर्श लोड हो रहे हैं…' : 'Loading consultations…'}
              </p>
            ) : consultations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', background: '#F2F5EA', borderRadius: 16, border: '1px dashed #C49A3A' }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>🔮</span>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#164B32', margin: '0 0 6px' }}>
                  {isHi ? 'अभी कोई परामर्श सत्र दर्ज नहीं है' : 'No Consultations Yet'}
                </h3>
                <p style={{ fontSize: 12.5, color: '#56675B', maxWidth: 420, margin: '0 auto 18px', lineHeight: 1.5 }}>
                  {isHi
                    ? 'भारत के शीर्ष प्रमाणित वैदिक ज्योतिषियों से लाइव चैट अथवा ऑडियो कॉल द्वारा अपनी कुंडली, करियर एवं विवाह का मार्गदर्शन प्राप्त करें।'
                    : 'Connect directly with certified Vedic astrologers for authentic guidance on career, marriage, health, and finance.'}
                </p>
                <Link
                  to="/astrologers"
                  style={{
                    display: 'inline-block', padding: '10px 22px', borderRadius: 999,
                    background: '#164B32', color: '#FFFDF5', fontWeight: 700, fontSize: 12.5,
                    textDecoration: 'none', boxShadow: '0 4px 12px rgba(62,11,24,0.2)'
                  }}
                >
                  {isHi ? 'ज्योतिषी से परामर्श शुरू करें' : 'Talk to Astrologer'}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                {consultations.map((c, idx) => {
                  const sampleAstro = SAMPLE_ASTROLOGERS[idx % SAMPLE_ASTROLOGERS.length];
                  const astroName = c.astrologer_name || sampleAstro.name;
                  const expertise = c.expertise || sampleAstro.exp;
                  const isActive = c.status === 'active';
                  const dateStr = c.created_at
                    ? parseUtc(c.created_at).toLocaleString(isHi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                    : 'Today, 11:30 AM';

                  return (
                    <div
                      key={c.id || idx}
                      style={{
                        padding: '16px 20px', borderRadius: 16,
                        border: isActive ? '1.5px solid #C49A3A' : '1px solid #DDEBD5',
                        background: isActive ? '#FFFDF8' : '#FAF8F4',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 16, flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {/* Astrologer Avatar */}
                        {c.astrologer_avatar || sampleAstro?.img ? (
                          <img
                            src={c.astrologer_avatar || sampleAstro.img}
                            alt={astroName}
                            style={{
                              width: 48, height: 48, borderRadius: '50%',
                              objectFit: 'cover', border: '2px solid #C49A3A',
                              flexShrink: 0, boxShadow: '0 2px 8px rgba(62,11,24,0.15)'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: 'radial-gradient(circle, #5a1222, #164B32)',
                            border: '2px solid #C49A3A',
                            color: '#C49A3A', fontWeight: 800, fontSize: 18,
                            display: 'grid', placeItems: 'center', flexShrink: 0
                          }}>
                            {astroName.charAt(0) || 'प'}
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                            <strong style={{ fontSize: 14, color: '#164B32', fontFamily: 'Georgia, serif' }}>
                              {astroName}
                            </strong>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                              background: isActive ? '#DCFCE7' : '#F1F5F9',
                              color: isActive ? '#166534' : '#475569',
                              border: `1px solid ${isActive ? '#86EFAC' : '#CBD5E1'}`,
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}>
                              {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />}
                              <span>{isActive ? (isHi ? 'सक्रिय सत्र' : 'Active Session') : (isHi ? 'पूर्ण' : 'Completed')}</span>
                            </span>
                          </div>

                          <p style={{ margin: 0, fontSize: 12, color: '#56675B' }}>
                            <span>✨ {expertise}</span>
                            <span> · 📅 {dateStr}</span>
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Link
                          to={`/consultation/${c.astrologer_id || c.astrologer_slug || 'pt-rameshwar-dwivedi'}`}
                          style={{
                            padding: '8px 18px', borderRadius: 10,
                            background: isActive ? 'linear-gradient(90deg, #E7D39B, #A77B25)' : '#FFFDF5',
                            color: isActive ? '#164B32' : '#164B32',
                            border: `1px solid ${isActive ? '#A77B25' : '#C49A3A'}`,
                            fontSize: 12, fontWeight: 700, textDecoration: 'none',
                            boxShadow: isActive ? '0 4px 10px rgba(201,150,47,0.2)' : 'none'
                          }}
                        >
                          {isActive ? (isHi ? 'चैट जारी रखें →' : 'Continue Chat →') : (isHi ? 'पुनः परामर्श लें →' : 'Consult Again →')}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* 5. TAB 2: VEDIC KUNDLI & BIRTH PROFILE FORM                    */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <section style={{
            background: '#FFFDF5', borderRadius: 20, border: '1px solid #DDEBD5',
            padding: '24px 28px', boxShadow: '0 4px 16px rgba(62,11,24,0.04)'
          }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#164B32', margin: '0 0 4px' }}>
                {isHi ? 'वैदिक विवरण एवं जन्म कुंडली डेटा' : 'Vedic Kundli & Birth Profile'}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: '#56675B' }}>
                {isHi
                  ? 'यह जानकारी ज्योतिषी परामर्श, दैनिक राशिफल एवं मंदिर पूजा संकल्प में स्वतः उपयोग होगी।'
                  : 'This birth data automatically customizes your Kundli calculations, daily Rashifal, and temple puja sankalps.'}
              </p>
            </div>

            {saveSuccess && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46',
                fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span>✓</span>
                <span>{isHi ? 'वैदिक विवरण सफलतापूर्वक सुरक्षित कर लिया गया है।' : 'Vedic details saved successfully.'}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#164B32', marginBottom: 6 }}>
                    {isHi ? 'जन्म तिथि (Date of Birth)' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #C49A3A', background: '#FFF', fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#164B32', marginBottom: 6 }}>
                    {isHi ? 'जन्म समय (Time of Birth)' : 'Time of Birth'}
                  </label>
                  <input
                    type="time"
                    value={tob}
                    onChange={(e) => setTob(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #C49A3A', background: '#FFF', fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#164B32', marginBottom: 6 }}>
                    {isHi ? 'जन्म स्थान / नगर (Birth Place / City)' : 'Birth Place / City'}
                  </label>
                  <input
                    type="text"
                    value={pob}
                    onChange={(e) => setPob(e.target.value)}
                    placeholder={isHi ? 'उदा. वाराणसी, उत्तर प्रदेश' : 'e.g. Varanasi, Uttar Pradesh'}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #C49A3A', background: '#FFF', fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#164B32', marginBottom: 6 }}>
                    {isHi ? 'गोत्र (Gotra)' : 'Gotra'}
                  </label>
                  <input
                    type="text"
                    value={gotra}
                    onChange={(e) => setGotra(e.target.value)}
                    placeholder={isHi ? 'उदा. भारद्वाज, कश्यप, वशिष्ठ' : 'e.g. Bharadwaja, Kashyapa, Vashishta'}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #C49A3A', background: '#FFF', fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#164B32', marginBottom: 6 }}>
                    {isHi ? 'राशि (Zodiac Moon Sign)' : 'Moon Sign (Rashi)'}
                  </label>
                  <select
                    value={rashi}
                    onChange={(e) => setRashi(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #C49A3A', background: '#FFF', fontSize: 12.5, boxSizing: 'border-box' }}
                  >
                    <option value="">{isHi ? '-- राशि चुनें --' : '-- Select Rashi --'}</option>
                    {['Mesh (Aries)','Vrishabh (Taurus)','Mithun (Gemini)','Kark (Cancer)','Singh (Leo)','Kanya (Virgo)','Tula (Libra)','Vrishchik (Scorpio)','Dhanu (Sagittarius)','Makar (Capricorn)','Kumbh (Aquarius)','Meen (Pisces)'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#164B32', marginBottom: 6 }}>
                    {isHi ? 'इष्ट देवता / देवी (Ishta Devata)' : 'Ishta Devata (Preferred Deity)'}
                  </label>
                  <input
                    type="text"
                    value={ishta}
                    onChange={(e) => setIshta(e.target.value)}
                    placeholder={isHi ? 'उदा. भगवान शिव, श्री कृष्ण, माँ दुर्गा' : 'e.g. Lord Shiva, Shri Krishna, Maa Durga'}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #C49A3A', background: '#FFF', fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ paddingTop: 8 }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px', borderRadius: 999,
                    background: '#164B32', color: '#FFFDF5', fontWeight: 700, fontSize: 12.5,
                    border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(62,11,24,0.2)'
                  }}
                >
                  {isHi ? 'विवरण सुरक्षित करें' : 'Save Vedic Details'}
                </button>
              </div>
            </form>

            {/* Kundli-to-Bhakti & Seva Bridge Widget */}
            {rashi && RASHI_SADHANA[rashi] && (
              <div style={{
                marginTop: 24, padding: '20px 24px', borderRadius: 16,
                background: 'linear-gradient(135deg, #FAF4E8 0%, #F5E8D0 100%)',
                border: '1.5px solid #C49A3A', boxShadow: '0 6px 20px rgba(62,11,24,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>🪔</span>
                    <div>
                      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#164B32', margin: 0 }}>
                        {isHi ? 'आपकी राशि अनुसार दैनिक साधना एवं ग्रह-शांति' : 'Your Personalized Daily Sadhana & Graha Shanti'}
                      </h3>
                      <p style={{ margin: 0, fontSize: 12, color: '#56675B' }}>
                        {isHi
                          ? `राशि स्वामी: ${RASHI_SADHANA[rashi].lord} · इष्ट: ${RASHI_SADHANA[rashi].name} — ${RASHI_SADHANA[rashi].desc}`
                          : `Rashi Lord: ${RASHI_SADHANA[rashi].lord} · Deity: ${RASHI_SADHANA[rashi].name}`}
                      </p>
                    </div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 999, background: '#164B32', color: '#C49A3A', fontSize: 11, fontWeight: 700 }}>
                    {rashi.split(' ')[0]} राशि अनुकूल
                  </span>
                </div>

                <div style={{ padding: '12px 16px', background: '#FFFDF5', borderRadius: 12, border: '1px solid #DDEBD5', marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#A77B25', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 2 }}>
                    {isHi ? 'दैनिक बीज मंत्र (Daily Recommended Japa)' : 'Recommended Vedic Mantra'}
                  </span>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#164B32', margin: 0 }}>
                    {RASHI_SADHANA[rashi].mantra}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link
                    to={`/bhakti/naam-jaap?deity=${RASHI_SADHANA[rashi].deity}`}
                    style={{
                      padding: '9px 18px', borderRadius: 999,
                      background: 'linear-gradient(90deg, #E7D39B, #A77B25)',
                      color: '#164B32', fontWeight: 800, fontSize: 12, textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(201,150,47,0.25)', display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <span>▶</span>
                    <span>{isHi ? '1 माला जाप शुरू करें' : 'Begin 108 Japa'}</span>
                  </Link>

                  <Link
                    to={`/bhakti/aarti-chalisa?deity=${RASHI_SADHANA[rashi].deity}`}
                    style={{
                      padding: '8px 16px', borderRadius: 999,
                      background: '#FFFDF5', border: '1px solid #C49A3A',
                      color: '#164B32', fontWeight: 700, fontSize: 12, textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <span>🪔</span>
                    <span>{isHi ? 'आरती व स्तोत्र पाठ' : 'Read Sacred Aarti'}</span>
                  </Link>

                  <Link
                    to="/mandir-seva"
                    style={{
                      padding: '8px 16px', borderRadius: 999,
                      background: '#F2F5EA', border: '1px solid #DDEBD5',
                      color: '#164B32', fontWeight: 700, fontSize: 12, textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <span>🛕</span>
                    <span>{isHi ? `तीर्थ सेवा: ${RASHI_SADHANA[rashi].seva}` : 'Book Temple Seva'}</span>
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* 6. TAB 3: MANDIR SEVA & PUJA ORDERS                            */}
        {/* ============================================================== */}
        {activeTab === 'sevas' && (
          <section style={{
            background: '#FFFDF5', borderRadius: 20, border: '1px solid #DDEBD5',
            padding: '24px 28px', boxShadow: '0 4px 16px rgba(62,11,24,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#164B32', margin: '0 0 2px' }}>
                  {isHi ? 'मेरे संकल्पित अनुष्ठान एवं वीडियो दर्शन प्रमाण' : 'My Consecrated Sankalps & Video Proofs'}
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: '#56675B' }}>
                  {isHi
                    ? 'सिद्ध धामों एवं ज्योतिर्लिंगों में आपके नाम-गोत्र से किए गए संकल्प का आधिकारिक वीडियो प्रमाण'
                    : 'Official temple sanctum video recordings of rituals conducted in your name and gotra'}
                </p>
              </div>
              <Link
                to="/mandir-seva"
                style={{
                  padding: '7px 16px', borderRadius: 999,
                  background: 'linear-gradient(90deg, #E7D39B, #A77B25)',
                  color: '#164B32', fontWeight: 700, fontSize: 12, textDecoration: 'none'
                }}
              >
                {isHi ? '+ नई सेवा संकल्प बुक करें' : '+ Book New Seva'}
              </Link>
            </div>

            {/* List of Verified Temple Sankalps with Video Proof */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {SAMPLE_VERIFIED_SEVAS.map((seva) => (
                <div
                  key={seva.id}
                  style={{
                    padding: '18px 20px', borderRadius: 16,
                    background: '#FFFDF8', border: '1.5px solid #C49A3A',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 16, flexWrap: 'wrap', boxShadow: '0 4px 12px rgba(62,11,24,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: 'radial-gradient(circle, #5a1222, #164B32)',
                      border: '1.5px solid #C49A3A',
                      display: 'grid', placeItems: 'center',
                      fontSize: 26, color: '#C49A3A', flexShrink: 0
                    }}>
                      🛕
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#164B32', margin: 0 }}>
                          {seva.pujaName}
                        </h3>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6,
                          background: '#ECFDF5', color: '#065F46',
                          fontSize: 11, fontWeight: 700, border: '1px solid #A7F3D0'
                        }}>
                          {seva.status}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 600, color: '#164B32' }}>
                        📍 {seva.temple}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#56675B' }}>
                        <span>👤 यजमान: <b>{currentUser?.name || 'आदित्य शर्मा'}</b> (गोत्र: {gotra})</span>
                        <span> · 📅 {seva.date}</span>
                        <span> · 🪔 {seva.priest}</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVideoProof(seva);
                        setVideoModalOpen(true);
                      }}
                      style={{
                        padding: '9px 18px', borderRadius: 999,
                        background: '#164B32', color: '#C49A3A',
                        border: '1px solid #C49A3A', fontWeight: 700, fontSize: 12,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 4px 12px rgba(62,11,24,0.2)'
                      }}
                    >
                      <span>▶</span>
                      <span>{isHi ? 'संकल्प वीडियो देखें' : 'Watch Video Proof'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Seva Discovery Cards */}
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#164B32', margin: '0 0 12px' }}>
              {isHi ? 'अन्य पवित्र तीर्थ सेवा विकल्प' : 'More Sacred Seva Opportunities'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ padding: 18, borderRadius: 14, background: '#F2F5EA', border: '1px solid #DDEBD5' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🛕</span>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#164B32', margin: '0 0 4px' }}>
                  {isHi ? 'दैनिक मंदिर चढ़ावा एवं पूजा' : 'Temple Chadhava & Puja'}
                </h3>
                <p style={{ fontSize: 12, color: '#56675B', lineHeight: 1.5, margin: '0 0 12px' }}>
                  {isHi ? '12 ज्योतिर्लिंगों एवं सिद्ध धामों में अपने नाम-गोत्र से संकल्पित पूजा व चढ़ावा।' : 'Holy offerings and pujas conducted with video proof at revered Jyotirlingas.'}
                </p>
                <Link to="/mandir-seva/chadhava" style={{ fontSize: 12, fontWeight: 700, color: '#164B32', textDecoration: 'none' }}>
                  {isHi ? 'चढ़ावा सेवा देखें →' : 'Explore Chadhava Seva →'}
                </Link>
              </div>

              <div style={{ padding: 18, borderRadius: 14, background: '#F2F5EA', border: '1px solid #DDEBD5' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🐄</span>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#164B32', margin: '0 0 4px' }}>
                  {isHi ? 'पवित्र गौ सेवा' : 'Gau Sewa Contributions'}
                </h3>
                <p style={{ fontSize: 12, color: '#56675B', lineHeight: 1.5, margin: '0 0 12px' }}>
                  {isHi ? 'श्री कृष्ण गौशालाओं में हरी घास, गुड़ एवं औषधीय सेवा सहयोग।' : 'Direct fodder and medical care contribution for revered holy cows.'}
                </p>
                <Link to="/gau-sewa" style={{ fontSize: 12, fontWeight: 700, color: '#164B32', textDecoration: 'none' }}>
                  {isHi ? 'गौ सेवा करें →' : 'Participate in Gau Sewa →'}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 4: DAILY VEDIC COMPANION (WHATSAPP & TELEGRAM)              */}
        {/* ============================================================== */}
        {activeTab === 'companion' && (
          <section style={{ animation: 'fadeIn 0.25s ease' }}>
            <VedicCompanionCard
              userRashi={rashi}
              userPhone={currentUser?.phone || ''}
            />
          </section>
        )}
      </div>

      {/* ================================================================ */}
      {/* 7. SACRED SANKALP VIDEO PROOF MODAL                             */}
      {/* ================================================================ */}
      {videoModalOpen && selectedVideoProof && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(23, 3, 8, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            maxWidth: 680, width: '100%', background: '#20040b',
            borderRadius: 20, border: '2px solid #C49A3A', overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)', color: '#FFFDF5'
          }}>
            <div style={{
              padding: '16px 20px', background: 'linear-gradient(90deg, #164B32, #2A0610)',
              borderBottom: '1px solid rgba(213,170,81,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#C49A3A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  प्रमाणित मंदिर संकल्प दर्शन (Verified Video Proof)
                </span>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, margin: '2px 0 0', color: '#FFF' }}>
                  {selectedVideoProof.pujaName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid #C49A3A',
                  color: '#C49A3A', fontSize: 16, cursor: 'pointer', display: 'grid', placeItems: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#000', position: 'relative' }}>
              <video
                src={selectedVideoProof.videoUrl}
                controls
                autoPlay
                playsInline
                style={{ width: '100%', maxHeight: 400, display: 'block' }}
              />
            </div>

            <div style={{ padding: '16px 20px', background: '#20040b', borderTop: '1px solid rgba(213,170,81,0.2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#DDEBD5', display: 'block' }}>तीर्थ धाम:</span>
                  <strong style={{ color: '#C49A3A' }}>{selectedVideoProof.temple}</strong>
                </div>
                <div>
                  <span style={{ color: '#DDEBD5', display: 'block' }}>यजमान एवं गोत्र:</span>
                  <strong style={{ color: '#C49A3A' }}>{currentUser?.name || 'आदित्य शर्मा'} (गोत्र: {gotra})</strong>
                </div>
                <div>
                  <span style={{ color: '#DDEBD5', display: 'block' }}>संकल्प तिथि व अर्चक:</span>
                  <strong style={{ color: '#C49A3A' }}>{selectedVideoProof.date} · {selectedVideoProof.priest}</strong>
                </div>
              </div>
              <p style={{ margin: '12px 0 0', fontSize: 11.5, color: '#A7F3D0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✓</span>
                <span>यह संकल्प वीडियो सीधे मंदिर गर्भगृह से लाइव रिकॉर्ड कर प्रमाणित किया गया है।</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
}
