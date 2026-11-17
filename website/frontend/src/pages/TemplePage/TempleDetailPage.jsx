import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useLocation } from 'react-router-dom';
import SevaBookingDialog from '../MandirSevaPage/SevaBookingDialog.jsx';
import { money, useLang, useRequest, CATEGORY_LABEL } from '../MandirSevaPage/mandirApi.js';

// One temple: its story, aarti times, priests, ready thali combos, custom offering basket and
// other sacred sevas. Benchmarked for authentic devotional clarity, transparency and Hindu tradition.

const GROUPS_HI = [
  ['abhishek', '🔱 पावन अभिषेक सेवा'],
  ['sankalp_pooja', '✨ संकल्प पूजा एवं अनुष्ठान'],
  ['chadawa', '🪔 अन्य विशेष मंदिर सेवा'],
];

const GROUPS_EN = [
  ['abhishek', '🔱 Sacred Abhishek Seva'],
  ['sankalp_pooja', '✨ Sankalp Puja & Rituals'],
  ['chadawa', '🪔 Other Sacred Temple Sevas'],
];

const LIVE_EN = { 'बुकिंग उपलब्ध': 'Booking available' };

const DEFAULT_AARTIS = [
  { name: 'भस्म आरती', time: 'प्रातः 04:00 AM', name_en: 'Bhasma Aarti' },
  { name: 'श्रृंगार आरती', time: 'प्रातः 07:30 AM', name_en: 'Shringar Aarti' },
  { name: 'संध्या आरती', time: 'सायं 07:00 PM', name_en: 'Sandhya Aarti' },
  { name: 'शयन आरती', time: 'रात्रि 10:30 PM', name_en: 'Shayan Aarti' }
];

const DEFAULT_PRIESTS = [
  { name: 'पंडित राधेश्याम शर्मा', name_en: 'Pt. Radheshyam Sharma', role: 'मुख्य पुजारी', role_en: 'Chief Sanctum Priest', exp: '25 वर्ष अनुभव', verified: true },
  { name: 'आचार्य विष्णुदत्त द्विवेदी', name_en: 'Acharya Vishnudatta Dwivedi', role: 'वैदिक कर्मकांडी', role_en: 'Vedic Ritualist', exp: '18 वर्ष अनुभव', verified: true }
];

const AARTI_TRANSLATIONS = {
  'भस्म आरती': 'Bhasma Aarti',
  'श्रृंगार आरती': 'Shringar Aarti',
  'संध्या आरती': 'Sandhya Aarti',
  'शयन आरती': 'Shayan Aarti',
  'मंगला आरती': 'Mangala Aarti',
  'भोग आरती': 'Bhog Aarti',
  'सप्तर्षि आरती': 'Saptarshi Aarti',
  'प्रातः 04:00 AM': '04:00 AM (Dawn)',
  'प्रातः 07:30 AM': '07:30 AM (Morning)',
  'सायं 07:00 PM': '07:00 PM (Evening)',
  'रात्रि 10:30 PM': '10:30 PM (Night)',
  'प्रातः 03:00 AM': '03:00 AM (Dawn)',
  'दोपहर 11:30 AM': '11:30 AM (Midday)'
};

const PRIEST_ROLE_TRANSLATIONS = {
  'मुख्य पुजारी': 'Chief Sanctum Priest',
  'वैदिक कर्मकांडी': 'Vedic Ritualist & Anushthan Expert',
  '25 वर्ष अनुभव': '25 yrs Vedic exp',
  '18 वर्ष अनुभव': '18 yrs Vedic exp',
  '20 वर्ष अनुभव': '20 yrs Vedic exp',
  '15 वर्ष अनुभव': '15 yrs Vedic exp'
};

const ITEM_NAME_EN = {
  'अष्टगंध चंदन': 'Sandalwood (Chandan)',
  'ताजे पुष्प': 'Fresh Flowers',
  'गुग्गुल धूप': 'Guggul Incense',
  'देशी घी दीपक': 'Desi Ghee Lamp',
  'नैवेद्य/मिश्री': 'Naivedya / Mishri',
  'पवित्र गंगाजल': 'Holy Gangajal',
  'कच्चा गाय का दूध': 'Raw Cow Milk',
  'पंचामृत': 'Panchamrit',
  '108 बेलपत्र': '108 Bilva Patra',
  'सिद्ध भस्म': 'Sacred Bhasma',
  'अखंड दीप': 'Akhand Ghee Lamp',
  'विशेष महाभोग थाली': 'Special Mahabhog Thali',
  '16 श्रृंगार / पीतांबर': '16 Shringar / Pitambar',
  'पुष्पमाला': 'Fresh Garland',
  'श्रीफल नारियल': 'Holy Coconut',
  'अखंड दीप व धूप': 'Akhand Lamp & Dhoop'
};

const HISTORY_EN = {
  'mahakaleshwar-ujjain': 'Situated in ancient Avantika Puri, Shri Mahakaleshwar is the only south-facing (Dakshinmukhi) swayambhu Jyotirlinga among the twelve holy shrines. Revered in the Shiva Purana, offering holy bhasma, bilva leaves and sacred water here dispels premature death fears and brings boundless spiritual peace.',
  'kashi-vishwanath-varanasi': 'Standing on the sacred banks of the Ganges in Varanasi, Kashi Vishwanath is the eternal abode of Lord Shiva (Vishweshwar). Scriptural traditions hold that a sacred offering of Gangajal and bilva patra here frees the devotee from cycles of rebirth and grants eternal spiritual elevation.',
  'shani-shingnapur': 'World-renowned open-sky shrine in Ahmednagar where Lord Shani Dev resides as a self-manifested black stone idol. Devoutly offering pure mustard oil and black sesame pacifies Sade Sati, Dhaiya, and planetary afflictions.',
  'kamakhya-devi-assam': 'Perched atop Nilachal Hill in Guwahati, Maa Kamakhya is the supreme tantric Shaktipeeth where the divine creative energy of Goddess Sati resides. Offering red chunri, sindoor and shringar brings all-round prosperity and protection.',
  'siddhivinayak-mumbai': 'The revered abode of Lord Ganesha in Prabhadevi, Mumbai, known to grant immediate wish fulfillment and remove obstacles from all endeavours through modak and durva grass offerings.',
  'somnath-jyotirlinga-gujarat': 'The foremost of the twelve sacred Jyotirlingas, situated on the western coast of Saurashtra. Mentioned in Rigveda, worship here restores divine grace and inner peace.',
  'kedarnath-dham-uttarakhand': 'Nestled amid Himalayan snows at 3,583m in the Rudraprayag district, Kedarnath is the holiest Himalayan Shiva shrine where Pandavas sought redemption.',
  'ram-janmabhoomi-ayodhya': 'The sacred birthplace of Lord Shri Ram on the banks of Sarayu in Ayodhya, embodying righteousness, dharma, and supreme divine protection.',
  'tirupati-balaji-andhra': 'Venkateswara Swamy temple atop the Seven Hills of Tirumala, celebrated as the Kali Yuga Vaikuntha granting liberation and wealth.',
  'vaishno-devi-katra': 'Holy cave shrine in the Trikuta mountains of Jammu & Kashmir, radiating the combined cosmic energies of Maha Kali, Maha Lakshmi and Maha Saraswati.'
};

