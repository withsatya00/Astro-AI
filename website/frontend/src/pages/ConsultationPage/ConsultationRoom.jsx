import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import WalletModal from '../../components/WalletModal/WalletModal.jsx';

const ASTROLOGERS_DIRECTORY = [
  {
    id: 'pt-rameshwar-dwivedi',
    slug: 'pt-rameshwar-dwivedi',
    name: 'Pt. Rameshwar Dwivedi',
    title: 'Senior Vedic Jyotish & Karmakand Scholar',
    avatar: '/assets/portraits/pt-rameshwar-dwivedi.jpg',
    rate: 35,
    rating: 4.9,
    reviews: 2850,
  },
  {
    id: 'acharya-kn-rao',
    slug: 'acharya-kn-rao',
    name: 'Acharya K.N. Rao Ji',
    title: 'Kundli Expert & Shani Dasha Specialist',
    avatar: '/assets/portraits/acharya-kn-rao.jpg',
    rate: 51,
    rating: 4.8,
    reviews: 2400,
  },
  {
    id: 'vidushi-sunita-sharma',
    slug: 'vidushi-sunita-sharma',
    name: 'Vidushi Sunita Sharma',
    title: 'Tarot Grandmaster & Vedic Relationship Guide',
    avatar: '/assets/portraits/vidushi-sunita-sharma.jpg',
    rate: 45,
    rating: 4.9,
    reviews: 1530,
  },
];

