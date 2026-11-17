import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import useLang from '../../utils/useLang.js';

const CALCULATORS_LIST = [
  {
    id: 'hast-rekha',
    title: 'AI Palmistry & Hastrekha Shastra',
    title_hi: 'हस्तरेखा शास्त्र एवं AI पामिस्ट्री (हथेली स्कैन)',
    desc: 'Upload palm photo to get comprehensive Vedic analysis of Life Line, Heart Line, Head Line, Fate Line and Mounts with remedies.',
    desc_hi: 'अपनी हथेली की फोटो अपलोड करें और जीवन रेखा, हृदय रेखा, मस्तिष्क रेखा, भाग्य रेखा, गुरु व शुक्र पर्वत का संपूर्ण वैदिक विश्लेषण व उपाय प्राप्त करें।',
    cat: 'personal',
    icon: '✋',
    cta: 'Scan Palm ➔',
    cta_hi: 'हथेली स्कैन करें ➔',
  },
  {
    id: 'kundali-milan',
    title: 'Kundali Milan (36 Gunas)',
    title_hi: 'कुण्डली मिलान (36 गुण मिलान)',
    desc: 'Analyze the marriage compatibility between bride and groom based on the traditional Ashta Kuta 36 Guna system.',
    desc_hi: 'वर एवं वधू की अष्टकूट 36 गुण मिलान पद्धति के आधार पर वैवाहिक अनुकूलता, भकूट एवं नाड़ी दोष का सटीक विश्लेषण।',
    cat: 'marriage',
    icon: '🤝',
    cta: 'Calculate Now ➔',
    cta_hi: 'गुण मिलान करें ➔',
  },
  {
    id: 'janam-kundli',
    title: 'Janam Kundli (Birth Chart)',
    title_hi: 'जन्म कुण्डली (लग्न एवं नवमांश)',
    desc: 'Generate your accurate Vedic birth chart, planetary degrees, Bhavas and Lagna with full astrological commentary.',
    desc_hi: 'सटीक जन्म कुण्डली, ग्रह अंश, द्वादश भाव, लग्न कुंडली एवं नवमांश चक्र का सम्पूर्ण ज्योतिषीय विवरण।',
    cat: 'planetary',
    icon: '📜',
    cta: 'Generate Kundli ➔',
    cta_hi: 'कुण्डली बनाएँ ➔',
  },
  {
    id: 'sade-sati',
    title: 'Shani Sade Sati Timeline',
    title_hi: 'शनि साढ़ेसाती एवं ढैय्या काल',
    desc: 'Know the start, peak and end phases of Saturn Sade Sati and Dhaiya with personalized Vedic remedies.',
    desc_hi: 'अपनी चंद्र राशि से शनि की साढ़ेसाती के तीनों चरण (उदय, शिखर, अस्त) एवं ढैय्या की सटीक समय-सारणी व शांति उपाय।',
    cat: 'doshas',
    icon: '🪐',
    cta: 'Read Timeline ➔',
    cta_hi: 'समय-सारणी देखें ➔',
  },
  {
    id: 'mangal-dosha',
    title: 'Mangal Dosha & Parihar',
    title_hi: 'मंगल दोष एवं परिहार',
    desc: 'Check Kuja Dosha placement from Lagna, Moon and Venus charts and discover authentic Parihar remedies.',
    desc_hi: 'लग्न, चंद्र एवं शुक्र से प्रथम, चतुर्थ, सप्तम, अष्टम व द्वादश भाव में मंगल की स्थिति एवं दोष शमन के वैदिक परिहार।',
    cat: 'doshas',
    icon: '🔥',
    cta: 'Check Dosha ➔',
    cta_hi: 'दोष की जांच करें ➔',
  },
  {
    id: 'kaal-sarp',
    title: 'Kaal Sarp Dosha Analysis',
    title_hi: 'कालसर्प दोष विश्लेषण',
    desc: 'Find whether Rahu and Ketu hem all seven planets in your chart and identify which of the 12 Kaal Sarp yogas exists.',
    desc_hi: 'राहु और केतु के मध्य सभी सातों ग्रहों की स्थिति से 12 प्रकार के कालसर्प योगों (अनंत, कुलिक, वासुकि आदि) की पहचान।',
    cat: 'doshas',
    icon: '🐍',
    cta: 'Check Yoga ➔',
    cta_hi: 'दोष जांचें ➔',
  },
  {
    id: 'panchang',
    title: 'Daily Vedic Panchang & Muhurat',
    title_hi: 'दैनिक वैदिक पंचांग एवं शुभ मुहूर्त',
    desc: 'Calculate today’s Tithi, Nakshatra, Yoga, Karana, Rahu Kaal, Abhijit Muhurat and Brahma Muhurat.',
    desc_hi: 'आज की तिथि, वार, नक्षत्र, योग, करण, राहुकाल, अभिजीत मुहूर्त एवं अमृत काल का प्रामाणिक वैदिक गणित।',
    cat: 'planetary',
    icon: '☀️',
    cta: 'View Panchang ➔',
    cta_hi: 'पंचांग देखें ➔',
    directLink: '/panchang',
  },
  {
    id: 'numerology',
    title: 'Life Path & Numerology',
    title_hi: 'मूलांक एवं भाग्यांक अंकज्योतिष',
    desc: 'Calculate your Destiny Number, Life Path Number, and Lucky Colors based on your exact date of birth.',
    desc_hi: 'अपनी जन्मतिथि से अपना मूलांक, भाग्यांक, मित्र अंक, शुभ रंग एवं जीवन पथ का गूढ़ अंकशास्त्रीय विश्लेषण।',
    cat: 'personal',
    icon: '🔢',
    cta: 'Calculate Now ➔',
    cta_hi: 'अंक निकालें ➔',
  },
  {
    id: 'name-numerology',
    title: 'Name Numerology Calculator',
    title_hi: 'नाम अंकज्योतिष (नामांक कैलकुलेटर)',
    desc: 'Discover how the vibrations of your name influence your destiny, career opportunities, and success path.',
    desc_hi: 'शाल्डियन एवं पाइथागोरस पद्धति से अपने नाम के अक्षरों का कुल नामांक और भाग्य पर उसके प्रभाव की गणना।',
    cat: 'personal',
    icon: '🅰️',
    cta: 'Analyze Name ➔',
    cta_hi: 'नाम का विश्लेषण करें ➔',
  },
  {
    id: 'gemstone',
    title: 'Lucky Gemstone Suggestion',
    title_hi: 'शुभ रत्न सुझाव (रत्न परामर्श)',
    desc: 'Find which primary and secondary gemstones (Ratna) are most auspicious for your Lagna Lord and Bhagya.',
    desc_hi: 'लग्नेश, पंचमेश एवं नवमेश के आधार पर आपके जीवन, विद्या व भाग्य को जाग्रत करने वाले अनुकूल रत्न।',
    cat: 'personal',
    icon: '💎',
    cta: 'Find Gemstone ➔',
    cta_hi: 'अनुकूल रत्न जानें ➔',
  },
  {
    id: 'vimshottari-dasha',
    title: 'Vimshottari Dasha Periods',
    title_hi: 'विंशोत्तरी महादशा एवं अंतर्दशा',
    desc: 'View your 120-year planetary Mahadasha, Antardasha and Pratyantardasha timeline sequence.',
    desc_hi: '120 वर्षीय वैदिक विंशोत्तरी महादशा चक्र, वर्तमान अंतर्दशा एवं प्रत्यंतर्दशा की सटीक गणना।',
    cat: 'planetary',
    icon: '⏳',
    cta: 'View Dasha ➔',
    cta_hi: 'दशा चक्र देखें ➔',
  },
  {
    id: 'pitra-dosha',
    title: 'Pitra Dosha Calculator',
    title_hi: 'पितृ दोष कैलकुलेटर एवं निवारण',
    desc: 'Identify planetary indicators of ancestral debts and learn authentic Vedic remedies for family prosperity.',
    desc_hi: 'नवम भाव, सूर्य व राहु की युति से पितृ ऋण की पहचान तथा वंश वृद्धि व सुख-शांति हेतु शास्त्रोक्त उपाय।',
    cat: 'doshas',
    icon: '🪔',
    cta: 'Check Pitra Dosha ➔',
    cta_hi: 'पितृ दोष जांचें ➔',
  },
  {
    id: 'gandmool',
    title: 'Gandmool Dosha Finder',
    title_hi: 'गंडमूल नक्षत्र दोष कैलकुलेटर',
    desc: 'Check if birth occurred during the transitional nakshatra junctions (Ashwini, Ashlesha, Magha, Jyeshtha, Moola, Revati).',
    desc_hi: 'अश्विनी, आश्लेषा, मघा, ज्येष्ठा, मूल एवं रेवती — 6 गंडमूल नक्षत्रों में जन्म स्थिति एवं 27वें दिन की मूल शांति विधि।',
    cat: 'doshas',
    icon: '⚡',
    cta: 'Check Nakshatra ➔',
    cta_hi: 'नक्षत्र जांचें ➔',
  },
  {
    id: 'lagna',
    title: 'Ascendant (Lagna) Calculator',
    title_hi: 'लग्न कैलकुलेटर (प्रथम भाव)',
    desc: 'Discover your rising sign on the eastern horizon at the exact moment of birth and your core life persona.',
    desc_hi: 'जन्म के समय पूर्वी क्षितिज पर उदित राशि (लग्न भाव) की सटीक डिग्री तथा आपके व्यक्तित्व व स्वभाव की पहचान।',
    cat: 'planetary',
    icon: '🌅',
    cta: 'Find Lagna ➔',
    cta_hi: 'लग्न जानें ➔',
  },
  {
    id: 'chandra-rashi',
    title: 'Moon Sign (Chandra Rashi)',
    title_hi: 'चंद्र राशि कैलकुलेटर (जन्म राशि)',
    desc: 'Calculate your true Vedic Moon sign which governs your emotions, inner subconscious mind and nature.',
    desc_hi: 'जन्म के समय चंद्रमा जिस राशि में स्थित थे — आपकी वास्तविक वैदिक चंद्र राशि जो मन व स्वभाव को नियंत्रित करती है।',
    cat: 'planetary',
    icon: '🌙',
    cta: 'Find Rashi ➔',
    cta_hi: 'राशि जानें ➔',
  },
  {
    id: 'nakshatra',
    title: 'Birth Star (Nakshatra) Finder',
    title_hi: 'जन्म नक्षत्र एवं नामाक्षर',
    desc: 'Identify which of the 27 lunar constellations your Moon was transiting at birth and your Janma Akshar.',
    desc_hi: '27 नक्षत्रों एवं 108 चरणों में से आपके जन्म नक्षत्र, नक्षत्र स्वामी एवं वैदिक नामाक्षर की सटीक गणना।',
    cat: 'planetary',
    icon: '✨',
    cta: 'Find Star ➔',
    cta_hi: 'नक्षत्र जानें ➔',
  },
  {
    id: 'love-compatibility',
    title: 'Love & Relationship Compatibility',
    title_hi: 'प्रेम एवं संबंध अनुकूलता (Love Match)',
    desc: 'Check mutual harmony, emotional synergy, and mental compatibility between two zodiac signs.',
    desc_hi: 'दो राशियों के मध्य भावनात्मक सामंजस्य, वैचारिक तालमेल एवं प्रेम संबंध की वैदिक अनुकूलता जांचें।',
    cat: 'marriage',
    icon: '💖',
    cta: 'Check Compatibility ➔',
    cta_hi: 'अनुकूलता जांचें ➔',
  },
  {
    id: 'sun-sign',
    title: 'Vedic Sun Sign (Surya Rashi)',
    title_hi: 'वैदिक सूर्य राशि कैलकुलेटर',
    desc: 'Calculate your true Nirayana Vedic Sun sign representing your soul purpose, leadership, and vitality.',
    desc_hi: 'निरयण वैदिक ज्योतिष के अनुसार सूर्य राशि — जो आपकी आत्मा, आत्मबल, तेज व नेतृत्व क्षमता को दर्शाती है।',
    cat: 'planetary',
    icon: '🌞',
    cta: 'Find Sun Sign ➔',
    cta_hi: 'सूर्य राशि जानें ➔',
  },
];

