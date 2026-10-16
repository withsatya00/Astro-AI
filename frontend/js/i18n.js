/**
 * AstroAI Universal Internationalization (i18n) Engine.
 * Supports 8 Indian & International Languages:
 * 1. English (en)
 * 2. Hindi (hi - हिन्दी)
 * 3. Sanskrit (sa - संस्कृतम्)
 * 4. Marathi (mr - मराठी)
 * 5. Gujarati (gu - ગુજરાતી)
 * 6. Bengali (bn - বাংলা)
 * 7. Tamil (ta - தமிழ்)
 * 8. Telugu (te - తెలుగు)
 */

const ASTRO_I18N = {
  en: {
    lang_name: "English",
    brand_subtitle: "Vedic Astrology & Kundali Platform",
    new_consultation: "New Consultation",
    search_conversations: "Search conversations...",
    recent_consultations: "Recent Consultations",
    saved_profiles: "Saved Kundli Profiles",
    add_profile: "+ Add Birth Profile",
    astrology_tools: "Astrology Tools",
    tool_milan: "💍 Kundali Milan (Gun Milan)",
    tool_panchang: "📅 Aaj Ka Panchang",
    tool_sadesati: "🪐 Shani Sade Sati Tracker",
    tool_astrologer: "🔮 Select Astrologer",
    tool_kundli: "🪐 Kundli Diagram & Bhavas",
    tool_reports: "📑 PDF Kundali Reports",
    tool_docs: "📚 Classical Knowledge Base",
    tool_grounded: "📜 Shastriya Grounded Report",
    tool_agent: "🔮 Vedic Tools Console",
    switch_astrologer: "Switch ▾",
    no_profile_selected: "No Profile Selected",
    intake_title: "Pandit Ji Consultation Intake",
    intake_subtitle: "Enter birth details for accurate Vedic predictions and simple, authentic remedies.",
    label_full_name: "Full Name",
    placeholder_full_name: "e.g. Rahul Sharma",
    label_gender: "Gender",
    gender_male: "Male",
    gender_female: "Female",
    gender_other: "Other",
    label_dob: "Date of Birth",
    label_tob: "Time of Birth",
    label_pob: "Birth City / Location",
    placeholder_pob: "e.g. New Delhi, India",
    label_query: "Astrological Inquiry / Concern",
    placeholder_query: "e.g. Career growth, marriage timing, health remedies, financial prosperity...",
    btn_start_consultation: "Consult Pandit Ji Now ➔",
    quick_select: "⚡ Quick select:",
    cosmic_highlights: "Cosmic Highlights",
    active_profile: "Active Birth Profile",
    edit_profile: "Edit",
    lagna_kundli: "Lagna Kundli (D1)",
    key_placements: "Key Placements",
    ascendant_lagna: "ASCENDANT (LAGNA)",
    moon_sign: "MOON SIGN (RASHI)",
    sun_sign: "SUN SIGN (SURYA)",
    moon_nakshatra: "MOON NAKSHATRA",
    ask_placeholder: "Ask Pandit Ji about career, marriage, health, or remedies...",
    btn_palm: "Palm Photo",
    btn_kundli_chat: "Kundli in Chat",
    btn_attach: "Attach Doc",
    btn_tools: "Vedic Tools",
    btn_export_consultation: "📜 Export Consultation",
    btn_download_png: "📥 PNG Chart",
    btn_download_pdf: "📥 Full PDF Dossier",
    btn_share_whatsapp: "💬 WhatsApp",
    demo_mode: "Demo",
    checking_system: "Connecting to Acharya...",
    system_ready: "Pandit Ji is Online 🟢",
    lang_switched: "Language changed to English"
  },

  hi: {
    lang_name: "हिन्दी (Hindi)",
    brand_subtitle: "वैदिक ज्योतिष एवं जन्म कुण्डली परामर्श",
    new_consultation: "नया परामर्श",
    search_conversations: "परामर्श खोजें...",
    recent_consultations: "हालिया परामर्श",
    saved_profiles: "सहेजे गए कुंडली प्रोफाइल",
    add_profile: "+ नया प्रोफाइल जोड़ें",
    astrology_tools: "ज्योतिष उपकरण",
    tool_milan: "💍 कुंडली मिलान (36 गुण)",
    tool_panchang: "📅 आज का पंचांग",
    tool_sadesati: "🪐 शनि साढ़े साती ट्रैकर",
    tool_astrologer: "🔮 ज्योतिषी चुनें",
    tool_kundli: "🪐 कुण्डली रेखाचित्र एवं भाव",
    tool_reports: "📑 पीडीएफ कुण्डली रिपोर्ट",
    tool_docs: "📚 शास्त्रीय ज्ञानकोश",
    tool_grounded: "📜 शास्त्रीय प्रमाणित रिपोर्ट",
    tool_agent: "🔮 शास्त्रीय ज्योतिष उपकरण",
    switch_astrologer: "बदलें ▾",
    no_profile_selected: "कोई प्रोफाइल चयनित नहीं",
    intake_title: "पंडित जी से परामर्श (Intake)",
    intake_subtitle: "सटीक वैदिक फलकथन एवं सरल कल्याणकारी उपाय के लिए अपने जन्म का विवरण दर्ज करें।",
    label_full_name: "पूरा नाम",
    placeholder_full_name: "उदा. राहुल शर्मा",
    label_gender: "लिंग",
    gender_male: "पुरुष",
    gender_female: "महिला",
    gender_other: "अन्य",
    label_dob: "जन्म तिथि",
    label_tob: "जन्म समय",
    label_pob: "जन्म स्थान (शहर/राज्य)",
    placeholder_pob: "उदा. नई दिल्ली, भारत",
    label_query: "आपका प्रश्न अथवा चिंता",
    placeholder_query: "उदा. करियर उन्नति, विवाह का समय, धन लाभ, स्वास्थ्य एवं उपाय...",
    btn_start_consultation: "पंडित जी से परामर्श शुरू करें ➔",
    quick_select: "⚡ त्वरित चयन:",
    cosmic_highlights: "ग्रह स्थिति एवं कुण्डली",
    active_profile: "सक्रिय जन्म प्रोफ़ाइल",
    edit_profile: "संपादित करें",
    lagna_kundli: "लग्न कुण्डली (D1)",
    key_placements: "मुख्य ग्रह स्थिति",
    ascendant_lagna: "लग्न (ASCENDANT)",
    moon_sign: "चंद्र राशि (RASHI)",
    sun_sign: "सूर्य राशि (SURYA)",
    moon_nakshatra: "जन्म नक्षत्र",
    ask_placeholder: "पूछिए पंडित जी से अपना प्रश्न... (विवाह, नौकरी, स्वास्थ्य या उपाय)",
    btn_palm: "हस्तरेखा फोटो",
    btn_kundli_chat: "चैट में कुंडली",
    btn_attach: "दस्तावेज़ जोड़ें",
    btn_tools: "ज्योतिषीय उपकरण",
    btn_export_consultation: "📜 परामर्श डाउनलोड",
    btn_download_png: "📥 कुण्डली PNG",
    btn_download_pdf: "📥 पूर्ण कुण्डली PDF",
    btn_share_whatsapp: "💬 व्हाट्सएप शेयर",
    demo_mode: "डेमो मोड",
    checking_system: "ज्योतिषाचार्य से संपर्क हो रहा है...",
    system_ready: "आचार्य जी लाइव उपस्थित हैं 🟢",
    lang_switched: "भाषा बदलकर हिन्दी कर दी गई है"
  },

  sa: {
    lang_name: "संस्कृतम् (Sanskrit)",
    brand_subtitle: "वैदिकज्योतिषम् एवं जन्मकुण्डलीपरामर्शः",
    new_consultation: "नवीनपरामर्शः",
    search_conversations: "परामर्शं अन्विष...",
    recent_consultations: "सद्यःपरामर्शाः",
    saved_profiles: "सुरक्षिताः कुण्डलीप्रोफाइलाः",
    add_profile: "+ नूतनप्रोफाइलं योजयतु",
    astrology_tools: "ज्योतिषोपकरणानि",
    tool_milan: "💍 कुण्डलीमिलनम् (गुणमेलनम्)",
    tool_panchang: "📅 अद्यतनपञ्चाङ्गम्",
    tool_sadesati: "🪐 शनिसाढ़ेसातीपरीक्षकम्",
    tool_astrologer: "🔮 ज्योतिषीं वृणु",
    tool_kundli: "🪐 कुण्डलीचित्रं भावाश्च",
    tool_reports: "📑 कुण्डलीप्रतिवेदनम् (PDF)",
    tool_docs: "📚 शास्त्रीयज्ञानकोशः",
    tool_grounded: "📜 शास्त्रीयप्रमाणितप्रतिवेदनम्",
    tool_agent: "🔮 शास्त्रीयज्योतिषसाधनानि",
    switch_astrologer: "परिवर्तय ▾",
    no_profile_selected: "कोऽपि प्रोफाइलः न चयनितः",
    intake_title: "ज्योतिषपरामर्शविवरणम् (Intake)",
    intake_subtitle: "सटीकवैदिकफलादेशाय स्वजन्मविवरणं प्रविशतु।",
    label_full_name: "पूर्णनाम",
    placeholder_full_name: "उदा. राहुल शर्मा",
    label_gender: "लिङ्गम्",
    gender_male: "पुमान्",
    gender_female: "स्त्री",
    gender_other: "अन्यत्",
    label_dob: "जन्मदिनाङ्कः",
    label_tob: "जन्मसमयः",
    label_pob: "जन्मस्थानम् (नगरम्)",
    placeholder_pob: "उदा. नवदेहली, भारतम्",
    label_query: "भवतः प्रश्नः / जिज्ञासा",
    placeholder_query: "उदा. आजीविका, विवाहसमयः, धनलाभः, शान्त्युपायाश्च...",
    btn_start_consultation: "पंडितवरेण सह सम्भाषणम् आरभताम् ➔",
    quick_select: "⚡ त्वरितचयनम्:",
    cosmic_highlights: "ग्रहगोचरः कुण्डली च",
    active_profile: "सक्रियं जन्मप्रोफाइलम्",
    edit_profile: "संशोधयतु",
    lagna_kundli: "लग्नकुण्डली (D1)",
    key_placements: "मुख्यग्रहस्थितयः",
    ascendant_lagna: "लग्नम् (ASCENDANT)",
    moon_sign: "चन्द्रराशिः (RASHI)",
    sun_sign: "सूर्यराशिः (SURYA)",
    moon_nakshatra: "जन्मनक्षत्रम्",
    ask_placeholder: "पूज्यज्योतिषाय प्रश्नं पृच्छतु...",
    btn_palm: "हस्तचित्रम्",
    btn_kundli_chat: "सम्भाषणे कुण्डली",
    btn_attach: "पत्रं योजय",
    btn_tools: "साधनानि",
    btn_export_consultation: "📜 परामर्शपत्रिका (Export)",
    btn_download_png: "📥 कुण्डली PNG",
    btn_download_pdf: "📥 सम्पूर्णप्रतिवेदनम् (PDF)",
    btn_share_whatsapp: "💬 व्हाट्सएप सम्प्रेषणम्",
    demo_mode: "डेमो",
    checking_system: "ज्योतिषाचार्यः संबध्यते...",
    system_ready: "आचार्यः साक्षात् उपविष्टः 🟢",
    lang_switched: "भाषा परिवर्तिता: संस्कृतम्"
  },

  mr: {
    lang_name: "मराठी (Marathi)",
    brand_subtitle: "वैदिक ज्योतिष व जन्मपत्रिका सल्ला",
    new_consultation: "नवीन सल्लामसलत",
    search_conversations: "सल्ला शोधा...",
    recent_consultations: "अलीकडील सल्लामसलत",
    saved_profiles: "जतन केलेल्या पत्रिका",
    add_profile: "+ नवीन प्रोफाइल जोडा",
    astrology_tools: "ज्योतिष साधने",
    tool_milan: "💍 कुंडली मिलन (३६ गुण)",
    tool_panchang: "📅 आजचे पंचांग",
    tool_sadesati: "🪐 शनि साडेसाती ट्रॅकर",
    tool_astrologer: "🔮 ज्योतिषी निवडा",
    tool_kundli: "🪐 कुंडली आकृती व भाव",
    tool_reports: "📑 पीडीएफ पत्रिका अहवाल",
    tool_docs: "📚 शास्त्रीय ज्ञानकोश",
    tool_grounded: "📜 शास्त्रीय प्रमाणित अहवाल",
    tool_agent: "🔮 शास्त्रीय ज्योतिष साधने",
    switch_astrologer: "बदला ▾",
    no_profile_selected: "कोणतीही प्रोफाइल निवडलेली नाही",
    intake_title: "पंडित जी सल्लामसलत तपशील",
    intake_subtitle: "अचूक वैदिक भविष्यकथन व उपायांसाठी आपली जन्म माहिती प्रविष्ट करा.",
    label_full_name: "पूर्ण नाव",
    placeholder_full_name: "उदा. राहुल शर्मा",
    label_gender: "लिंग",
    gender_male: "पुरुष",
    gender_female: "स्त्री",
    gender_other: "इतर",
    label_dob: "जन्म तारीख",
    label_tob: "जन्म वेळ",
    label_pob: "जन्म स्थान (शहर)",
    placeholder_pob: "उदा. मुंबई, भारत",
    label_query: "आपला प्रश्न किंवा चिंता",
    placeholder_query: "उदा. करिअर, विवाह, धनलाभ, आरोग्य व उपाय...",
    btn_start_consultation: "पंडित जींशी सल्ला सुरू करा ➔",
    quick_select: "⚡ जलद निवड:",
    cosmic_highlights: "ग्रह स्थिती व कुंडली",
    active_profile: "सक्रिय जन्म प्रोफाइल",
    edit_profile: "संपादित करा",
    lagna_kundli: "लग्न कुंडली (D1)",
    key_placements: "मुख्य ग्रह स्थिती",
    ascendant_lagna: "लग्न (ASCENDANT)",
    moon_sign: "चंद्र राशी (RASHI)",
    sun_sign: "सूर्य राशी (SURYA)",
    moon_nakshatra: "जन्म नक्षत्र",
    ask_placeholder: "पंडित जींना आपला प्रश्न विचारा... (करिअर, विवाह वा उपाय)",
    btn_palm: "हस्तरेखा फोटो",
    btn_kundli_chat: "चॅटमध्ये कुंडली",
    btn_attach: "कागदपत्र जोडा",
    btn_tools: "ज्योतिष साधने",
    btn_export_consultation: "📜 सल्लामसलत जतन करा",
    btn_download_png: "📥 कुंडली PNG",
    btn_download_pdf: "📥 संपूर्ण अहवाल PDF",
    btn_share_whatsapp: "💬 व्हॉट्सअॅप शेअर",
    demo_mode: "डेमो",
    checking_system: "ज्योतिषाचार्यांशी संपर्क होत आहे...",
    system_ready: "आचार्य थेट उपलब्ध आहेत 🟢",
    lang_switched: "भाषा बदलून मराठी केली आहे"
  },

  gu: {
    lang_name: "ગુજરાતી (Gujarati)",
    brand_subtitle: "વૈદિક જ્યોતિષ અને જન્મકુંડળી પરામર્શ",
    new_consultation: "નવું પરામર્શ",
    search_conversations: "પરામર્શ શોધો...",
    recent_consultations: "તાજેતરના પરામર્શ",
    saved_profiles: "સાચવેલી કુંડળીઓ",
    add_profile: "+ નવી પ્રોફાઇલ ઉમેરો",
    astrology_tools: "જ્યોતિષ સાધનો",
    tool_milan: "💍 કુંડળી મિલન (૩૬ ગુણ)",
    tool_panchang: "📅 આજનું પંચાંગ",
    tool_sadesati: "🪐 શનિ સાડાસાતી ટ્રેકર",
    tool_astrologer: "🔮 જ્યોતિષી પસંદ કરો",
    tool_kundli: "🪐 કુંડળી આકૃતિ અને ભાવ",
    tool_reports: "📑 પીડીએફ કુંડળી અહેવાલ",
    tool_docs: "📚 શાસ્ત્રીય જ્ઞાનકોશ",
    tool_grounded: "📜 શાસ્ત્રીય પ્રમાણિત અહેવાલ",
    tool_agent: "🔮 વૈદિક જ્યોતિષ સાધનો (Vedic Tools)",
    switch_astrologer: "બદલો ▾",
    no_profile_selected: "કોઈ પ્રોફાઇલ પસંદ કરેલ નથી",
    intake_title: "જ્યોતિષ પરામર્શ વિગત (Intake)",
    intake_subtitle: "ચોક્કસ આગાહીઓ માટે તમારી જન્મ વિગતો દાખલ કરો.",
    label_full_name: "પૂરું નામ",
    placeholder_full_name: "દા.ત. રાહુલ શર્મા",
    label_gender: "જાતિ",
    gender_male: "પુરુષ",
    gender_female: "સ્ત્રી",
    gender_other: "અન્ય",
    label_dob: "જન્મ તારીખ",
    label_tob: "જન્મ સમય",
    label_pob: "જન્મ સ્થળ (શહેર)",
    placeholder_pob: "દા.ત. અમદાવાદ, ભારત",
    label_query: "તમારો પ્રશ્ન અથવા ચિંતા",
    placeholder_query: "દા.ત. કારકિર્દી, લગ્નનો સમય, ધનલાભ, સ્વાસ્થ્ય અને ઉપાયો...",
    btn_start_consultation: "લાઇવ જ્યોતિષ પરામર્શ શરૂ કરો ➔",
    quick_select: "⚡ ઝડપી પસંદગી:",
    cosmic_highlights: "ગ્રહ સ્થિતિ અને કુંડળી",
    active_profile: "સક્રિય જન્મ પ્રોફાઇલ",
    edit_profile: "સુધારો",
    lagna_kundli: "લગ્ન કુંડળી (D1)",
    key_placements: "મુખ્ય ગ્રહ સ્થિતિ",
    ascendant_lagna: "લગ્ન (ASCENDANT)",
    moon_sign: "ચંદ્ર રાશિ (RASHI)",
    sun_sign: "સૂર્ય રાશિ (SURYA)",
    moon_nakshatra: "જન્મ નક્ષત્ર",
    ask_placeholder: "તમારા જ્યોતિષીને કંઈપણ પૂછો...",
    btn_palm: "હસ્તરેખા ફોટો",
    btn_kundli_chat: "ચેટમાં કુંડળી",
    btn_attach: "દસ્તાવેજ ઉમેરો",
    btn_tools: "ટૂલ્સ",
    btn_export_consultation: "📜 પરામર્શ ડાઉનલોડ",
    btn_download_png: "📥 કુંડળી PNG",
    btn_download_pdf: "📥 સંપૂર્ણ અહેવાલ PDF",
    btn_share_whatsapp: "💬 વોટ્સએપ શેર",
    demo_mode: "ડેમો",
    checking_system: "તપાસ ચાલુ છે...",
    system_ready: "સિસ્ટમ તૈયાર",
    lang_switched: "ભાષા બદલાઈ: ગુજરાતી"
  },

  bn: {
    lang_name: "বাংলা (Bengali)",
    brand_subtitle: "বৈদিক জ্যোতিষ ও জন্মকুষ্ঠি পরামর্শ",
    new_consultation: "নতুন পরামর্শ",
    search_conversations: "পরামর্শ খুঁজুন...",
    recent_consultations: "সাম্প্রতিক পরামর্শ",
    saved_profiles: "সংরক্ষিত কুষ্ঠি প্রোফাইল",
    add_profile: "+ নতুন প্রোফাইল যোগ করুন",
    astrology_tools: "জ্যোতিষ সরঞ্জাম",
    tool_milan: "💍 কুষ্ঠি মিলন (৩৬ গুণ)",
    tool_panchang: "📅 আজকের পঞ্জিকা",
    tool_sadesati: "🪐 শনি সাড়ে সাতি ট্র্যাকার",
    tool_astrologer: "🔮 জ্যোতিষী নির্বাচন করুন",
    tool_kundli: "🪐 কুষ্ঠি চিত্র ও ভাব",
    tool_reports: "📑 পিডিএফ কুষ্ঠি রিপোর্ট",
    tool_docs: "📚 শাস্ত্রীয় জ্ঞানভাণ্ডার",
    tool_grounded: "📜 শাস্ত্রীয় প্রমাণিত রিপোর্ট",
    tool_agent: "🔮 বৈদিক জ্যোতিষ সরঞ্জাম (Vedic Tools)",
    switch_astrologer: "পরিবর্তন ▾",
    no_profile_selected: "কোনো প্রোফাইল নির্বাচিত নেই",
    intake_title: "জ্যোতিষ পরামর্শ বিবরণ",
    intake_subtitle: "সঠিক পূর্বাভাসের জন্য আপনার জন্ম বিবরণ লিখুন।",
    label_full_name: "পুরো নাম",
    placeholder_full_name: "উদাঃ রাহুল শর্মা",
    label_gender: "লিঙ্গ",
    gender_male: "পুরুষ",
    gender_female: "মহিলা",
    gender_other: "অন্যান্য",
    label_dob: "জন্ম তারিখ",
    label_tob: "জন্ম সময়",
    label_pob: "জন্মস্থান (শহর)",
    placeholder_pob: "উদাঃ কলকাতা, ভারত",
    label_query: "আপনার প্রশ্ন বা জিজ্ঞাসা",
    placeholder_query: "উদাঃ কর্মজীবন, বিবাহের সময়, ধনলাভ, স্বাস্থ্য ও প্রতিকার...",
    btn_start_consultation: "লাইভ জ্যোতিষ পরামর্শ শুরু করুন ➔",
    quick_select: "⚡ দ্রুত নির্বাচন:",
    cosmic_highlights: "গ্রহ স্থিতি ও কুষ্ঠি",
    active_profile: "সক্রিয় জন্ম প্রোফাইল",
    edit_profile: "সম্পাদনা",
    lagna_kundli: "লগ্ন কুষ্ঠি (D1)",
    key_placements: "প্রধান গ্রহ স্থিতি",
    ascendant_lagna: "লগ্ন (ASCENDANT)",
    moon_sign: "চন্দ্র রাশি (RASHI)",
    sun_sign: "সূর্য রাশি (SURYA)",
    moon_nakshatra: "জন্ম নক্ষত্র",
    ask_placeholder: "আপনার জ্যোতিষীকে যে কোনো প্রশ্ন করুন...",
    btn_palm: "হস্তরেখা ছবি",
    btn_kundli_chat: "চ্যাটে কুষ্ঠি",
    btn_attach: "নথি যোগ করুন",
    btn_tools: "সরঞ্জাম",
    btn_export_consultation: "📜 পরামর্শ ডাউনলোড",
    btn_download_png: "📥 কুষ্ঠি PNG",
    btn_download_pdf: "📥 সম্পূর্ণ রিপোর্ট PDF",
    btn_share_whatsapp: "💬 হোয়াটসঅ্যাপ শেয়ার",
    demo_mode: "ডেমো",
    checking_system: "পরীক্ষা চলছে...",
    system_ready: "সিস্টেম প্রস্তুত",
    lang_switched: "ভাষা পরিবর্তিত: বাংলা"
  },

  ta: {
    lang_name: "தமிழ் (Tamil)",
    brand_subtitle: "வேத ஜோதிடம் மற்றும் ஜாதக ஆலோசனை",
    new_consultation: "புதிய கலந்தாய்வு",
    search_conversations: "கலந்தாய்வுகளைத் தேடுங்கள்...",
    recent_consultations: "சமீபத்திய கலந்தாய்வுகள்",
    saved_profiles: "சேமிக்கப்பட்ட ஜாதகங்கள்",
    add_profile: "+ புதிய சுயவிவரம் சேர்",
    astrology_tools: "ஜோதிட கருவிகள்",
    tool_milan: "💍 ஜாதகப் பொருத்தம் (36 குணங்கள்)",
    tool_panchang: "📅 இன்றைய பஞ்சாங்கம்",
    tool_sadesati: "🪐 ஏழரை சனி கண்காணிப்பான்",
    tool_astrologer: "🔮 ஜோதிடரைத் தேர்வு செய்",
    tool_kundli: "🪐 ஜாதக வரைபடம் & பாவங்கள்",
    tool_reports: "📑 பிடிஎஃப் ஜாதக அறிக்கை",
    tool_docs: "📚 பாரம்பரிய ஜோதிட நூல்கள்",
    tool_grounded: "📜 சாஸ்திர பூர்வ அறிக்கை",
    tool_agent: "🔮 வேத ஜோதிடக் கருவிகள் (Vedic Tools)",
    switch_astrologer: "மாற்று ▾",
    no_profile_selected: "சுயவிவரம் தேர்ந்தெடுக்கப்படவில்லை",
    intake_title: "ஜோதிட கலந்தாய்வு விவரங்கள்",
    intake_subtitle: "துல்லியமான வேத கணிப்புகளுக்கு உங்கள் பிறப்பு விவரங்களை உள்ளிடவும்.",
    label_full_name: "முழுப் பெயர்",
    placeholder_full_name: "எ.கா. ராகுல் சர்மா",
    label_gender: "பாலினம்",
    gender_male: "ஆண்",
    gender_female: "பெண்",
    gender_other: "மற்றவை",
    label_dob: "பிறந்த தேதி",
    label_tob: "பிறந்த நேரம்",
    label_pob: "பிறந்த ஊர் / நகரம்",
    placeholder_pob: "எ.கா. சென்னை, இந்தியா",
    label_query: "உங்கள் கேள்வி / சந்தேகம்",
    placeholder_query: "எ.கா. தொழில் முன்னேற்றம், திருமண நேரம், செல்வம், பரிகாரங்கள்...",
    btn_start_consultation: "நேரலை ஜோதிட கலந்தாய்வைத் தொடங்குங்கள் ➔",
    quick_select: "⚡ விரைவுத் தேர்வு:",
    cosmic_highlights: "கிரக நிலைகள் & ஜாதகம்",
    active_profile: "செயலில் உள்ள சுயவிவரம்",
    edit_profile: "திருத்து",
    lagna_kundli: "லக்ன ஜாதகம் (D1)",
    key_placements: "முக்கிய கிரக நிலைகள்",
    ascendant_lagna: "லக்னம் (ASCENDANT)",
    moon_sign: "சந்திர ராசி (RASHI)",
    sun_sign: "சூரிய ராசி (SURYA)",
    moon_nakshatra: "பிறப்பு நட்சத்திரம்",
    ask_placeholder: "உங்கள் ஜோதிடரிடம் எதுவும் கேளுங்கள்...",
    btn_palm: "கைரேகை புகைப்படம்",
    btn_kundli_chat: "உரையாடலில் ஜாதகம்",
    btn_attach: "ஆவணம் சேர்",
    btn_tools: "கருவிகள்",
    btn_export_consultation: "📜 கலந்தாய்வு பதிவிறக்கம்",
    btn_download_png: "📥 ஜாதகம் PNG",
    btn_download_pdf: "📥 முழு அறிக்கை PDF",
    btn_share_whatsapp: "💬 வாட்ஸ்அப் பகிர்வு",
    demo_mode: "டெமோ",
    checking_system: "சரிபார்க்கிறது...",
    system_ready: "அமைப்பு தயார்",
    lang_switched: "மொழி மாற்றப்பட்டது: தமிழ்"
  },

  te: {
    lang_name: "తెలుగు (Telugu)",
    brand_subtitle: "వైదిక జ్యోతిష్యం & జాతక సంప్రదింపులు",
    new_consultation: "కొత్త సంప్రదింపులు",
    search_conversations: "సంభాషణలను శోధించండి...",
    recent_consultations: "ఇటీవల సంప్రదింపులు",
    saved_profiles: "భద్రపరచిన జాతకాలు",
    add_profile: "+ కొత్త ప్రొఫైల్ జోడించు",
    astrology_tools: "జ్యోతిష్య సాధనాలు",
    tool_milan: "💍 జాతక పొంతన (36 గుణాలు)",
    tool_panchang: "📅 నేటి పంచాంగం",
    tool_sadesati: "🪐 ఏలినాటి శని ట్రాకర్",
    tool_astrologer: "🔮 జ్యోతిష్యుడిని ఎంచుకోండి",
    tool_kundli: "🪐 జాతక చక్రం & భావాలు",
    tool_reports: "📑 పిడిఎఫ్ జాతక నివేదిక",
    tool_docs: "📚 సాంప్రదాయ జ్ఞాన భాండాగారం",
    tool_grounded: "📜 శాస్త్రీయ ధృవీకరణ నివేదిక",
    tool_agent: "🔮 వైదిక జ్యోతిష్య సాధనాలు (Vedic Tools)",
    switch_astrologer: "మార్చు ▾",
    no_profile_selected: "ప్రొఫైల్ ఎంచుకోలేదు",
    intake_title: "జ్యోతిష్య సంప్రదింపుల వివరాలు",
    intake_subtitle: "ఖచ్చితమైన వైదిక ఫలితాల కోసం మీ పుట్టిన వివరాలను నమోదు చేయండి.",
    label_full_name: "పూర్తి పేరు",
    placeholder_full_name: "ఉదా. రాహుల్ శర్మ",
    label_gender: "లింగం",
    gender_male: "పురుషుడు",
    gender_female: "మహిళ",
    gender_other: "ఇతర",
    label_dob: "పుట్టిన తేదీ",
    label_tob: "పుట్టిన సమయం",
    label_pob: "పుట్టిన స్థలం (నగరం)",
    placeholder_pob: "ఉదా. హైదరాబాద్, భారతదేశం",
    label_query: "మీ ప్రశ్న లేదా సందేహం",
    placeholder_query: "ఉదా. ఉద్యోగ వృద్ధి, వివాహ సమయం, ధనలాభం, పరిహారాలు...",
    btn_start_consultation: "లైవ్ జ్యోతిష్య సంప్రదింపులను ప్రారంభించండి ➔",
    quick_select: "⚡ త్వరిత ఎంపిక:",
    cosmic_highlights: "గ్రహ స్థితులు & జాతకం",
    active_profile: "యాక్టివ్ ప్రొఫైల్",
    edit_profile: "సవరించు",
    lagna_kundli: "లగ్న చక్రం (D1)",
    key_placements: "ముఖ్య గ్రహ స్థితులు",
    ascendant_lagna: "లగ్నం (ASCENDANT)",
    moon_sign: "చంద్ర రాశి (RASHI)",
    sun_sign: "సూర్య రాశి (SURYA)",
    moon_nakshatra: "జన్మ నక్షత్రం",
    ask_placeholder: "మీ జ్యోతిష్యుడిని ఏదైనా అడగండి...",
    btn_palm: "హస్తరేఖ ఫోటో",
    btn_kundli_chat: "చాట్‌లో జాతకం",
    btn_attach: "పత్రం జోడించు",
    btn_tools: "సాధనాలు",
    btn_export_consultation: "📜 సంప్రదింపుల డౌన్‌లోడ్",
    btn_download_png: "📥 జాతకం PNG",
    btn_download_pdf: "📥 పూర్తి నివేదిక PDF",
    btn_share_whatsapp: "💬 వాట్సాప్ షేర్",
    demo_mode: "డెమో",
    checking_system: "తనిఖీ చేస్తోంది...",
    system_ready: "సిస్టమ్ సిద్ధం",
    lang_switched: "భాష మార్చబడింది: తెలుగు"
  }
};