const FALLBACK_COMBOS = [
  {
    id: 'combo_panchopchar',
    slug: 'combo-panchopchar',
    title: 'पंचोपचार चढ़ावा थाली',
    title_en: 'Panchopchar Offering Thali',
    price: 101,
    emoji: '🪔',
    tag: 'पारंपरिक नित्य सेवा',
    tag_en: 'Traditional Daily Seva',
    description: 'गंध (चंदन), पुष्प, गुग्गुल धूप, देशी घी दीपक एवं नैवेद्य (मिश्री) का संपूर्ण शास्त्रीय पंचोपचार अर्पण।',
    desc_en: 'Complete 5-fold scriptural offering of sandalwood, fresh flowers, incense, desi ghee lamp & misri naivedya.',
    items_included: ['अष्टगंध चंदन', 'ताजे पुष्प', 'गुग्गुल धूप', 'देशी घी दीपक', 'नैवेद्य/मिश्री'],
    items_included_en: ['Chandan', 'Fresh Flowers', 'Guggul Dhoop', 'Desi Ghee Lamp', 'Naivedya']
  },
  {
    id: 'combo_rudra_abhishek',
    slug: 'combo-rudra-abhishek',
    title: 'रुद्र अभिषेक व भस्म अर्पण थाली',
    title_en: 'Rudra Abhishek & Bhasma Thali',
    price: 251,
    emoji: '🔱',
    tag: 'महाकाल व शिव विशेष',
    tag_en: 'Mahakal & Shiva Special',
    description: 'पवित्र गंगाजल, कच्चा गाय का दूध, पंचामृत, 108 बेलपत्र, सिद्ध भस्म एवं अखंड देशी घी दीपक अर्पण।',
    desc_en: 'Holy Gangajal, raw cow milk, panchamrit, 108 bilva patra, energized bhasma & akhand pure ghee lamp dedication.',
    items_included: ['पवित्र गंगाजल', 'कच्चा गाय का दूध', 'पंचामृत', '108 बेलपत्र', 'सिद्ध भस्म', 'अखंड दीप'],
    items_included_en: ['Gangajal', 'Raw Cow Milk', 'Panchamrit', '108 Bilva Patra', 'Sacred Bhasma', 'Akhand Lamp']
  },
  {
    id: 'combo_mahabhog_shringar',
    slug: 'combo-mahabhog-shringar',
    title: 'संपूर्ण महाभोग व श्रृंगार थाली',
    title_en: 'Sampoorna Mahabhog & Shringar Thali',
    price: 501,
    emoji: '🌺',
    tag: 'सर्वमनोकामना सिद्धि',
    tag_en: 'All Desires Fulfilled',
    description: 'विशेष महाभोग थाली (पंचमेवा व मिष्ठान), 16 श्रृंगार सामग्री / पीतांबर, ताजे फूलों की माला, नारियल व धूप-दीप।',
    desc_en: 'Royal sanctum mahabhog, 16 shringar offerings / pitambar attire, fresh garland, coconut and sacred lamps.',
    items_included: ['विशेष महाभोग थाली', '16 श्रृंगार / पीतांबर', 'पुष्पमाला', 'श्रीफल नारियल', 'अखंड दीप व धूप'],
    items_included_en: ['Mahabhog Thali', '16 Shringar / Pitambar', 'Fresh Garland', 'Coconut', 'Akhand Lamp & Dhoop']
  }
];