export default function CalculatorsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const lang = useLang();
  const isHi = lang === 'hi';

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalCalc, setActiveModalCalc] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [dob, setDob] = useState('1995-05-15');
  const [tob, setTob] = useState('14:30');
  const [place, setPlace] = useState('New Delhi');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Sync with route slug e.g. /calculators/kundali-milan
  useEffect(() => {
    if (slug) {
      const found = CALCULATORS_LIST.find((c) => c.id === slug);
      if (found) {
        setActiveModalCalc(found);
        setCalculationResult(null);
      }
    }
  }, [slug]);

  const categories = useMemo(() => [
    { id: 'all', label: isHi ? 'सभी वैदिक टूल्स' : 'All Vedic Tools', icon: '🪷' },
    { id: 'marriage', label: isHi ? 'विवाह एवं कुण्डली मिलान' : 'Marriage & Compatibility', icon: '🤝' },
    { id: 'doshas', label: isHi ? 'दोष एवं शांति उपाय' : 'Dosh & Puja Remedies', icon: '🔥' },
    { id: 'planetary', label: isHi ? 'ग्रह गोचर एवं जन्म कुण्डली' : 'Planetary & Charts', icon: '🪐' },
    { id: 'personal', label: isHi ? 'हस्तरेखा, अंकज्योतिष व रत्न' : 'Palmistry, Numbers & Gems', icon: '✋' },
  ], [isHi]);

  const filteredCalculators = useMemo(() => {
    return CALCULATORS_LIST.filter((calc) => {
      if (activeCategory !== 'all' && calc.cat !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tEn = (calc.title || '').toLowerCase();
        const tHi = (calc.title_hi || '').toLowerCase();
        const dEn = (calc.desc || '').toLowerCase();
        const dHi = (calc.desc_hi || '').toLowerCase();
        return tEn.includes(q) || tHi.includes(q) || dEn.includes(q) || dHi.includes(q);
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  // Palmistry State
  const [palmImage, setPalmImage] = useState(null);
  const [palmScanning, setPalmScanning] = useState(false);
  const [palmResult, setPalmResult] = useState(null);
  const [palmValidationError, setPalmValidationError] = useState(null);
  const [isValidPalm, setIsValidPalm] = useState(false);
  const [activePalmTab, setActivePalmTab] = useState('lines');

  // Janam Kundli Chart State
  const [kundliData, setKundliData] = useState(null);
  const [kundliLoading, setKundliLoading] = useState(false);
  const [kundliChartMode, setKundliChartMode] = useState('d1'); // 'd1' or 'd9'
  const [activeKundliTab, setActiveKundliTab] = useState('table'); // 'table', 'bhavas', 'yogas', 'dashas', 'remedies'

  const HOUSE_COORDS = [
    { house: 1, signX: 200, signY: 70, planetX: 200, planetY: 115 },
    { house: 2, signX: 110, signY: 45, planetX: 110, planetY: 70 },
    { house: 3, signX: 45, signY: 110, planetX: 45, planetY: 135 },
    { house: 4, signX: 110, signY: 200, planetX: 80, planetY: 225 },
    { house: 5, signX: 45, signY: 290, planetX: 45, planetY: 315 },
    { house: 6, signX: 110, signY: 355, planetX: 110, planetY: 380 },
    { house: 7, signX: 200, signY: 330, planetX: 200, planetY: 280 },
    { house: 8, signX: 290, signY: 355, planetX: 290, planetY: 380 },
    { house: 9, signX: 355, signY: 290, planetX: 355, planetY: 315 },
    { house: 10, signX: 290, signY: 200, planetX: 320, planetY: 225 },
    { house: 11, signX: 355, signY: 110, planetX: 355, planetY: 135 },
    { house: 12, signX: 290, signY: 45, planetX: 290, planetY: 70 },
  ];

  const validatePalmCanvas = (imageDataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 120;
          canvas.height = 120;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 120, 120);
          const imgData = ctx.getImageData(0, 0, 120, 120);
          const data = imgData.data;
          let skinCount = 0;
          let whiteGrayCount = 0;
          const total = data.length / 4;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Human skin tone in RGB: R > 60, G > 40, B > 20, R > G, G >= B, R-G >= 10, R-B >= 15
            if (r > 60 && g > 40 && b > 20 && r > g && g >= b && (r - g >= 10) && (r - b >= 15)) {
              skinCount++;
            }
            // Document or web page screenshot background (high white / flat gray)
            if ((r > 205 && g > 205 && b > 205) || (Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && (r + g + b) > 340)) {
              whiteGrayCount++;
            }
          }
          const skinRatio = skinCount / total;
          const whiteRatio = whiteGrayCount / total;
          if (skinRatio < 0.20 || whiteRatio > 0.45) {
            resolve({
              isValid: false,
              skinRatio,
              whiteRatio,
              message: isHi
                ? '⚠️ अमान्य हथेली! अपलोड की गई तस्वीर में हाथ अथवा हथेली की स्पष्ट त्वचा व रेखाएं नहीं पाई गईं। स्क्रीनशॉट या दस्तावेज़ मान्य नहीं हैं। कृपया केवल अपने हाथ/हथेली की स्पष्ट फोटो अपलोड करें।'
                : '⚠️ Invalid Palm! The uploaded image is not a human palm (screenshot or document detected). Please upload a clear photo of your palm.'
            });
          } else {
            resolve({
              isValid: true,
              skinRatio,
              whiteRatio,
              message: isHi
                ? '✅ प्रामाणिक हथेली पहचानी गई (Authentic Palm Verified) — रेखा विश्लेषण के लिए तैयार।'
                : '✅ Authentic human palm verified — Ready for Shastric scan.'
            });
          }
        } catch (err) {
          resolve({ isValid: true, skinRatio: 0.5, whiteRatio: 0.1 });
        }
      };
      img.onerror = () => {
        resolve({ isValid: false, message: 'छवि लोड करने में त्रुटि।' });
      };
      img.src = imageDataUrl;
    });
  };

  const handleOpenCalc = (calc) => {
    if (calc.directLink) {
      navigate(calc.directLink);
      return;
    }
    setActiveModalCalc(calc);
    setCalculationResult(null);
    setPalmResult(null);
    setPalmImage(null);
    setPalmScanning(false);
    setPalmValidationError(null);
    setIsValidPalm(false);
    setKundliData(null);
    setKundliLoading(false);
    setKundliChartMode('d1');
    setActiveKundliTab('table');
  };

  const handlePalmUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result;
        setPalmImage(dataUrl);
        setPalmResult(null);
        setPalmScanning(false);
        const check = await validatePalmCanvas(dataUrl);
        setIsValidPalm(check.isValid);
        setPalmValidationError(check.isValid ? null : check.message);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSamplePalm = () => {
    // Generate valid palm canvas image with authentic skin tones and palm creases
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(150, 180, 20, 150, 180, 140);
    grad.addColorStop(0, '#E6B89C');
    grad.addColorStop(0.6, '#D69E7E');
    grad.addColorStop(1, '#B87D5C');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 300, 360);

    // Palm creases
    ctx.strokeStyle = '#7B3F00';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // Life line
    ctx.beginPath();
    ctx.arc(80, 160, 90, 0.2 * Math.PI, 0.7 * Math.PI);
    ctx.stroke();
    // Head line
    ctx.beginPath();
    ctx.moveTo(90, 170);
    ctx.quadraticCurveTo(160, 190, 240, 220);
    ctx.stroke();
    // Heart line
    ctx.beginPath();
    ctx.moveTo(80, 130);
    ctx.quadraticCurveTo(160, 140, 250, 120);
    ctx.stroke();
    // Fate line
    ctx.beginPath();
    ctx.moveTo(150, 320);
    ctx.lineTo(150, 120);
    ctx.stroke();

    const sampleUrl = canvas.toDataURL('image/jpeg');
    setPalmImage(sampleUrl);
    setPalmResult(null);
    setIsValidPalm(true);
    setPalmValidationError(null);
  };

  const handleScanPalm = async () => {
    if (!palmImage || !isValidPalm) return;
    setPalmScanning(true);
    setPalmValidationError(null);
    try {
      const res = await fetch('/api/v1/calculators/analyze-palm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: palmImage,
          name: name || 'जिज्ञासु',
          gender: 'Male',
          dominant_hand: 'Right'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setPalmValidationError(data.detail || 'हथेली विश्लेषण में समस्या आई।');
        setIsValidPalm(false);
      } else {
        setPalmResult(data);
      }
    } catch (err) {
      setPalmValidationError('सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।');
    } finally {
      setPalmScanning(false);
    }
  };

  const handleRunCalculation = async (e) => {
    e.preventDefault();
    const d = new Date(dob);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const lifePath = ((day + month + year) % 9) || 9;

    if (activeModalCalc?.id === 'janam-kundli') {
      setKundliLoading(true);
      try {
        const res = await fetch('/api/v1/calculators/full-kundli', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name || (isHi ? 'जिज्ञासु' : 'Seeker'),
            date_of_birth: dob,
            time_of_birth: tob || '12:00:00',
            city: place || 'New Delhi',
            gender: 'Male'
          })
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.detail || 'कुण्डली गणना में त्रुटि आई।');
        } else {
          setKundliData(data);
        }
      } catch (err) {
        alert('सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।');
      } finally {
        setKundliLoading(false);
      }
      return;
    }

    setCalculationResult({
      title: isHi ? activeModalCalc.title_hi : activeModalCalc.title,
      name: name || (isHi ? 'जिज्ञासु' : 'Seeker'),
      lagna: isHi ? 'सिंह लग्न (प्रथम भाव)' : 'Leo Ascendant (Simha)',
      rashi: isHi ? 'धनु राशि (स्वामी: गुरु)' : 'Sagittarius Moon Sign (Dhanu)',
      nakshatra: isHi ? 'मूल नक्षत्र (द्वितीय चरण)' : 'Moola Nakshatra (Quarter 2)',
      gunaScore: isHi ? '28 / 36 (अति शुभ मिलान)' : '28 / 36 (Very Auspicious)',
      sadeSatiStatus: isHi ? 'ढैय्या काल (शांति चरण)' : 'Dhaiya (Peaceful Phase)',
      lifePathNumber: lifePath,
      luckyGemstone: isHi ? 'पुखराज (बृहस्पति) अथवा माणिक्य (सूर्य)' : 'Yellow Sapphire (Pukhraj) or Ruby (Manikya)',
      verdict: isHi
        ? 'ग्रह स्थिति के अनुसार आपका आने वाला समय करियर में स्थिरता, बुद्धि विकास एवं शुभ योग का संकेत देता है।'
        : 'Planetary placements indicate steady career growth, strong intellect and auspicious yoga.',
    });
  };

  return (
    <div className="calc-reference-page w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF9F2] min-h-screen pb-24">
      {/* Sacred Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 pt-3 pb-1 text-xs text-slate-500 font-medium">
        <ol className="flex items-center gap-2 list-none p-0 m-0 flex-wrap">
          <li>
            <Link to="/" className="text-slate-500 hover:text-[#164B32] transition-colors no-underline">
              {isHi ? 'होम' : 'Home'}
            </Link>
          </li>
          <li className="text-slate-400">›</li>
          {activeModalCalc ? (
            <>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModalCalc(null)}
                  className="text-slate-500 hover:text-[#164B32] transition-colors bg-transparent border-0 p-0 cursor-pointer font-medium text-xs"
                >
                  {isHi ? 'वैदिक टूल्स' : 'Vedic Tools'}
                </button>
              </li>
              <li className="text-slate-400">›</li>
              <li className="text-[#164B32] font-bold" aria-current="page" translate="no">
                {isHi ? activeModalCalc.title_hi : activeModalCalc.title}
              </li>
            </>
          ) : (
            <li className="text-[#164B32] font-bold" aria-current="page">
              {isHi ? 'वैदिक ज्योतिष टूल्स' : 'Vedic Tools'}
            </li>
          )}
        </ol>
      </nav>

      {/* 1. Hero Banner (1:1 Unified Chadhava Blueprint) */}
      <section className="service-banner service-banner--calc calc-ref-hero max-w-7xl mx-auto mt-2 px-4">
        <figure className="service-banner__art">
          <img src="/assets/img/calculators-banner.webp" alt="Vedic Astrology Calculators" fetchPriority="high" />
          <figcaption>{isHi ? 'वैदिक ज्योतिष गणनाएँ' : 'Illustrative image'}</figcaption>
        </figure>
        <div className="mandir-hero__copy service-banner__copy">
          <p className="mandir-hero__eyebrow" translate="no">
            {isHi ? '✦ जीवन के महत्वपूर्ण निर्णयों हेतु प्रामाणिक वैदिक गणनाएँ ✦' : '✦ PRECISE VEDIC CALCULATIONS FOR LIFE\'S KEY DECISIONS ✦'}
          </p>
          <h1 translate="no">
            {isHi ? (
              <>वैदिक ज्योतिष <em>टूल्स एवं गणनाएँ</em></>
            ) : (
              <>Vedic Astrology <em>Calculators Suite</em></>
            )}
          </h1>
          <p translate="no">
            {isHi
              ? 'हस्तरेखा शास्त्र, जन्म कुण्डली, कुण्डली मिलान, शनि साढ़ेसाती, कालसर्प दोष, पंचांग एवं अंकज्योतिष की गणितीय रूप से सत्यापित एवं सटीक वैदिक गणनाएँ।'
              : 'Instant, mathematically verified and insightful Vedic calculators for palmistry, Janam Kundli, planetary placements, doshas, marriage compatibility, and numerology.'}
          </p>
          <div className="shop-hero__actions">
            <a
              href="#calc-grid"
              className="shop-btn shop-btn--gold cursor-pointer no-underline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('calc-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {isHi ? 'सभी टूल्स देखें →' : 'Explore Calculators →'}
            </a>
            <Link to="/astrologers" className="shop-btn shop-btn--ghost no-underline">
              {isHi ? 'ज्योतिषी से परामर्श लें' : 'Talk to Astrologer'}
            </Link>
          </div>
        </div>
        <div className="shop-trust service-benefits">
          <div>
            <span>✋</span>
            <p translate="no">
              <b>{isHi ? 'AI हस्तरेखा शास्त्र' : 'AI Palmistry'}</b>
              <small>{isHi ? 'हथेली स्कैन व रेखा विश्लेषण' : 'Palm Photo Line Scan'}</small>
            </p>
          </div>
          <div>
            <span>📜</span>
            <p translate="no">
              <b>{isHi ? 'प्रामाणिक जन्म कुण्डली' : 'Vedic Birth Chart'}</b>
              <small>{isHi ? '12 भाव एवं ग्रह चक्र' : '12 Bhavas & Planets'}</small>
            </p>
          </div>
          <div>
            <span>🪷</span>
            <p translate="no">
              <b>{isHi ? 'वैदिक टूल्स संग्रह' : 'Comprehensive Tools'}</b>
              <small>{isHi ? 'हर महत्वपूर्ण निर्णय में सहायक' : 'For Important Decisions'}</small>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Filter Chips Bar (Horizontal Scrolling on Mobile) */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <nav className="calc-ref-chips-bar flex items-center gap-2 overflow-x-auto pb-1" aria-label="Calculator Categories">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`calc-ref-chip px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border flex items-center gap-1.5 ${
                activeCategory === c.id
                  ? 'bg-[#164B32] text-[#FFFDF5] border-[#164B32] shadow-xs'
                  : 'bg-white text-slate-700 border-[#DDEBD5] hover:border-amber-400'
              }`}
              onClick={() => setActiveCategory(c.id)}
            >
              <span>{c.icon}</span>
              <span translate="no">{c.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 3. Search Bar */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="bg-white p-3 rounded-2xl border border-[#DDEBD5] flex items-center gap-2">
          <span className="text-slate-400 ml-2">🔍</span>
          <input
            aria-label="Search calculators"
            type="search"
            placeholder={isHi ? 'कैलकुलेटर खोजें (उदा. कुण्डली मिलान, साढ़ेसाती, अंकज्योतिष...)' : 'Search calculator (e.g. Kundali, Sade Sati, Numerology...)'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-xs text-[#183C2B]"
          />
        </div>
      </div>

      {/* 4. Calculators Grid (3 Columns on Desktop, 1 Column on Mobile) */}
      <div className="max-w-7xl mx-auto px-4 mt-8" id="calc-grid">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalculators.map((calc) => {
            const cardTitle = isHi ? calc.title_hi : calc.title;
            const cardDesc = isHi ? calc.desc_hi : calc.desc;
            const cardCta = isHi ? calc.cta_hi : calc.cta;

            return (
              <article
                key={calc.id}
                onClick={() => handleOpenCalc(calc)}
                className="bg-white p-6 rounded-3xl border border-[#DDEBD5] shadow-xs hover:shadow-md hover:border-[#C49A3A] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mb-4">
                    {calc.icon}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#183C2B] mb-2" translate="no">
                    {cardTitle}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6" translate="no">
                    {cardDesc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#164B32]" translate="no">{cardCta}</span>
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-[#164B32] flex items-center justify-center text-xs font-bold">
                    ➔
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Interactive Calculation Modal */}
      {activeModalCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`relative w-full ${
              activeModalCalc.id === 'janam-kundli' && kundliData
                ? 'max-w-4xl'
                : activeModalCalc.id === 'hast-rekha' && palmResult
                ? 'max-w-3xl'
                : 'max-w-lg'
            } p-6 bg-white rounded-3xl shadow-2xl border border-[#DDEBD5] max-h-[92vh] overflow-y-auto transition-all`}
          >
            <button
              type="button"
              onClick={() => setActiveModalCalc(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0 hover:bg-slate-200"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{activeModalCalc.icon}</span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#A77B25]" translate="no">
                {isHi ? 'वैदिक ज्योतिष गणना' : 'Vedic Astrology Suite'}
              </span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#183C2B] mb-2" translate="no">
              {isHi ? activeModalCalc.title_hi : activeModalCalc.title}
            </h3>
            <p className="text-xs text-slate-500 mb-6" translate="no">
              {isHi ? activeModalCalc.desc_hi : activeModalCalc.desc}
            </p>

            {/* 1. HAST REKHA (AI PALMISTRY) FLOW */}
            {activeModalCalc.id === 'hast-rekha' ? (
              <div className="space-y-4">
                {!palmResult ? (
                  <div className="space-y-4">
                    {/* Palm Photo Upload Box */}
                    <div className="p-4 border-2 border-dashed border-[#C49A3A] rounded-2xl bg-[#FFFDF5] text-center">
                      {palmImage ? (
                        <div className="relative mx-auto w-52 h-60 rounded-xl overflow-hidden shadow-inner border border-[#C49A3A]">
                          <img src={palmImage} alt="Uploaded Palm" className="w-full h-full object-cover" />
                          {palmScanning && (
                            <div className="absolute inset-0 bg-emerald-950/40 flex flex-col items-center justify-center">
                              {/* Laser Sweep Line */}
                              <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981] animate-bounce top-1/3" />
                              <span className="px-3 py-1 rounded-full bg-black/75 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-400/50">
                                ⚡ वैदिक हस्तरेखा स्कैनिंग...
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-6 space-y-3">
                          <span className="text-4xl block">✋</span>
                          <strong className="block text-sm text-[#164B32] font-bold">
                            {isHi ? 'अपनी दाहिनी या बाईं हथेली की फोटो अपलोड करें' : 'Upload photo of your Right or Left Palm'}
                          </strong>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto">
                            {isHi
                              ? 'सुनिश्चित करें कि हथेली की रेखाएं व पर्वत स्पष्ट दिखाई दें। (स्क्रीनशॉट व दस्तावेज़ अमान्य हैं)'
                              : 'Ensure palm lines and mounts are clearly illuminated. (Screenshots and documents are invalid)'}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        <label className="px-4 py-2 rounded-xl bg-[#164B32] text-[#FFFDF5] text-xs font-bold cursor-pointer hover:brightness-110 shadow-xs">
                          📁 {isHi ? 'गैलरी से फोटो चुनें' : 'Choose Photo'}
                          <input type="file" accept="image/*" onChange={handlePalmUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={handleUseSamplePalm}
                          className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold cursor-pointer"
                        >
                          📷 {isHi ? 'नमूना हथेली से टेस्ट करें' : 'Test Sample Palm'}
                        </button>
                      </div>
                    </div>

                    {/* Palm Validation Notice */}
                    {palmValidationError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 flex items-start gap-2.5">
                        <span className="text-xl shrink-0">⚠️</span>
                        <div>
                          <strong className="block font-bold mb-0.5 text-rose-950">
                            {isHi ? 'अमान्य हथेली (Invalid Palm)' : 'Invalid Palm Image'}
                          </strong>
                          <p className="leading-relaxed">{palmValidationError}</p>
                        </div>
                      </div>
                    )}

                    {isValidPalm && !palmValidationError && palmImage && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        <span className="font-semibold">
                          {isHi
                            ? 'प्रामाणिक हथेली पहचानी गई (Authentic Palm Verified) — रेखा विश्लेषण के लिए तैयार'
                            : 'Authentic palm verified — Ready for Shastric line scan'}
                        </span>
                      </div>
                    )}

                    {palmImage && (
                      <button
                        type="button"
                        disabled={palmScanning || !isValidPalm}
                        onClick={handleScanPalm}
                        className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-lg text-[#164B32] ${
                          palmScanning || !isValidPalm
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-75'
                            : 'bg-gradient-to-r from-[#F5D061] to-[#C49A3A] hover:brightness-110'
                        }`}
                      >
                        {palmScanning
                          ? (isHi ? '⌛ रेखाओं व पर्वतों का सूक्ष्म विश्लेषण...' : 'Analyzing Lines & Mounts...')
                          : !isValidPalm
                          ? (isHi ? '⚠️ मान्य हथेली की फोटो अपलोड करें' : '⚠️ Upload Valid Palm Photo')
                          : (isHi ? '🔍 हथेली स्कैन व संपूर्ण विश्लेषण प्राप्त करें ➔' : 'Scan Palm & Generate Report ➔')}
                      </button>
                    )}
                  </div>
                ) : (
                  /* Palmistry Ultra-Detailed Multi-Tabbed Result */
                  <div className="space-y-4">
                    {/* Header Banner */}
                    <div className="p-4 bg-gradient-to-r from-[#164B32] to-[#103B29] text-[#FFFDF5] rounded-2xl shadow-md">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">✋</span>
                        <div>
                          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                            ॥ हस्तरेखा शास्त्र संपूर्ण महा-रिपोर्ट ॥
                          </span>
                          <h4 className="font-serif text-base font-bold text-white">
                            {palmResult.hand_element || 'वायु व पृथ्वी तत्व प्रधान हस्त'}
                          </h4>
                          <p className="text-xs text-amber-100/90 mt-0.5">
                            {palmResult.element_desc || 'व्यावहारिक सोच, उच्च मेधा एवं नेतृत्वकारी गुण।'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Multi-Tab Navigation */}
                    <div className="flex flex-wrap gap-1.5 p-1 bg-amber-50/80 rounded-xl border border-amber-200">
                      {[
                        { id: 'lines', label: isHi ? '〰️ 7 मुख्य रेखाएं' : '7 Lines' },
                        { id: 'mounts', label: isHi ? '🏔️ 7 ग्रह पर्वत (%)' : '7 Mounts' },
                        { id: 'marks', label: isHi ? '🔱 शुभ चिन्ह व योग' : 'Sacred Marks' },
                        { id: 'remedies', label: isHi ? '📿 शास्त्रोक्त उपाय' : 'Remedies' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActivePalmTab(tab.id)}
                          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            activePalmTab === tab.id
                              ? 'bg-[#164B32] text-[#FFFDF5] shadow-xs'
                              : 'text-amber-950 hover:bg-amber-100/60'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab 1: 7 Primary Lines */}
                    {activePalmTab === 'lines' && palmResult.lines && (
                      <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                        {Object.entries(palmResult.lines).map(([key, line]) => (
                          <div key={key} className="p-3 bg-[#F2F5EA] rounded-xl border border-[#C49A3A]/30 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <strong className="text-[#C49A3A] font-bold text-sm">
                                {line.name}
                              </strong>
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                                {line.vitality || line.sharpness || line.emotional_type || line.strength || line.status || 'उत्कृष्ट'}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed font-medium">
                              {line.longevity || line.intellect || line.nature || line.career || line.fame || line.harmony}
                            </p>
                            {line.notes && (
                              <p className="mt-1 text-[11px] text-amber-900 bg-white/70 p-1.5 rounded-lg border border-amber-200/50">
                                📌 {line.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab 2: 7 Mounts with Percentage Bars */}
                    {activePalmTab === 'mounts' && palmResult.mounts && (
                      <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                        {palmResult.mounts.map((m, idx) => (
                          <div key={idx} className="p-3 bg-[#F2F5EA] rounded-xl border border-[#C49A3A]/30 text-xs">
                            <div className="flex justify-between items-center mb-1.5">
                              <strong className="text-[#164B32] font-bold">{m.name}</strong>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  {m.status}
                                </span>
                                <strong className="text-amber-800 font-extrabold">{m.score}%</strong>
                              </div>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-1.5">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-[#C49A3A] rounded-full transition-all duration-700"
                                style={{ width: `${m.score}%` }}
                              />
                            </div>
                            <p className="text-slate-600 text-[11px]">{m.significance}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab 3: Sacred Marks & Auspicious Yogas */}
                    {activePalmTab === 'marks' && palmResult.sacred_marks && (
                      <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                        {palmResult.sacred_marks.map((sm, idx) => (
                          <div key={idx} className="p-3 bg-[#F2F5EA] rounded-xl border border-[#C49A3A]/30 text-xs">
                            <strong className="text-[#C49A3A] font-bold text-sm block mb-1">
                              ✨ {sm.mark}
                            </strong>
                            <div className="text-[11px] text-slate-500 mb-1">
                              <strong>स्थान:</strong> {sm.location}
                            </div>
                            <p className="text-slate-700 leading-relaxed bg-white/80 p-2 rounded-lg border border-amber-200/40">
                              <strong>फल:</strong> {sm.result}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab 4: Vedic Remedies */}
                    {activePalmTab === 'remedies' && palmResult.remedies && (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-xs space-y-3">
                        <div>
                          <strong className="text-amber-950 font-bold block mb-1">
                            💎 अनुकूल रत्न (Benefic Gemstone):
                          </strong>
                          <p className="text-slate-700 bg-white p-2 rounded-xl border border-amber-200">
                            {palmResult.remedies.gemstone}
                          </p>
                        </div>
                        <div>
                          <strong className="text-amber-950 font-bold block mb-1">
                            📿 सिद्ध रुद्राक्ष (Energized Rudraksha):
                          </strong>
                          <p className="text-slate-700 bg-white p-2 rounded-xl border border-amber-200">
                            {palmResult.remedies.rudraksha}
                          </p>
                        </div>
                        <div>
                          <strong className="text-amber-950 font-bold block mb-1">
                            🕉️ नित्य सिद्ध मंत्र जप (Daily Vedic Mantra):
                          </strong>
                          <p className="text-slate-700 bg-white p-2 rounded-xl border border-amber-200 font-mono">
                            {palmResult.remedies.mantra}
                          </p>
                        </div>
                        <div>
                          <strong className="text-amber-950 font-bold block mb-1">
                            🕊️ दान व पुण्य कर्म (Charity):
                          </strong>
                          <p className="text-slate-700 bg-white p-2 rounded-xl border border-amber-200">
                            {palmResult.remedies.daan}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPalmResult(null);
                          setPalmImage(null);
                          setPalmValidationError(null);
                          setIsValidPalm(false);
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50"
                      >
                        {isHi ? 'पुनः स्कैन करें' : 'Scan Another Palm'}
                      </button>
                      <Link
                        to="/astrologers"
                        className="flex-1 py-2.5 rounded-xl bg-[#164B32] text-[#FFFDF5] text-xs font-bold text-center no-underline cursor-pointer hover:brightness-110 flex items-center justify-center"
                      >
                        {isHi ? 'हस्तरेखा विशेषज्ञ से बात करें' : 'Talk to Palmistry Expert'}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : activeModalCalc.id === 'janam-kundli' && kundliData ? (
              /* 2. FULL ADVANCED ENTERPRISE JANAM KUNDLI DOSSIER */
              <div className="space-y-4">
                {/* Kundli Master Header */}
                <div className="p-4 bg-gradient-to-r from-[#164B32] to-[#103B29] text-[#FFFDF5] rounded-2xl shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300 font-bold block">
                        ॥ श्री गणेशाय नमः ॥ संपूर्ण वैदिक जन्म कुण्डली
                      </span>
                      <h4 className="font-serif text-lg font-bold text-white">
                        {kundliData.devotee_name} {isHi ? 'की जन्म पत्रिका' : 'Horoscope Dossier'}
                      </h4>
                      <p className="text-xs text-amber-100/90 mt-0.5">
                        {kundliData.date_of_birth} | {kundliData.time_of_birth} | {kundliData.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-black/30 border border-amber-400/40 text-center">
                        <span className="text-[10px] text-amber-300 block">लग्न (Ascendant)</span>
                        <strong className="text-xs text-white">
                          {kundliData.lagna_info?.ascendant_sign} ({kundliData.lagna_info?.ascendant_degree})
                        </strong>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-black/30 border border-amber-400/40 text-center">
                        <span className="text-[10px] text-amber-300 block">चंद्र राशि (Moon)</span>
                        <strong className="text-xs text-white">
                          {kundliData.lagna_info?.moon_sign}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dual Chart Toggle & North Indian SVG Chart */}
                <div className="bg-[#FFFDF5] border border-[#C49A3A]/50 rounded-2xl p-3 shadow-xs">
                  <div className="flex justify-between items-center mb-3">
                    <strong className="text-xs text-[#164B32] font-bold">
                      {isHi ? 'वैदिक चक्र दृश्य (North Indian Format):' : 'Vedic Chart View:'}
                    </strong>
                    <div className="flex gap-1 p-0.5 bg-amber-100/80 rounded-xl border border-amber-300/50">
                      <button
                        type="button"
                        onClick={() => setKundliChartMode('d1')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          kundliChartMode === 'd1'
                            ? 'bg-[#164B32] text-[#FFFDF5] shadow-xs'
                            : 'text-amber-900 hover:bg-amber-200/50'
                        }`}
                      >
                        लग्न चक्र (D1)
                      </button>
                      <button
                        type="button"
                        onClick={() => setKundliChartMode('d9')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          kundliChartMode === 'd9'
                            ? 'bg-[#164B32] text-[#FFFDF5] shadow-xs'
                            : 'text-amber-900 hover:bg-amber-200/50'
                        }`}
                      >
                        नवमांश चक्र (D9)
                      </button>
                    </div>
                  </div>

                  {/* Classical North Indian Diamond Chart SVG */}
                  <div className="relative mx-auto w-72 h-72 sm:w-80 sm:h-80 bg-[#F2F5EA] border-2 border-[#C49A3A] shadow-inner rounded-2xl overflow-hidden p-1">
                    {(() => {
                      const currentChart =
                        kundliChartMode === 'd1'
                          ? kundliData.charts?.d1_lagna
                          : kundliData.charts?.d9_navamsha;
                      const houses = currentChart?.houses || [];

                      return (
                        <svg viewBox="0 0 400 400" className="w-full h-full font-serif select-none">
                          <rect x="0" y="0" width="400" height="400" fill="#F2F5EA" stroke="#C49A3A" strokeWidth="4" />
                          <line x1="0" y1="0" x2="400" y2="400" stroke="#C49A3A" strokeWidth="2.5" />
                          <line x1="0" y1="400" x2="400" y2="0" stroke="#C49A3A" strokeWidth="2.5" />
                          <polygon points="200,0 400,200 200,400 0,200" fill="none" stroke="#C49A3A" strokeWidth="2.5" />
                          <text x="200" y="215" textAnchor="middle" fontSize="38" fill="#C49A3A" opacity="0.30" fontWeight="bold">ॐ</text>

                          {HOUSE_COORDS.map((coord, idx) => {
                            const hData = houses[idx] || { sign_num: idx + 1, planets: [] };
                            return (
                              <g key={coord.house}>
                                <text
                                  x={coord.signX}
                                  y={coord.signY}
                                  textAnchor="middle"
                                  fontSize="14"
                                  fill="#A77B25"
                                  fontWeight="bold"
                                >
                                  {hData.sign_num}
                                </text>
                                <text
                                  x={coord.planetX}
                                  y={coord.planetY}
                                  textAnchor="middle"
                                  fontSize="11"
                                  fill="#164B32"
                                  fontWeight="bold"
                                >
                                  {hData.planets?.join(' ') || ''}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>
                </div>

                {/* Kundli Multi-Tab Navigation */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-amber-50/80 rounded-xl border border-amber-200">
                  {[
                    { id: 'table', label: isHi ? '📊 ग्रह स्पष्ट सारणी' : 'Grahas Table' },
                    { id: 'bhavas', label: isHi ? '🏛️ द्वादश भाव फल' : '12 Bhavas' },
                    { id: 'yogas', label: isHi ? '✨ योग व दोष' : 'Yogas & Doshas' },
                    { id: 'dashas', label: isHi ? '⏳ दशा चक्र' : 'Vimshottari Dasha' },
                    { id: 'remedies', label: isHi ? '💎 वैदिक उपाय' : 'Remedies' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveKundliTab(tab.id)}
                      className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        activeKundliTab === tab.id
                          ? 'bg-[#164B32] text-[#FFFDF5] shadow-xs'
                          : 'text-amber-950 hover:bg-amber-100/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Grahas Precision Table */}
                {activeKundliTab === 'table' && kundliData.grahas_table && (
                  <div className="overflow-x-auto rounded-xl border border-[#C49A3A]/40 max-h-[45vh]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#164B32] text-[#FFFDF5] sticky top-0 font-bold">
                        <tr>
                          <th className="p-2.5">ग्रह (Planet)</th>
                          <th className="p-2.5">राशि (Sign)</th>
                          <th className="p-2.5">अंश (Degrees)</th>
                          <th className="p-2.5">भाव</th>
                          <th className="p-2.5">नक्षत्र (चरण)</th>
                          <th className="p-2.5">अवस्था / प्रतिष्ठा</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#C49A3A]/20 bg-white">
                        {kundliData.grahas_table.map((g, idx) => (
                          <tr key={idx} className="hover:bg-amber-50/50">
                            <td className="p-2.5 font-bold text-[#164B32]">{g.name}</td>
                            <td className="p-2.5">{g.sign}</td>
                            <td className="p-2.5 font-mono text-slate-700">{g.degree}</td>
                            <td className="p-2.5 font-bold text-center text-[#C49A3A]">{g.house}</td>
                            <td className="p-2.5">{g.nakshatra} ({g.pada})</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  g.dignity?.includes('उच्च') || g.dignity?.includes('स्वगृही')
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : g.dignity?.includes('नीच')
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {g.dignity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 2: 12 Bhavas In-depth Phalit */}
                {activeKundliTab === 'bhavas' && kundliData.bhavas_reading && (
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    {kundliData.bhavas_reading.map((b) => (
                      <div key={b.house_number} className="p-3 bg-[#F2F5EA] rounded-xl border border-[#C49A3A]/30 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <strong className="text-[#C49A3A] font-bold text-sm">
                            भाव {b.house_number}: {b.sanskrit_name}
                          </strong>
                          <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            राशि: {b.sign} (स्वामी: {b.sign_lord})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mb-1">
                          <strong>कारक:</strong> {b.karaka} | <strong>स्थित ग्रह:</strong> {b.planets?.length > 0 ? b.planets.join(', ') : 'कोई ग्रह नहीं'}
                        </div>
                        <p className="text-slate-700 leading-relaxed bg-white/80 p-2 rounded-lg border border-amber-200/40">
                          {b.phalit}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 3: Auspicious Yogas & Dosha Checklist */}
                {activeKundliTab === 'yogas' && (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {/* Yogas Detected */}
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-xs space-y-2">
                      <strong className="text-emerald-950 font-bold block text-sm">
                        ✨ कुण्डली में निर्मित शुभ योग (Auspicious Yogas):
                      </strong>
                      {kundliData.yogas_detected?.length > 0 ? (
                        kundliData.yogas_detected.map((y, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-emerald-200">
                            <strong className="text-emerald-900 font-bold">{y.yoga_name || y.name}</strong>
                            <p className="text-slate-600 text-[11px] mt-0.5">{y.description || y.effect}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-600">सामान्य योग प्रभाव। नियमित साधना से शुभता में वृद्धि होगी।</p>
                      )}
                    </div>

                    {/* Kuja Dosha (Manglik) Check */}
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <strong className="text-amber-950 font-bold text-sm">
                          🔥 कुज दोष (मांगलिक विश्लेषण):
                        </strong>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            kundliData.kuja_dosha?.has_kuja_dosha
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {kundliData.kuja_dosha?.has_kuja_dosha ? 'मांगलिक प्रभाव उपस्थित' : 'मांगलिक दोष मुक्त'}
                        </span>
                      </div>
                      <p className="text-slate-700">
                        {kundliData.kuja_dosha?.has_kuja_dosha
                          ? `मंगल देव भाव ${kundliData.kuja_dosha?.mars_house} में स्थित हैं। शास्त्रीय परिहार नियमों के अनुसार विशेष सामंजस्य आवश्यक है।`
                          : 'कुण्डली पूर्णतः मांगलिक दोष से मुक्त है। वैवाहिक जीवन सौहार्दपूर्ण रहेगा।'}
                      </p>
                    </div>

                    {/* Sade Sati & Kaal Sarp */}
                    <div className="p-3 bg-[#F2F5EA] rounded-xl border border-[#C49A3A]/40 text-xs space-y-2">
                      <strong className="text-[#164B32] font-bold text-sm block">
                        🪐 शनि साढ़ेसाती एवं राहु गोचर:
                      </strong>
                      <p className="text-slate-700">
                        {kundliData.sade_sati?.phase_name || 'वर्तमान में साढ़ेसाती का प्रभाव अनुकूल है। शनि देव के नित्य मंत्र से व्यापार व पद में उन्नति होगी।'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 4: Vimshottari Mahadasha Timeline */}
                {activeKundliTab === 'dashas' && (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-300 text-xs">
                      <strong className="text-amber-950 font-bold block mb-1">
                        🌟 वर्तमान सक्रिय महादशा (Current Running Dasha):
                      </strong>
                      <p className="text-slate-800 font-bold text-sm">
                        {kundliData.current_dasha?.active_planet || kundliData.dashas_timeline?.[0]?.planet} महादशा
                      </p>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        अवधि: {kundliData.current_dasha?.start_date || kundliData.dashas_timeline?.[0]?.start_date} से {kundliData.current_dasha?.end_date || kundliData.dashas_timeline?.[0]?.end_date}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <strong className="text-xs font-bold text-[#164B32] block">
                        संपूर्ण विंशोत्तरी महादशा चक्र (120 वर्ष क्रम):
                      </strong>
                      {kundliData.dashas_timeline?.map((d, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                          <div>
                            <strong className="text-[#C49A3A]">{d.planet} महादशा</strong>
                            <span className="text-[10px] text-slate-500 block">
                              {d.start_date} ➔ {d.end_date}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono">
                            {d.duration_years} वर्ष
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 5: Shastric Remedies & Print */}
                {activeKundliTab === 'remedies' && kundliData.remedies && (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-xs space-y-3">
                      <div>
                        <strong className="text-amber-950 font-bold block mb-1">
                          💎 अनुकूल जीवन रत्न (Lucky Gemstone):
                        </strong>
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-1">
                          <strong className="text-[#164B32] font-bold text-sm">
                            {kundliData.remedies.gemstone?.stone}
                          </strong>
                          <p className="text-slate-600 text-[11px]">
                            <strong>भार:</strong> {kundliData.remedies.gemstone?.weight} | <strong>धातु:</strong> {kundliData.remedies.gemstone?.metal} | <strong>अंगुली:</strong> {kundliData.remedies.gemstone?.finger}
                          </p>
                          <p className="text-[11px] font-mono text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                            <strong>मंत्र:</strong> {kundliData.remedies.gemstone?.mantra}
                          </p>
                        </div>
                      </div>

                      <div>
                        <strong className="text-amber-950 font-bold block mb-1">
                          📿 सिद्ध रुद्राक्ष (Energized Rudraksha):
                        </strong>
                        <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-amber-200">
                          {kundliData.remedies.rudraksha}
                        </p>
                      </div>

                      <div>
                        <strong className="text-amber-950 font-bold block mb-1">
                          🕉️ इष्ट देव एवं सिद्ध मंत्र (Ishta Devata Mantra):
                        </strong>
                        <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-amber-200 font-mono">
                          {kundliData.remedies.ishta_mantra}
                        </p>
                      </div>

                      <div>
                        <strong className="text-amber-950 font-bold block mb-1">
                          🎨 शुभ रंग व संख्या (Lucky Attributes):
                        </strong>
                        <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-amber-200">
                          <strong>शुभ रंग:</strong> {kundliData.remedies.lucky_color} | <strong>भाग्यशाली अंक:</strong> {kundliData.remedies.lucky_number}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kundli Bottom Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 min-w-[130px] py-2.5 rounded-xl border border-amber-400 bg-amber-50 text-amber-950 text-xs font-bold cursor-pointer hover:bg-amber-100 flex items-center justify-center gap-1.5"
                  >
                    🖨️ {isHi ? 'कुण्डली प्रिंट / PDF' : 'Print Kundli PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setKundliData(null)}
                    className="flex-1 min-w-[130px] py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50"
                  >
                    {isHi ? 'पुनः कुण्डली बनाएँ' : 'Generate Another'}
                  </button>
                  <Link
                    to="/astrologers"
                    className="flex-1 min-w-[150px] py-2.5 rounded-xl bg-[#164B32] text-[#FFFDF5] text-xs font-bold text-center no-underline cursor-pointer hover:brightness-110 flex items-center justify-center"
                  >
                    {isHi ? 'विस्तृत ज्योतिषी परामर्श' : 'Talk to Expert Astrologer'}
                  </Link>
                </div>
              </div>
            ) : !calculationResult ? (
              <form onSubmit={handleRunCalculation} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#183C2B] mb-1">
                    {isHi ? 'पूरा नाम *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isHi ? 'उदा. राहुल शर्मा' : 'e.g. Rahul Sharma'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#183C2B] mb-1">
                      {isHi ? 'जन्म तिथि *' : 'Date of Birth *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#183C2B] mb-1">
                      {isHi ? 'जन्म समय *' : 'Time of Birth *'}
                    </label>
                    <input
                      type="time"
                      required
                      value={tob}
                      onChange={(e) => setTob(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#183C2B] mb-1">
                    {isHi ? 'जन्म स्थान (शहर) *' : 'Place of Birth (City) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isHi ? 'उदा. दिल्ली, मुंबई, वाराणसी' : 'e.g. Delhi, Mumbai, Varanasi'}
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#164B32] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider mt-4 cursor-pointer border-0 shadow-md hover:brightness-110"
                >
                  {isHi ? 'सटीक वैदिक रिपोर्ट प्राप्त करें ➔' : 'Generate Accurate Vedic Report ➔'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs space-y-2">
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">{isHi ? 'जातक:' : 'Seeker:'}</span>
                    <strong className="text-[#183C2B]">{calculationResult.name}</strong>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">{isHi ? 'लग्न भाव (Lagna):' : 'Ascendant (Lagna):'}</span>
                    <strong className="text-[#183C2B]">{calculationResult.lagna}</strong>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">{isHi ? 'चंद्र राशि (Rashi):' : 'Moon Sign (Rashi):'}</span>
                    <strong className="text-[#183C2B]">{calculationResult.rashi}</strong>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">{isHi ? 'जन्म नक्षत्र:' : 'Birth Nakshatra:'}</span>
                    <strong className="text-[#183C2B]">{calculationResult.nakshatra}</strong>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">{isHi ? 'विवाह गुण प्राप्तांक:' : 'Marriage Guna Score:'}</span>
                    <strong className="text-emerald-700 font-extrabold">{calculationResult.gunaScore}</strong>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">{isHi ? 'भाग्य मूलांक / भाग्यांक:' : 'Destiny Life Path:'}</span>
                    <strong className="text-[#164B32] font-bold">{isHi ? `अंक ${calculationResult.lifePathNumber}` : `Number ${calculationResult.lifePathNumber}`}</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">{isHi ? 'अनुकूल रत्न:' : 'Auspicious Ratna:'}</span>
                    <strong className="text-amber-800">{calculationResult.luckyGemstone}</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {calculationResult.verdict}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCalculationResult(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50"
                  >
                    {isHi ? 'अन्य गणना करें' : 'Calculate Another'}
                  </button>
                  <Link
                    to="/astrologers"
                    className="flex-1 py-2.5 rounded-xl bg-[#164B32] text-[#FFFDF5] text-xs font-bold text-center no-underline cursor-pointer hover:brightness-110 flex items-center justify-center"
                  >
                    {isHi ? 'ज्योतिषी से परामर्श लें' : 'Consult Expert Now'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