const I18n = {
  currentLang: "en",

  init() {
    const select = document.getElementById("chat-lang-select");
    if (select) {
      select.addEventListener("change", (e) => {
        this.setLanguage(e.target.value, true);
      });
    }
    const saved = localStorage.getItem("astro_preferred_lang") || "en";
    this.setLanguage(saved, false);
  },

  t(key) {
    const dict = ASTRO_I18N[this.currentLang] || ASTRO_I18N.en;
    return dict[key] || (ASTRO_I18N.en[key] || key);
  },

  setLanguage(lang, showToast = true) {
    if (!ASTRO_I18N[lang]) {
      lang = "en";
    }
    this.currentLang = lang;
    localStorage.setItem("astro_preferred_lang", lang);
    document.documentElement.setAttribute("lang", lang);

    // Sync dropdown if exists
    const select = document.getElementById("chat-lang-select");
    if (select && select.value !== lang) {
      select.value = lang;
    }

    // Sync ChatController
    if (window.ChatController) {
      window.ChatController.currentLanguage = lang;
    }

    // Apply translations across all marked DOM elements
    this.applyTranslations();

    if (showToast && window.App && typeof window.App.showToast === "function") {
      const msg = this.t("lang_switched");
      window.App.showToast(msg, "info");
    }
  },

  applyTranslations() {
    const dict = ASTRO_I18N[this.currentLang] || ASTRO_I18N.en;

    // 1. Text elements
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // 2. Placeholder elements
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) {
        el.setAttribute("placeholder", dict[key]);
      }
    });

    // 3. Title / tooltip elements
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (dict[key]) {
        el.setAttribute("title", dict[key]);
      }
    });
  }
};

window.I18n = I18n;
window.ASTRO_I18N = ASTRO_I18N;