const FALLBACK_ITEMS = [
  { id: 'item_belpatra_108', key: 'belpatra_108', title: '108 बेलपत्र अर्पण', title_en: '108 Bilva Patra Offering', price: 51, emoji: '🍃', tag: 'महादेव हेतु', tag_en: 'For Lord Shiva', cat: 'leaves', desc: 'महादेव को अति प्रिय, त्रिदोष व पाप नाशक', desc_en: 'Sacred bilva leaves dedicated to Lord Shiva for planetary relief and peace.' },
  { id: 'item_gangajal', key: 'gangajal', title: 'पवित्र गंगाजल अभिषेक', title_en: 'Holy Gangajal Abhishek', price: 21, emoji: '💧', tag: 'पावन अभिषेक', tag_en: 'Sacred Abhishek', cat: 'abhishek', desc: 'शिवलिंग व शालिग्राम हेतु परम पावन', desc_en: 'Pious Ganga jal poured over the sanctum deity.' },
  { id: 'item_milk', key: 'milk', title: 'कच्चा गाय का दूध (दुग्धाभिषेक)', title_en: 'Raw Cow Milk Abhishek', price: 31, emoji: '🥛', tag: 'दुग्धाभिषेक', tag_en: 'Milk Abhishek', cat: 'abhishek', desc: 'आरोग्यता व मानसिक शांति प्रदायक', desc_en: 'Pure unboiled desi cow milk offering for health and tranquility.' },
  { id: 'item_panchamrit', key: 'panchamrit', title: 'पंचामृत अर्पण (दूध, दही, घी, शहद, गंगाजल)', title_en: 'Panchamrit Offering', price: 51, emoji: '🍯', tag: 'पंचामृत अभिषेक', tag_en: 'Panchamrit Abhishek', cat: 'abhishek', desc: 'पंचतत्वों की शुद्धि एवं सर्वसुख प्राप्ति', desc_en: 'Nectar of five holy ingredients: cow milk, curd, desi ghee, honey and Gangajal.' },
  { id: 'item_bhasma', key: 'bhasma', title: 'पवित्र भस्म अर्पण', title_en: 'Sacred Bhasma Offering', price: 21, emoji: '🕉️', tag: 'महाकाल विशेष', tag_en: 'Mahakal Special', cat: 'abhishek', desc: 'विशेषकर महाकाल ज्योतिर्लिंग व भैरव जी', desc_en: 'Holy sanctified bhasma dedication at Mahakaleshwar Jyotirlinga.' },
  { id: 'item_ghee_diya', key: 'ghee_diya', title: 'अखंड देशी घी का दीपक / दीपदान', title_en: 'Akhand Desi Ghee Lamp', price: 51, emoji: '🪔', tag: 'अखंड दीप', tag_en: 'Akhand Lamp', cat: 'diya', desc: 'अंधकार निवारण व ज्ञान-प्रकाश', desc_en: 'Continuous pure cow ghee lamp lit before the sanctum.' },
  { id: 'item_dhatura', key: 'dhatura', title: 'धतूरा, मदार व आंकड़े के पुष्प', title_en: 'Dhatura & Madar Flowers', price: 21, emoji: '🌸', tag: 'शिव साधना', tag_en: 'Shiva Sadhana', cat: 'leaves', desc: 'शत्रु बाधा व ग्रह कष्ट निवारण', desc_en: 'Sacred flowers offered to pacify planetary afflictions.' },
  { id: 'item_mala', key: 'mala', title: 'सुगंधित ताजे फूलों की माला', title_en: 'Fresh Fragrant Flower Garland', price: 31, emoji: '💐', tag: 'पुष्प श्रृंगार', tag_en: 'Flower Shringar', cat: 'leaves', desc: 'भगवान का दिव्य नयनाभिराम श्रृंगार', desc_en: 'Artisan hand-strung fragrant flower garland adorning the deity.' },
  { id: 'item_dhoop', key: 'dhoop', title: 'गुग्गुल धूप व अगरबत्ती', title_en: 'Guggul Dhoop & Incense', price: 21, emoji: '🌿', tag: 'वास्तु शुद्धि', tag_en: 'Sanctum Purification', cat: 'diya', desc: 'पवित्र वातावरण व नकारात्मकता नाश', desc_en: 'Aromatic guggul and herbal dhoop for spiritual elevation.' },
  { id: 'item_mustard_oil', key: 'mustard_oil', title: 'शुद्ध सरसों का तेल व काले तिल', title_en: 'Pure Mustard Oil & Black Sesame', price: 51, emoji: '🛢️', tag: 'शनि शांति', tag_en: 'Shani Shanti', cat: 'oil', desc: 'शनि शिंगणापुर / शनि साढ़ेसाती शांति हेतु', desc_en: 'Special holy oil offering for Shani Sade Sati and dhaiya pacification.' },
  { id: 'item_chola', key: 'chola', title: 'सिंदूर व चोला अर्पण', title_en: 'Sindoor & Chola Offering', price: 51, emoji: '🔴', tag: 'हनुमान कृपा', tag_en: 'Hanuman Blessings', cat: 'oil', desc: 'संकटमोचन हनुमान जी व भैरव जी हेतु', desc_en: 'Devotional red vermillion chola dedication for courage and protection.' },
  { id: 'item_shringar', key: 'shringar', title: 'लाल चुनरी, नारियल व 16 श्रृंगार', title_en: 'Red Chunri, Coconut & 16 Shringar', price: 101, emoji: '🧣', tag: 'शक्तिपीठ विशेष', tag_en: 'Shaktipeeth Special', cat: 'shringar', desc: 'माँ कामाख्या, वैष्णो देवी शक्तिपीठ', desc_en: 'Bridal chunri and complete sixteen adornments for the Divine Mother.' },
  { id: 'item_durva', key: 'durva', title: 'दूर्वा घास व मोदक अर्पण', title_en: 'Durva Grass & Modak Offering', price: 51, emoji: '🌱', tag: 'विघ्नहर्ता', tag_en: 'Obstacle Removal', cat: 'leaves', desc: 'सिद्धिविनायक श्री गणेश विघ्नहर्ता', desc_en: 'Sacred green blades and sweet modaks for Lord Ganesha.' },
  { id: 'item_makhan', key: 'makhan', title: 'तुलसी दल व माखन-मिश्री', title_en: 'Tulsi Leaves & Makhan Mishri', price: 51, emoji: '🌿', tag: 'माखन भोग', tag_en: 'Makhan Bhog', cat: 'bhog', desc: 'बांके बिहारी, द्वारकाधीश, रामलला हेतु', desc_en: 'Fresh churned butter and auspicious tulsi leaves for Lord Krishna.' },
  { id: 'item_bhog', key: 'bhog', title: 'विशेष महाभोग थाली / पंचमेवा प्रसाद', title_en: 'Special Mahabhog & Dry Fruit Prasad', price: 151, emoji: '🍛', tag: 'अन्नपूर्णा', tag_en: 'Annapurna Prasad', cat: 'bhog', desc: 'संपूर्ण तृप्ति व अन्नपूर्णा आशीर्वाद', desc_en: 'Rich royal sanctum food offering prepared in holy ghee.' },
  { id: 'item_dhwaja', key: 'dhwaja', title: 'केसरिया धर्म ध्वजा', title_en: 'Saffron Dharma Dhwaja Flag', price: 51, emoji: '🚩', tag: 'धर्म रक्षा', tag_en: 'Dharma Flag', cat: 'shringar', desc: 'विजय, धर्म रक्षा व कीर्ति', desc_en: 'Sacred saffron temple flag hoisted in devotee’s name.' },
  { id: 'item_vastra', key: 'vastra', title: 'पीतांबर / पवित्र वस्त्र अर्पण', title_en: 'Pitambar / Sacred Silk Attire', price: 101, emoji: '🧵', tag: 'दिव्य वस्त्र', tag_en: 'Divine Attire', cat: 'shringar', desc: 'परम पावन वस्त्र अर्पण', desc_en: 'Sanctified silk cloth offered to the deity.' },
];

const ITEM_FILTER_TABS = [
  { id: 'all', label_hi: 'सभी सामग्रियां', label_en: 'All Offerings' },
  { id: 'leaves', label_hi: '🍃 पत्र व पुष्प', label_en: '🍃 Leaves & Flowers' },
  { id: 'abhishek', label_hi: '💧 अभिषेक व जल', label_en: '💧 Abhishek & Water' },
  { id: 'diya', label_hi: '🪔 दीप व धूप', label_en: '🪔 Lamp & Incense' },
  { id: 'oil', label_hi: '🛢️ तेल व सिंदूर', label_en: '🛢️ Oil & Sindoor' },
  { id: 'shringar', label_hi: '🧣 श्रृंगार व वस्त्र', label_en: '🧣 Shringar & Attire' },
  { id: 'bhog', label_hi: '🍛 भोग व नैवेद्य', label_en: '🍛 Bhog & Sweets' },
];

const FALLBACK_TEMPLES = {
  'mahakaleshwar-ujjain': {
    name: 'श्री महाकालेश्वर ज्योतिर्लिंग, उज्जैन',
    deity: 'भगवान शिव (महाकाल)',
    city: 'उज्जैन',
    state: 'मध्य प्रदेश',
    description: 'द्वादश ज्योतिर्लिंगों में एकमात्र दक्षिणमुखी स्वयंभू ज्योतिर्लिंग। यहाँ की भस्म आरती एवं पावन रुद्राभिषेक से अकाल मृत्यु का भय दूर होता है और जीवन में सुख-समृद्धि आती है।',
    live_status: 'बुकिंग उपलब्ध',
    aarti_timings: [
      { name: 'भस्म आरती', time: 'प्रातः 04:00 AM' },
      { name: 'श्रृंगार आरती', time: 'प्रातः 07:30 AM' },
      { name: 'संध्या आरती', time: 'सायं 07:00 PM' },
      { name: 'शयन आरती', time: 'रात्रि 10:30 PM' }
    ],
    priests: [
      { name: 'पंडित राधेश्याम शर्मा', role: 'मुख्य पुजारी', exp: '25 वर्ष अनुभव' },
      { name: 'आचार्य विष्णुदत्त द्विवेदी', role: 'वैदिक कर्मकांडी', exp: '18 वर्ष अनुभव' }
    ]
  },
  'kashi-vishwanath-varanasi': {
    name: 'श्री काशी विश्वनाथ धाम, वाराणसी',
    deity: 'भगवान शिव (विश्वेश्वर)',
    city: 'वाराणसी',
    state: 'उत्तर प्रदेश',
    description: 'द्वादश ज्योतिर्लिंगों में प्रधान मोक्षदायिनी नगरी काशी के अधिपति भगवान विश्वनाथ। यहाँ गंगाजल व बिल्वपत्र अर्पण से मनुष्य जन्म-मरण के बंधन से मुक्त होता है।',
    live_status: 'बुकिंग उपलब्ध',
    aarti_timings: [
      { name: 'मंगला आरती', time: 'प्रातः 03:00 AM' },
      { name: 'भोग आरती', time: 'दोपहर 11:30 AM' },
      { name: 'सप्तर्षि आरती', time: 'सायं 07:00 PM' }
    ]
  },
  'shani-shingnapur': {
    name: 'श्री शनि शिंगणापुर धाम, महाराष्ट्र',
    deity: 'भगवान शनि देव',
    city: 'शिंगणापुर',
    state: 'महाराष्ट्र',
    description: 'विश्व प्रसिद्ध स्वयंभू शनि देव स्थान जहाँ शिला रूप में शनि देव विराजमान हैं। शुद्ध सरसों का तेल व काले तिल अर्पित करने से साढ़ेसाती, ढैय्या एवं ग्रह कष्टों से तत्काल शांति मिलती है।',
    live_status: 'बुकिंग उपलब्ध'
  },
  'kamakhya-devi-assam': {
    name: 'माँ कामाख्या शक्तिपीठ, गुवाहाटी',
    deity: 'भगवती कामाख्या',
    city: 'गुवाहाटी',
    state: 'असम',
    description: '51 शक्तिपीठों में सर्वोच्च तांत्रिक महापीठ। यहाँ माता के चरणों में लाल चुनरी, नारियल व 16 श्रृंगार अर्पित करने से अखंड सौभाग्य, मनोकामना सिद्धि एवं सर्वबाधा मुक्ति होती है।',
    live_status: 'बुकिंग उपलब्ध'
  },
  'siddhivinayak-mumbai': {
    name: 'श्री सिद्धिविनायक मंदिर, मुंबई',
    deity: 'भगवान श्री गणेश',
    city: 'मुंबई',
    state: 'महाराष्ट्र',
    description: 'विघ्नहर्ता भगवान श्री गणेश का परम सिद्ध व जाग्रत धाम। यहाँ दूर्वा दल व मोदक अर्पित करने से सभी कार्य निर्विघ्न सिद्ध होते हैं।',
    live_status: 'बुकिंग उपलब्ध'
  }
};