export default function ConsultationRoom() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const astrologer =
    ASTROLOGERS_DIRECTORY.find((a) => a.slug === slug || a.id === slug) ||
    ASTROLOGERS_DIRECTORY[0];

  // Session state
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(true);
  const [isAudioCallActive, setIsAudioCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(150);

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'astrologer',
      text: `प्रणाम! मैं ${astrologer.name} हूँ। आपकी जन्म कुंडली और गोचर ग्रहों का अध्ययन करने हेतु तत्पर हूँ। आप करियर, विवाह, धन या ग्रह शांति के बारे में अपना प्रश्न पूछ सकते हैं।`,
      time: 'Just now',
      prescription: {
        title: 'दैनिक वैदिक शांति एवं इष्ट देव स्मरण',
        subtitle: 'VEDIC FOUNDATION REMEDY',
        text: 'नित्य प्रातः गायत्री मंत्र का 11 बार जप करें एवं सूर्य देव को तांबे के पात्र से जल अर्पित करें। यह आपकी आभा और मानसिक स्पष्टता को सुदृढ़ करेगा।',
        puja_cta: 'Explore Mandir Seva →',
        puja_link: '/mandir-seva',
      },
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showKundliDrawer, setShowKundliDrawer] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);

  const messagesEndRef = useRef(null);

  // Load wallet balance
  useEffect(() => {
    const saved = localStorage.getItem('astro_wallet_balance');
    if (saved !== null) {
      setWalletBalance(Number(saved));
    }
  }, [isWalletOpen]);

  // Session timer
  useEffect(() => {
    let timer = null;
    if (isLiveSessionActive) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLiveSessionActive]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSendMessage = (textToSend) => {
    const q = textToSend || inputText;
    if (!q.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: q.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Astrologer response simulation with deep Vedic personalization
    setTimeout(() => {
      let replyText = '';
      let prescription = null;
      const lower = q.toLowerCase();

      if (lower.includes('करियर') || lower.includes('career') || lower.includes('job') || lower.includes('राजयोग')) {
        replyText =
          'आपकी पत्रिका में दशम भाव का स्वामी उच्च राशिगत है और बृहस्पति की दृष्टि कर्म भाव पर पड़ रही है। आगामी 3 से 6 महीनों में कार्यक्षेत्र में अनुकूल स्थानांतरण और पदोन्नति के प्रबल योग निर्मित हो रहे हैं।';
        prescription = {
          title: 'सूर्य अर्घ्य एवं आदित्य हृदय स्तोत्र संकल्प',
          subtitle: 'VEDIC CAREER ENHANCER',
          text: 'नित्य प्रातः तांबे के लोटे से सूर्य देव को कुंकुम मिश्रित जल अर्पित करें और 21 बार गायत्री मंत्र का जप करें।',
          puja_cta: 'Book Surya Shanti Puja (₹251) →',
          puja_link: '/mandir-seva',
        };
      } else if (lower.includes('शादी') || lower.includes('marriage') || lower.includes('love') || lower.includes('विवाह')) {
        replyText =
          'सप्तम भाव में गुरु की शुभ दृष्टि होने से विवाह का अत्यंत शुभ मुहूर्त आगामी गुरु गोचर में सक्रिय हो रहा है। गुरुवार के दिन पीले पुष्प और चने की दाल का दान आपके दांपत्य सुख में स्थिरता प्रदान करेगा।';
        prescription = {
          title: 'गौरी शंकर एवं बृहस्पति शांति अनुष्ठान',
          subtitle: 'VIVAH BADHA NIVARAN',
          text: 'गुरुवार को केले के वृक्ष का विधिवत पूजन करें और माथे पर केसर अथवा हल्दी का तिलक लगाएं।',
          puja_cta: 'Book Gauri Shankar Puja (₹251) →',
          puja_link: '/mandir-seva/puja/somnath-jyotirlinga-gujarat',
        };
      } else if (lower.includes('शनि') || lower.includes('sade sati') || lower.includes('साढ़ेसाती')) {
        replyText =
          'आपकी कुंडली में शनि देव की साढ़ेसाती का प्रभाव कर्म स्थान पर पड़ रहा है। इसके निवारण हेतु हमने आपके लिए विशेष वैदिक उपाय निर्धारित किया है। नीचे दिए गए उपाय का नियमित पालन करें।';
        prescription = {
          title: 'शनि तैलाभिषेक एवं नीला पुखराज (Amethyst) उपाय',
          subtitle: 'AUTHENTIC SHASTRA REMEDY',
          text: 'नित्य शनिवार सायंकाल पीपल के नीचे तिल के तेल का दीपक एवं 108 बार ॐ शं शनैश्चराय नमः का जप करें।',
          puja_cta: 'Book Shani Puja (₹151) →',
          puja_link: '/mandir-seva/puja/shani-shingnapur',
        };
      } else if (lower.includes('रत्न') || lower.includes('gemstone')) {
        replyText =
          'आपके लग्न और राशि के अनुसार पंचमेश की अनुकूलता हेतु पीला पुखराज (Yellow Sapphire) अथवा 5-मुखी रुद्राक्ष चांदी में धारण करना अत्यंत फलदायी रहेगा।';
        prescription = {
          title: 'सर्टिफाइड 5-मुखी रुद्राक्ष माला धारण',
          subtitle: 'VEDIC RATNA RECOMMENDATION',
          text: 'शुभ शुक्ल पक्ष के सोमवार या गुरुवार को गंगाजल से शुद्ध कर धारण करें।',
          puja_cta: 'Order Consecrated Rudraksha (₹699) →',
          puja_link: '/astro-mall',
        };
      } else {
        replyText =
          'मैंने आपके प्रश्न का ग्रह-गोचर अनुसार सूक्ष्म विश्लेषण किया है। पराशरी सिद्धांत के अनुसार शुभ योग सक्रिय हैं। मन में एकाग्रता बनाए रखें और अपने इष्ट देव का स्मरण करें।';
      }

      const astroMsg = {
        id: Date.now() + 1,
        sender: 'astrologer',
        text: replyText,
        prescription: prescription,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, astroMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleEndConsultation = () => {
    setIsLiveSessionActive(false);
    setIsAudioCallActive(false);
    setShowSessionSummary(true);
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen flex flex-col justify-between">
      {/* 1. Consultation Topbar */}
      <header
        className="sticky top-0 z-40 bg-white border-b border-[#E7E2D8] px-4 py-3 shadow-xs flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {/* Back Exit */}
          <button
            type="button"
            onClick={() => navigate('/astrologers')}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer border-0"
            title="Exit Consultation"
          >
            ←
          </button>

          {/* Astrologer Badge */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 min-w-10 min-h-10 shrink-0 rounded-full overflow-hidden border-2 border-[#D9A441] shadow-xs bg-amber-50">
              <img
                src={astrologer.avatar}
                alt={astrologer.name}
                className="w-full h-full object-cover block"
                loading="eager"
                fetchPriority="high"
                onError={(e) => {
                  e.target.src = '/assets/portraits/pt-rameshwar-dwivedi.jpg';
                }}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h2 className="font-serif text-sm font-bold text-[#1E1B4B] leading-none">{astrologer.name}</h2>
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">✓</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                ● Live Consultation • ₹{astrologer.rate}/min
              </span>
            </div>
          </div>
        </div>

        {/* Right Session Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Call Pill */}
          <button
            type="button"
            onClick={() => setIsAudioCallActive(!isAudioCallActive)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${
              isAudioCallActive
                ? 'bg-purple-900 text-white border-purple-900 shadow-md animate-pulse'
                : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span>📞</span>
            <span className="hidden sm:inline">{isAudioCallActive ? 'In Audio Call' : 'Audio Call'}</span>
          </button>

          {/* Live Session Timer */}
          <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Live: {formatTimer(secondsElapsed)}</span>
          </div>

          {/* Wallet Balance */}
          <button
            type="button"
            onClick={() => setIsWalletOpen(true)}
            className="px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-extrabold cursor-pointer"
            title="Recharge wallet"
          >
            🪙 ₹{walletBalance.toFixed(0)}
          </button>

          {/* End Button */}
          <button
            type="button"
            onClick={handleEndConsultation}
            className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold cursor-pointer"
          >
            ⏹️ End
          </button>
        </div>
      </header>

      {/* 2. Planetary Context Strip */}
      <div className="bg-[#3E0B18] text-[#FFF9EF] px-4 py-2 text-xs flex items-center justify-between border-b border-amber-400/30">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <span>🪐 <strong>लग्न:</strong> सिंह (Leo)</span>
          <span>•</span>
          <span>🌟 <strong>नक्षत्र:</strong> मूल (Moola)</span>
          <span>•</span>
          <span>⏳ <strong>दशा:</strong> शनि महादशा (Saturn)</span>
        </div>
        <button
          type="button"
          onClick={() => setShowKundliDrawer(!showKundliDrawer)}
          className="text-amber-300 hover:text-white font-bold text-xs shrink-0 cursor-pointer bg-transparent border-0 ml-2"
        >
          {showKundliDrawer ? '▲ छुपाएं' : 'कुंडली देखें ▾'}
        </button>
      </div>

      {/* Kundli Drawer */}
      {showKundliDrawer && (
        <div className="bg-white border-b border-[#E7E2D8] p-4 shadow-sm animate-fadeIn">
          <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-4">
            <div className="w-32 h-32 border-2 border-amber-600 bg-amber-50/50 flex items-center justify-center text-xs font-bold text-[#3E0B18] text-center p-2 rounded-xl">
              [North Indian Lagna Chart (लग्न चक्र)]
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>Lagna Lord:</strong> Sun in 10th House (Digbali)</p>
              <p><strong>Benefic Planets:</strong> Jupiter, Mars, Venus</p>
              <p><strong>Current Transit:</strong> Jupiter 11th House Labha Drishti</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Chat Message Stream */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4 overflow-y-auto">
        {/* Welcoming Chamber Header */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7E2D8] text-center shadow-2xs mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B45309]">Private &amp; Secure Consultation</span>
          <p className="text-xs text-slate-500 mt-1">
            Certified Vedic guidance grounded in Parashari Shastras. All discussions are confidential.
          </p>
        </div>

        {/* Message Bubbles */}
        {messages.map((m) => {
          const isAstro = m.sender === 'astrologer';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isAstro ? 'justify-start' : 'justify-end'}`}
            >
              {isAstro && (
                <div className="w-8 h-8 min-w-8 min-h-8 rounded-full overflow-hidden border border-[#D9A441] shrink-0 mt-1 bg-amber-50">
                  <img src={astrologer.avatar} alt="Astrologer" className="w-full h-full object-cover block" onError={(e) => { e.target.src = "/assets/portraits/pt-rameshwar-dwivedi.jpg"; }} />
                </div>
              )}
              <div
                className={`max-w-[82%] sm:max-w-md p-3.5 rounded-2xl shadow-xs text-xs sm:text-sm leading-relaxed ${
                  isAstro
                    ? 'bg-white text-[#1E1B4B] border border-[#E7E2D8] rounded-tl-xs'
                    : 'bg-[#3E0B18] text-[#FFF9EF] rounded-tr-xs'
                }`}
              >
                {isAstro && (
                  <span className="font-serif text-[11px] font-bold text-[#B45309] block mb-1">
                    {astrologer.name}
                  </span>
                )}
                <p className="whitespace-pre-line">{m.text}</p>

                {/* In-Chat Vedic Remedy Prescription Card */}
                {m.prescription && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#FFFDF8] to-[#FDF7EB] border border-[#D9A441] shadow-xs text-left">
                    <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-[#B45309] mb-1">
                      <span>📜 {m.prescription.subtitle || 'VEDIC REMEDY PRESCRIPTION'}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-bold">
                        AUTHENTIC SHASTRA
                      </span>
                    </div>
                    <h4 className="font-serif text-xs sm:text-sm font-bold text-[#3E0B18] mb-1">
                      {m.prescription.title}
                    </h4>
                    <p className="text-xs text-slate-600 mb-2.5 leading-relaxed">
                      {m.prescription.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(m.prescription.puja_link || '/mandir-seva')}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#FFF9EF] bg-[#3E0B18] hover:bg-[#5B1324] shadow-xs cursor-pointer border-0 transition-all active:scale-95"
                      >
                        {m.prescription.puja_cta || 'Book Vedic Puja →'}
                      </button>
                      <button
                        type="button"
                        onClick={() => alert('उपाय आपकी प्रोफाइल में सुरक्षित कर दिया गया है। (Saved to Profile)')}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#78350F] bg-white border border-[#D9A441] hover:bg-amber-50 cursor-pointer transition-all"
                      >
                        Save to Profile
                      </button>
                    </div>
                  </div>
                )}

                <span className={`text-[10px] block text-right mt-2 ${isAstro ? 'text-slate-400' : 'text-amber-200/80'}`}>
                  {m.time}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic pl-10">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>{astrologer.name} is studying your chart and typing guidance...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* 4. Bottom Fixed Composer & Suggestions */}
      <footer className="sticky bottom-0 z-30 bg-[#FAF7F2] border-t border-[#E7E2D8] p-3 max-w-4xl w-full mx-auto">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-2">
          {[
            { label: '👑 राजयोग का प्रभाव?', q: 'क्या मेरी जन्म कुंडली में कोई शक्तिशाली राजयोग अथवा धन योग उपस्थित है?' },
            { label: '🪐 शनि शांति उपाय', q: 'क्या मुझ पर शनि की साढ़ेसाती या ढैय्या का प्रभाव है और इसके क्या शांति उपाय हैं?' },
            { label: '💎 भाग्यशाली रत्न?', q: 'मेरे भाग्योदय, स्वास्थ्य और सफलता के लिए कौन सा रत्न धारण करना चाहिए?' },
            { label: '💍 शादी का योग?', q: 'मेरी शादी का शुभ योग कब बनेगा और जीवनसाथी कैसा मिलेगा?' },
            { label: '💼 करियर तरक्की?', q: 'करियर में पदोन्नति और वेतन वृद्धि के योग कब हैं?' },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip.q)}
              className="px-3 py-1.5 rounded-full bg-white border border-[#E7E2D8] hover:border-amber-400 text-xs font-semibold text-[#1E1B4B] whitespace-nowrap cursor-pointer shadow-2xs transition-all"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Text Input Row */}
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-[#D8CCB5] p-2 shadow-xs focus-within:border-[#3E0B18]">
          <button
            type="button"
            onClick={() => alert('You can attach your palm photo or birth chart here.')}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer border-0"
            title="Attach file or palm image"
          >
            📎
          </button>
          <input
            type="text"
            placeholder="✦ Type your astrological question here (Press Enter to send)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-[#1E1B4B]"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-xl bg-[#3E0B18] text-[#FFF9EF] flex items-center justify-center font-bold text-sm cursor-pointer border-0 shadow-xs disabled:opacity-40 transition-all"
            title="Send Message"
          >
            ↑
          </button>
        </div>
      </footer>

      {/* 5. Live Audio Call Modal Overlay */}
      {isAudioCallActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#1E050B] text-white rounded-3xl p-8 text-center border border-amber-400/30 shadow-2xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#EFD4A0]">Live Audio Consultation</span>

            {/* Pulsing Avatar */}
            <div className="relative w-28 h-28 mx-auto">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping"></div>
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-[#D9A441] shadow-xl">
                <img src={astrologer.avatar} alt={astrologer.name} className="w-full h-full object-cover" />
              </div>
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-[#FFFDF8]">{astrologer.name}</h3>
              <p className="text-xs text-amber-200/80 mt-1">{astrologer.title}</p>
            </div>

            {/* Timer */}
            <div className="text-2xl font-mono font-bold text-emerald-400">
              {formatTimer(secondsElapsed)}
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg cursor-pointer border-0 ${
                  isMuted ? 'bg-rose-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🎙️'}
              </button>
              <button
                type="button"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg cursor-pointer border-0 ${
                  isSpeakerOn ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                }`}
                title="Speaker"
              >
                🔊
              </button>
              <button
                type="button"
                onClick={() => setIsAudioCallActive(false)}
                className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-lg cursor-pointer border-0 shadow-lg"
                title="Hang up call"
              >
                📞
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Session Ended Summary Modal */}
      {showSessionSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 text-center border border-[#E7E2D8] shadow-2xl">
            <span className="text-4xl block mb-2">🙏</span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">Session Completed</span>
            <h3 className="font-serif text-2xl font-bold text-[#1E1B4B] mt-1 mb-1">Consultation Summary</h3>
            <p className="text-xs text-slate-500 mb-6">
              Thank you for consulting with {astrologer.name}.
            </p>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs space-y-2.5 text-left mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Astrologer:</span>
                <strong className="text-[#1E1B4B]">{astrologer.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <strong className="text-[#1E1B4B]">{formatTimer(secondsElapsed)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rate:</span>
                <strong className="text-[#1E1B4B]">₹{astrologer.rate}/min</strong>
              </div>
              <div className="flex justify-between border-t border-amber-200/50 pt-2 text-sm font-bold">
                <span className="text-slate-700">Total Consultation Fee:</span>
                <strong className="text-[#3E0B18]">₹{Math.max(1, Math.ceil(secondsElapsed / 60)) * astrologer.rate}</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/astrologers')}
                className="flex-1 py-3 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md"
              >
                Back to Astrologers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Wallet Modal */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
}