function NotFound() {
  return (
    <div className="w-full bg-[#FAF9F2] min-h-[60vh] py-16 px-4 text-center">
      <h1 className="font-serif text-2xl font-bold text-[#183C2B] mb-2">मंदिर नहीं मिला</h1>
      <p className="text-sm text-slate-600 mb-5">यह लिंक पुराना या त्रुटिपूर्ण हो सकता है।</p>
      <Link to="/mandir-seva" className="shop-btn shop-btn--gold no-underline">← सभी तीर्थ देखें</Link>
    </div>
  );
}

export default function TempleDetailPage() {
  const { slug } = useParams();
  const location = useLocation();
  const lang = useLang();
  const { data: temple, loading, error, retry } = useRequest(slug ? `/temples/${encodeURIComponent(slug)}?lang=${lang}` : '/temples/none', [slug, lang]);
  
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const fromSource = searchParams.get('from') || (location.state && location.state.from);
  const isFromChadhava = fromSource === 'chadhava' || (typeof document !== 'undefined' && document.referrer.includes('/chadhava'));
  
  const [booking, setBooking] = useState(null); // { offering } or { pkg } or { combo } or { basket }
  const [showMore, setShowMore] = useState(false);
  const [basket, setBasket] = useState({}); // item_id -> quantity
  const [activeItemFilter, setActiveItemFilter] = useState('all');

  const effectiveTemple = useMemo(() => {
    let t = null;
    if (temple && temple.name) t = { ...temple };
    else if (slug && FALLBACK_TEMPLES[slug]) t = { ...FALLBACK_TEMPLES[slug], slug, offerings: [] };
    if (!t) return null;

    const fb = (slug && FALLBACK_TEMPLES[slug]) || {};
    if (!t.aarti_timings || !t.aarti_timings.length) {
      t.aarti_timings = fb.aarti_timings || DEFAULT_AARTIS;
    }
    if (!t.priests || !t.priests.length) {
      t.priests = fb.priests || DEFAULT_PRIESTS;
    }
    if (!t.history_significance) {
      t.history_significance = fb.history_significance || (HISTORY_EN[slug] ? 'सनातन धर्म के प्राचीनतम पावन तीर्थस्थलों में से एक। यहाँ की पावन पूजा एवं अर्पण से मनोवांछित फल की प्राप्ति होती है।' : '');
    }
    if (!t.live_url) {
      t.live_url = fb.live_url || `https://www.youtube.com/results?search_query=${encodeURIComponent((t.name || slug) + ' Live Darshan')}`;
    }
    return t;
  }, [temple, slug]);

  useEffect(() => { 
    window.scrollTo({ top: 0 }); 
    setBooking(null); 
    setShowMore(false);
    setBasket({});
  }, [slug]);

  useEffect(() => {
    if (effectiveTemple && effectiveTemple.name) document.title = `${effectiveTemple.name} – Mandir Seva | Astro Jyotish`;
  }, [effectiveTemple]);

  const cleanOfferings = useMemo(() => {
    return ((effectiveTemple && effectiveTemple.offerings) || []).filter(
      (o) => !o.title.toLowerCase().includes('matchbox') && !o.title.toLowerCase().includes('माचिस')
    );
  }, [effectiveTemple]);

  const isHi = lang === 'hi';

  const groups = useMemo(() => (isHi ? GROUPS_HI : GROUPS_EN)
    .map(([cat, label]) => [label, cleanOfferings.filter((o) => o.category === cat)])
    .filter(([, list]) => list.length), [cleanOfferings, isHi]);

  const combos = useMemo(() => {
    return (effectiveTemple && effectiveTemple.combos && effectiveTemple.combos.length) ? effectiveTemple.combos : FALLBACK_COMBOS;
  }, [effectiveTemple]);

  const availableItems = useMemo(() => {
    const raw = (effectiveTemple && effectiveTemple.items && effectiveTemple.items.length) ? effectiveTemple.items : FALLBACK_ITEMS;
    return raw.filter(
      (o) => !o.title.toLowerCase().includes('matchbox') && !o.title.toLowerCase().includes('माचिस')
    );
  }, [effectiveTemple]);

  const filteredItems = useMemo(() => {
    if (activeItemFilter === 'all') return availableItems;
    return availableItems.filter((it) => {
      if (it.cat === activeItemFilter) return true;
      const t = it.title.toLowerCase();
      if (activeItemFilter === 'leaves' && (t.includes('बेलपत्र') || t.includes('पुष्प') || t.includes('माला') || t.includes('तुलसी') || t.includes('दूर्वा') || t.includes('फूल'))) return true;
      if (activeItemFilter === 'abhishek' && (t.includes('गंगाजल') || t.includes('दूध') || t.includes('पंचामृत') || t.includes('भस्म'))) return true;
      if (activeItemFilter === 'diya' && (t.includes('दीप') || t.includes('धूप') || t.includes('अगरबत्ती') || t.includes('कपूर'))) return true;
      if (activeItemFilter === 'oil' && (t.includes('तेल') || t.includes('तिल') || t.includes('सिंदूर') || t.includes('चोला'))) return true;
      if (activeItemFilter === 'shringar' && (t.includes('श्रृंगार') || t.includes('चुनरी') || t.includes('वस्त्र') || t.includes('ध्वजा') || t.includes('पीतांबर'))) return true;
      if (activeItemFilter === 'bhog' && (t.includes('भोग') || t.includes('मोदक') || t.includes('माखन') || t.includes('लड्डू') || t.includes('मिश्री') || t.includes('नारियल'))) return true;
      return false;
    });
  }, [availableItems, activeItemFilter]);

  const setItemQty = (id, q) => {
    setBasket((prev) => {
      const next = { ...prev };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  };

  const selectedBasketList = useMemo(() => {
    return Object.entries(basket)
      .map(([id, quantity]) => {
        const found = availableItems.find((it) => (it.id === id || it.key === id || it.title === id));
        if (!found) return null;
        return { ...found, quantity };
      })
      .filter(Boolean);
  }, [basket, availableItems]);

  const totalBasketPrice = useMemo(() => {
    return selectedBasketList.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  }, [selectedBasketList]);

  const totalBasketCount = useMemo(() => {
    return selectedBasketList.reduce((sum, it) => sum + it.quantity, 0);
  }, [selectedBasketList]);

  // /chadhava, /puja and similar paths without a slug have no temple to show.
  if (!slug) return <Navigate to="/mandir-seva" replace />;
  if (loading && !effectiveTemple) return <p role="status" className="text-center text-xs text-slate-500 py-24">लोड हो रहा है...</p>;
  if (error && error.status === 404 && !effectiveTemple) return <NotFound />;
  if (error && !effectiveTemple) {
    return (
      <div className="py-16 text-center" role="alert">
        <p className="text-sm text-slate-600 mb-3">{error.message}</p>
        <button type="button" onClick={retry} className="px-4 py-2 rounded-full bg-[#164B32] text-[#FFFDF5] text-xs font-bold cursor-pointer border-0">पुनः प्रयास करें</button>
      </div>
    );
  }
  if (!effectiveTemple) return <NotFound />;

  const live = LIVE_EN[effectiveTemple.live_status] && lang === 'en' ? LIVE_EN[effectiveTemple.live_status] : effectiveTemple.live_status;
  const aarti = effectiveTemple.aarti_timings || DEFAULT_AARTIS;
  const priests = effectiveTemple.priests || DEFAULT_PRIESTS;
  const historyText = lang === 'en'
    ? (HISTORY_EN[slug] || effectiveTemple.history_significance_en || effectiveTemple.history_significance)
    : effectiveTemple.history_significance;

  return (
    <div className="mandir-page w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF9F2] min-h-screen pb-28">
      {/* Sacred Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 pt-3 pb-1 text-xs text-slate-500 font-medium">
        <ol className="flex items-center gap-2 list-none p-0 m-0 flex-wrap">
          <li>
            <Link to="/" className="text-slate-500 hover:text-[#164B32] transition-colors no-underline">
              {lang === 'hi' ? 'होम' : 'Home'}
            </Link>
          </li>
          <li className="text-slate-400">›</li>
          <li>
            <Link to="/mandir-seva" className="text-slate-500 hover:text-[#164B32] transition-colors no-underline">
              {lang === 'hi' ? 'मंदिर सेवा' : 'Mandir Seva'}
            </Link>
          </li>
          <li className="text-slate-400">›</li>
          <li>
            {isFromChadhava ? (
              <Link to="/mandir-seva/chadhava" className="text-slate-500 hover:text-[#164B32] transition-colors no-underline">
                {lang === 'hi' ? 'दैनिक चढ़ावा' : 'Daily Chadhava'}
              </Link>
            ) : (
              <Link to="/mandir-seva/puja" className="text-slate-500 hover:text-[#164B32] transition-colors no-underline">
                {lang === 'hi' ? 'संकल्प पूजा' : 'Online Puja'}
              </Link>
            )}
          </li>
          <li className="text-slate-400">›</li>
          <li className="text-[#164B32] font-bold" aria-current="page" translate="no">
            {effectiveTemple.name}
          </li>
        </ol>
      </nav>

      {/* Majestic Photographic Sacred Hero Banner with 100% Contrast & High-Res Artwork */}
      <section className="max-w-7xl mx-auto px-4 pt-2 pb-2">
        <header
          className="service-banner service-banner--mandir max-w-7xl mx-auto sacred-hero-banner relative rounded-3xl overflow-hidden shadow-xl"
          translate="no"
          style={{
            backgroundColor: '#164B32',
            border: '1.5px solid #D9A441',
          }}
        >
          {/* Temple Photographic Art with Fallback */}
          <figure className="service-banner__art">
            <img
              src={`/assets/img/temples/${slug}.webp`}
              alt={effectiveTemple.name}
              fetchPriority="high"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `/assets/img/temples/${slug}.jpg`;
              }}
            />
          </figure>

          <div className="mandir-hero__copy service-banner__copy relative z-10 max-w-2xl text-white">
            <span className="mandir-hero__eyebrow inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#EFD4A0] bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full mb-3 border border-[#D9A441]/40" translate="no">
              ✦ {effectiveTemple.deity} ✦
            </span>
            <h1 className="sacred-hero-title font-serif text-2xl sm:text-4xl font-bold leading-tight mb-3" style={{ color: '#FFFDF5' }} translate="no">
              {effectiveTemple.name}
            </h1>

            <div className="flex items-center gap-3 flex-wrap mb-4 text-xs text-amber-200">
              <span className="font-medium" translate="no">📍 {[effectiveTemple.city, effectiveTemple.state].filter(Boolean).join(', ')}</span>
              {live && <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-400/40 text-emerald-200 font-bold">{live}</span>}
            </div>

            <p className="sacred-hero-desc text-xs sm:text-sm text-slate-100 leading-relaxed max-w-2xl mb-6 font-normal" translate="no">
              {effectiveTemple.description}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <a
                href="#temple-offerings"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#183C2B] font-extrabold text-xs uppercase tracking-wider no-underline shadow-md hover:shadow-lg transition-all"
                onClick={(e) => { e.preventDefault(); document.getElementById('temple-offerings')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                {lang === 'hi' ? 'चढ़ावा व थाली चुनें →' : 'Select Offering & Thali →'}
              </a>
              <Link to="/mandir-seva" className="text-xs text-amber-300 hover:text-amber-200 font-bold no-underline">
                {lang === 'hi' ? '← सभी तीर्थ देखें' : '← All Pilgrimages'}
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/15 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">📹</span>
                <div>
                  <b className="text-white block text-[11px]">{lang === 'hi' ? 'WhatsApp वीडियो' : 'WhatsApp Video'}</b>
                  <small className="text-slate-300 text-[10px]">{lang === 'hi' ? 'रिकॉर्डेड प्रमाण' : 'Recorded Proof'}</small>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🪔</span>
                <div>
                  <b className="text-white block text-[11px]">{lang === 'hi' ? 'तीर्थ पुरोहित' : 'Head Priests'}</b>
                  <small className="text-slate-300 text-[10px]">{lang === 'hi' ? 'नाम-गोत्र संकल्प' : 'Name-Gotra Sankalp'}</small>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">📦</span>
                <div>
                  <b className="text-white block text-[11px]">{lang === 'hi' ? 'घर पर प्रसाद' : 'Prasad Delivery'}</b>
                  <small className="text-slate-300 text-[10px]">{lang === 'hi' ? 'पवित्र प्रसाद किट' : 'Sacred Prasad Box'}</small>
                </div>
              </div>
            </div>
          </div>
        </header>
      </section>

      {/* Main Grid: Offerings & Temple Info */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8" id="temple-offerings" style={{ scrollMarginTop: 100 }}>

          {/* FEATURED SECTION 1: READY-TO-OFFER THALI COMBOS */}
          <section className="p-6 sm:p-7 rounded-3xl bg-white border border-[#DDEBD5] shadow-sm" translate="no">
            <div className="mb-5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A77B25] block mb-1">
                ✦ {lang === 'hi' ? 'लोकप्रिय पारंपरिक कॉम्बो' : 'POPULAR TRADITIONAL COMBOS'} ✦
              </span>
              <h2 className="font-serif text-lg sm:text-2xl font-bold text-[#183C2B] m-0">
                {lang === 'hi' ? 'तैयार संपूर्ण चढ़ावा थाली' : 'Ready Sacred Offering Thalis'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 m-0 mt-1">
                {lang === 'hi'
                  ? 'यदि आप अलग-अलग सामग्री नहीं चुनना चाहते, तो शास्त्रों में वर्णित ये संपूर्ण थालियां गर्भगृह अर्पण हेतु सर्वाधिक फलदायी हैं'
                  : 'Complete traditional offering trays blessed by scriptures for holy sanctum dedication.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {combos.map((c) => {
                const title = lang === 'en' && c.title_en ? c.title_en : c.title;
                const desc = lang === 'en' && c.desc_en ? c.desc_en : c.description;
                const tag = lang === 'en' && c.tag_en ? c.tag_en : c.tag;
                const itemsList = lang === 'en' && c.items_included_en ? c.items_included_en : c.items_included;

                return (
                  <article
                    key={c.id || c.title}
                    className="p-5 rounded-3xl border-2 border-[#DDEBD5] hover:border-[#D9A441] bg-gradient-to-b from-[#FFFDF5] to-amber-50/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-2xl">{c.emoji}</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-[#183C2B]">
                          {tag}
                        </span>
                      </div>

                      <h3 className="font-serif text-base font-bold text-[#183C2B] m-0 mb-1" translate="no">
                        {title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed m-0 mb-3" translate="no">
                        {desc}
                      </p>

                      {itemsList && (
                        <div className="space-y-1 mb-4 pt-2 border-t border-amber-200/50">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            {lang === 'hi' ? 'सम्मिलित सामग्रियां:' : 'Included Offerings:'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {itemsList.map((it, idx) => {
                              const itName = lang === 'en' ? (ITEM_NAME_EN[it] || it) : it;
                              return (
                                <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-amber-200 text-slate-700">
                                  ✓ {itName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{lang === 'hi' ? 'कुल दक्षिणा' : 'Total Dakshina'}</span>
                        <span className="text-lg font-black text-[#8B1D2C]">{money(c.price)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBooking({ combo: c })}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#183C2B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-sm hover:shadow-md transition-all"
                      >
                        {lang === 'hi' ? 'थाली अर्पित करें →' : 'Offer Thali →'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* FEATURED SECTION 2: CUSTOM OFFERING BASKET (ALL 16+ TRADITIONAL ITEMS) */}
          <section className="p-6 sm:p-7 rounded-3xl bg-white border border-[#DDEBD5] shadow-sm" translate="no">
            <div className="mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A77B25] block mb-1">
                ✦ {lang === 'hi' ? 'इच्छानुसार सामग्री चयन' : 'CUSTOM OFFERINGS'} ✦
              </span>
              <h2 className="font-serif text-lg sm:text-2xl font-bold text-[#183C2B] m-0">
                {lang === 'hi' ? 'अपनी इच्छानुसार पावन सामग्रियां जोड़ें' : 'Choose Your Holy Offerings'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 m-0 mt-1">
                {lang === 'hi'
                  ? 'मंदिर में भगवान को जो-जो चीजें चढ़ाई जाती हैं, अपनी इच्छानुसार एक या अनेक सामग्रियां एक साथ चुनें (108 बेलपत्र, गंगाजल, भस्म, देशी घी दीपक, भोग थाली आदि)'
                  : 'Select traditional items offered at sacred sanctums: 108 bilva leaves, Gangajal, pure bhasma, ghee lamp, bhog and more.'}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none" role="tablist">
              {ITEM_FILTER_TABS.map((tab) => {
                const active = activeItemFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveItemFilter(tab.id)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                      active
                        ? 'bg-[#164B32] text-[#FFFDF5] border-[#164B32] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    {lang === 'en' ? tab.label_en : tab.label_hi}
                  </button>
                );
              })}
            </div>

            {/* Grid of All Sacred Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredItems.map((item) => {
                const itemId = item.id || item.key || item.title;
                const q = basket[itemId] || 0;
                const title = lang === 'en' && item.title_en ? item.title_en : item.title;
                const desc = lang === 'en' && item.desc_en ? item.desc_en : (item.desc || item.description);
                const tag = lang === 'en' && item.tag_en ? item.tag_en : item.tag;

                return (
                  <article
                    key={itemId}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      q ? 'bg-amber-50/90 border-[#164B32] shadow-sm ring-1 ring-[#D9A441]' : 'bg-slate-50/60 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl shrink-0">{item.emoji || '🪔'}</span>
                          <div>
                            <h4 className="font-serif text-sm font-bold text-[#183C2B] m-0 leading-tight" translate="no">
                              {title}
                            </h4>
                            {tag && (
                              <span className="text-[10px] text-amber-800 font-semibold mt-0.5 inline-block">
                                • {tag}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-black text-[#8B1D2C] shrink-0">{money(item.price)}</span>
                      </div>

                      <p className="text-xs text-slate-500 m-0 line-clamp-1 ml-8" translate="no">
                        {desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 mt-3">
                      <span className="text-[11px] font-medium text-slate-500">
                        {q > 0
                          ? (lang === 'hi' ? `चयनित: ${q} संख्या` : `Selected: ${q}`)
                          : (lang === 'hi' ? 'अर्पण जोड़ें' : 'Add to basket')}
                      </span>
                      <div className="flex items-center gap-2" role="group" aria-label={`Quantity of ${title}`}>
                        <button
                          type="button"
                          aria-label="Fewer"
                          disabled={!q}
                          onClick={() => setItemQty(itemId, q - 1)}
                          className="w-8 h-8 rounded-full border border-slate-300 bg-white font-bold cursor-pointer disabled:opacity-40 flex items-center justify-center text-sm hover:bg-slate-100 transition-colors"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-900" aria-live="polite">{q}</span>
                        <button
                          type="button"
                          aria-label="More"
                          onClick={() => setItemQty(itemId, q + 1)}
                          className="w-8 h-8 rounded-full border border-[#164B32] bg-[#164B32] text-white font-bold cursor-pointer flex items-center justify-center text-sm hover:bg-[#520C1F] transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* SECTION 3: OTHER TEMPLE OFFERINGS & PACKAGES */}
          {groups.map(([label, list]) => (
            <section key={label} aria-label={label} className="p-6 rounded-3xl bg-white border border-[#DDEBD5] shadow-sm" translate="no">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#183C2B] mb-4">{label}</h2>
              <div className="space-y-3">
                {list.map((o) => (
                  <article key={o.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-amber-400 transition-all flex gap-4 items-start justify-between flex-wrap sm:flex-nowrap">
                    <div className="min-w-0">
                      <h3 className="font-serif text-sm font-bold text-[#183C2B] m-0 mb-1">
                        <span translate="no">{o.emoji ? `${o.emoji} ` : '🪔 '}{o.title}</span>
                        {o.popular && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-[#183C2B]">Popular</span>}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed m-0" translate="no">{o.description}</p>
                      <p className="text-[11px] text-slate-500 m-0 mt-1.5 flex items-center gap-2">
                        {o.includes_video_proof && (
                          <span className="text-emerald-800 font-medium">
                            {lang === 'hi' ? '📹 WhatsApp वीडियो प्रमाण' : '📹 WhatsApp Video Proof'}
                          </span>
                        )}
                        {o.has_prasad_delivery && (
                          <span className="text-amber-800">
                            · {lang === 'hi' ? `📦 प्रसाद डिलीवरी (+${money(o.delivery_fee)})` : `📦 Prasad Delivery (+${money(o.delivery_fee)})`}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold text-[#164B32] m-0 mb-2">{money(o.price)}</p>
                      <button
                        type="button"
                        onClick={() => setBooking({ offering: o })}
                        className="px-4 py-2 rounded-full bg-[#164B32] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-sm hover:bg-[#520C1F] transition-all"
                      >
                        {lang === 'hi' ? 'सेवा लें →' : 'Book Seva →'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {(effectiveTemple.packages || []).length > 0 && (
            <section aria-label="Packages" className="p-6 rounded-3xl bg-white border border-[#DDEBD5] shadow-sm" translate="no">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#183C2B] mb-4">
                {lang === 'hi' ? 'मासिक एवं विशेष पैकेज' : 'Monthly & Special Packages'}
              </h2>
              <div className="space-y-3">
                {effectiveTemple.packages.map((pk) => (
                  <article key={pk.slug} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex gap-4 items-start justify-between flex-wrap sm:flex-nowrap">
                    <div className="min-w-0">
                      <h3 className="font-serif text-sm font-bold text-[#183C2B] m-0 mb-1" translate="no">{pk.title}</h3>
                      <p className="text-xs text-slate-600 m-0" translate="no">{pk.description}</p>
                      <p className="text-[11px] text-slate-500 m-0 mt-1.5">
                        <span translate="no">
                          {pk.sessions} {lang === 'hi' ? 'सत्र' : 'sessions'} · {pk.discount_percent}% {lang === 'hi' ? 'छूट' : 'off'}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {pk.list_price > pk.price && <p className="text-[11px] text-slate-400 line-through m-0">{money(pk.list_price)}</p>}
                      <p className="text-base font-extrabold text-[#164B32] m-0 mb-2">{money(pk.price)}</p>
                      <button
                        type="button"
                        onClick={() => setBooking({ pkg: pk })}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#183C2B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-sm"
                      >
                        {lang === 'hi' ? 'पैकेज लें →' : 'Select Package →'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Sidebar: Offering Basket, History, Aarti, Priests & Sacred Trust - Wrapped in inner sticky container */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-5">
            {/* DEVOTIONAL OFFERING BASKET / SANKALP SUMMARY CARD */}
            <div className="p-6 rounded-3xl bg-white border-2 border-[#D9A441]/50 shadow-md" translate="no">
              <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🪔</span>
                  <h3 className="font-serif text-base font-bold text-[#183C2B] m-0">
                    {lang === 'hi' ? 'आपकी चढ़ावा बास्केट' : 'Your Offering Basket'}
                  </h3>
                </div>
                {totalBasketCount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-[#164B32]">
                    {totalBasketCount} {lang === 'hi' ? 'सामग्रियां' : 'items'}
                  </span>
                )}
              </div>

              {totalBasketCount === 0 ? (
                <div className="text-center py-2">
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    {lang === 'hi'
                      ? 'ऊपर से तैयार थाली चुनें या नीचे से अपनी इच्छानुसार सामग्रियां (108 बेलपत्र, गंगाजल, भस्म, देशी घी दीपक आदि) जोड़ें।'
                      : 'Choose a ready thali combo above or add sacred items below (108 bilva leaves, Gangajal, bhasma, ghee lamp) to offer in your name.'}
                  </p>
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-left">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      {lang === 'hi' ? 'लोकप्रिय त्वरित चढ़ावा थाली:' : 'Popular Quick Thali Combos:'}
                    </span>
                    {combos.slice(0, 2).map((c) => (
                      <button
                        key={c.id || c.slug}
                        type="button"
                        onClick={() => setBooking({ combo: c })}
                        className="w-full text-left p-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100 text-xs text-[#164B32] font-bold flex justify-between items-center transition-colors cursor-pointer border border-amber-200"
                      >
                        <span className="truncate pr-2">{c.emoji || '🪔'} {lang === 'en' && c.title_en ? c.title_en : c.title}</span>
                        <span className="text-amber-900 shrink-0">{money(c.price)} →</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <ul className="list-none p-0 m-0 max-h-48 overflow-y-auto space-y-2 mb-4 pr-1">
                    {selectedBasketList.map((it) => {
                      const itemTitle = lang === 'en' && it.title_en ? it.title_en : it.title;
                      return (
                        <li key={it.id || it.key} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <span>{it.emoji || '🪔'}</span>
                            <span className="font-semibold text-slate-800 truncate" title={itemTitle}>{itemTitle}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-slate-500">×{it.quantity}</span>
                            <b className="text-[#164B32]">{money(it.price * it.quantity)}</b>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="pt-3 border-t border-amber-200 flex justify-between items-center mb-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        {lang === 'hi' ? 'कुल चढ़ावा दक्षिणा' : 'Total Dakshina'}
                      </span>
                      <span className="text-lg font-black text-[#8B1D2C]">{money(totalBasketPrice)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBasket({})}
                      className="text-[11px] text-slate-400 hover:text-rose-600 underline cursor-pointer bg-transparent border-0 p-0"
                    >
                      {lang === 'hi' ? 'खाली करें' : 'Clear'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBooking({
                      basket: {
                        items: selectedBasketList,
                        total: totalBasketPrice,
                        title: lang === 'hi' ? `मंदिर चढ़ावा (${totalBasketCount} पवित्र सामग्रियां)` : `Temple Offering (${totalBasketCount} sacred items)`
                      }
                    })}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#183C2B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
                  >
                    <span>{lang === 'hi' ? 'संकल्प करें (चढ़ावा चढ़ाएं) →' : 'Proceed to Sankalp →'}</span>
                  </button>
                </div>
              )}
            </div>

            {historyText && (
              <div className="p-6 rounded-3xl bg-white border border-[#DDEBD5] shadow-sm" translate="no">
                <h2 className="font-serif text-base font-bold text-[#183C2B] mt-0 mb-2">
                  {lang === 'hi' ? 'मंदिर का पौराणिक महात्म्य' : 'Sacred Significance & History'}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed m-0" translate="no" style={showMore ? undefined : { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{historyText}</p>
                <button type="button" onClick={() => setShowMore((v) => !v)} aria-expanded={showMore} className="mt-2 text-xs font-bold text-[#164B32] bg-transparent border-0 p-0 cursor-pointer underline">
                  {showMore ? (lang === 'hi' ? 'कम दिखाएं' : 'Show less') : (lang === 'hi' ? 'और पढ़ें' : 'Read more')}
                </button>
              </div>
            )}

            {aarti.length > 0 && (
              <div className="p-6 rounded-3xl bg-white border border-[#DDEBD5] shadow-sm" translate="no">
                <h2 className="font-serif text-base font-bold text-[#183C2B] mt-0 mb-3">
                  {lang === 'hi' ? 'दैनिक आरती समय' : 'Daily Aarti Timings'}
                </h2>
                <ul className="list-none p-0 m-0 space-y-2 text-xs text-slate-600" translate="no">
                  {aarti.map((a) => {
                    const aName = lang === 'en' ? (AARTI_TRANSLATIONS[a.name] || a.name_en || a.name) : a.name;
                    const aTime = lang === 'en' ? (AARTI_TRANSLATIONS[a.time] || a.time) : a.time;
                    return (
                      <li key={a.name} className="flex justify-between gap-3 py-1 border-b border-slate-100 last:border-0">
                        <span>{aName}</span>
                        <b className="text-[#164B32]">{aTime}</b>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {effectiveTemple.live_url && (
              <a href={effectiveTemple.live_url} target="_blank" rel="noopener noreferrer" className="block text-center p-3.5 rounded-2xl bg-[#164B32] text-[#FFFDF5] text-xs font-bold no-underline shadow-md hover:bg-[#520C1F] transition-all">
                {lang === 'hi' ? '▶ लाइव दर्शन देखें' : '▶ Watch Live Darshan'}
              </a>
            )}

            {priests.length > 0 && (
              <div className="p-6 rounded-3xl bg-white border border-[#DDEBD5] shadow-sm" translate="no">
                <h2 className="font-serif text-base font-bold text-[#183C2B] mt-0 mb-3">
                  {lang === 'hi' ? 'तीर्थ पुरोहित परिवार' : 'Temple Purohit Council'}
                </h2>
                <ul className="list-none p-0 m-0 space-y-3 text-xs text-slate-600" translate="no">
                  {priests.map((p) => {
                    const pName = lang === 'en' ? (p.name_en || p.name) : p.name;
                    const pRole = lang === 'en' ? (PRIEST_ROLE_TRANSLATIONS[p.role] || p.role_en || p.role) : p.role;
                    const pExp = p.years_experience || p.exp;
                    const expText = pExp ? (lang === 'hi' ? ` · ${pExp} वर्ष अनुभव` : (typeof pExp === 'number' ? ` · ${pExp} yrs exp` : ` · ${PRIEST_ROLE_TRANSLATIONS[pExp] || pExp}`)) : '';
                    return (
                      <li key={p.id || p.name} className="pb-2 border-b border-slate-100 last:border-0">
                        <b className="text-[#183C2B]">{pName}</b>
                        {pRole && <span className="text-[11px] text-[#A77B25] font-medium ml-1.5">({pRole})</span>}
                        {p.verified && <span className="text-emerald-700 font-bold ml-1">{lang === 'hi' ? '✓ सत्यापित' : '✓ Verified'}</span>}
                        {expText && <span className="text-slate-500">{expText}</span>}
                        {p.bio && <span className="block text-slate-500 text-[11px] mt-0.5">{lang === 'en' && p.bio_en ? p.bio_en : p.bio}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Sacred Sanctum Guarantees & Trust Assurance Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#FFFDF5] to-amber-50/50 border border-[#DDEBD5] shadow-sm" translate="no">
              <h3 className="font-serif text-sm font-bold text-[#183C2B] mt-0 mb-3 flex items-center gap-2">
                <span>🛡️</span>
                <span>{lang === 'hi' ? 'शास्त्रसम्मत एवं 100% प्रामाणिक सेवा' : 'Vedic & 100% Authentic Assurance'}</span>
              </h3>
              <ul className="list-none p-0 m-0 space-y-3 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="text-base leading-none shrink-0">📹</span>
                  <div>
                    <b className="text-[#164B32] block">{lang === 'hi' ? 'WhatsApp वीडियो प्रमाण' : 'Recorded Video Proof'}</b>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'hi' ? 'आपके नाम व गोत्र से गर्भगृह में अर्पण का स्पष्ट वीडियो।' : 'Sanctum offering video with your name and gotra.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-base leading-none shrink-0">🕉️</span>
                  <div>
                    <b className="text-[#164B32] block">{lang === 'hi' ? 'शास्त्रसम्मत वैदिक संकल्प' : 'Vedic Sankalp Tradition'}</b>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'hi' ? 'मंदिर के अधिकृत व वरिष्ठ तीर्थ पुरोहितों द्वारा संपन्न।' : 'Conducted by authorized sanctum head priests.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-base leading-none shrink-0">📦</span>
                  <div>
                    <b className="text-[#164B32] block">{lang === 'hi' ? 'पवित्र महाप्रसाद वितरण' : 'Sacred Prasad at Doorstep'}</b>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'hi' ? 'गंगाजल, भस्म व रक्षासूत्र सुरक्षित आपके पते पर।' : 'Holy Gangajal, energized bhasma & holy thread.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-base leading-none shrink-0">🪙</span>
                  <div>
                    <b className="text-[#164B32] block">{lang === 'hi' ? 'वॉलेट सुरक्षा एवं पारदर्शिता' : 'Direct Wallet Ledger'}</b>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'hi' ? 'पारदर्शी दक्षिणा और तत्काल सेवा पुष्टिकरण।' : 'Transparent dakshina with instant receipt.'}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* STICKY / FLOATING CUSTOM OFFERING BASKET BAR */}
      {totalBasketCount > 0 && (
        <div
          className="floating-basket-bar fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 bg-[#164B32] text-white p-4 sm:p-5 rounded-3xl shadow-2xl border-2 border-[#D9A441] flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap backdrop-blur-md animate-fade-in"
          translate="no"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🧺</span>
              <b className="text-sm font-bold text-amber-300">
                {lang === 'hi'
                  ? `चढ़ावा बास्केट: ${totalBasketCount} सामग्रियां चयनित`
                  : `Offering Basket: ${totalBasketCount} items selected`}
              </b>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-12 overflow-y-auto scrollbar-none">
              {selectedBasketList.map((it) => {
                const itemTitle = lang === 'en' && it.title_en ? it.title_en : it.title;
                return (
                  <span key={it.id || it.title} className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 text-slate-100 border border-white/20 whitespace-nowrap">
                    {it.emoji} {itemTitle} × {it.quantity}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
            <div className="text-right">
              <span className="text-[10px] text-amber-200 block uppercase tracking-wider">{lang === 'hi' ? 'कुल दक्षिणा' : 'Total Dakshina'}</span>
              <span className="text-lg sm:text-xl font-black text-amber-300">{money(totalBasketPrice)}</span>
            </div>
            <button
              type="button"
              onClick={() => setBooking({
                basket: {
                  items: selectedBasketList,
                  total: totalBasketPrice,
                  title: lang === 'hi' ? `मंदिर चढ़ावा (${totalBasketCount} पवित्र सामग्रियां)` : `Temple Offering (${totalBasketCount} sacred items)`
                }
              })}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#183C2B] font-extrabold text-xs sm:text-sm uppercase tracking-wider cursor-pointer border-0 shadow-lg hover:brightness-105 active:scale-95 transition-all"
            >
              {lang === 'hi' ? 'चढ़ावा संकल्प लें →' : 'Proceed with Offering →'}
            </button>
          </div>
        </div>
      )}

      {booking && (
        <SevaBookingDialog
          temple={temple || effectiveTemple}
          offering={booking.offering}
          pkg={booking.pkg}
          combo={booking.combo}
          basket={booking.basket}
          lang={lang}
          onClose={() => setBooking(null)}
        />
      )}
    </div>
  );
}
