"""Starter Bhakti texts. Every item is a public-domain original (Sanskrit verses from the Mahabharata's Bhagavad Gita; Tulsidas's
Hanuman Chalisa). The meanings are our own wording, not copied from any published translation or commentary.

All of it is seeded as UNVERIFIED: an editor must compare it with a cited source before turning `is_verified` on. Seeding only adds
rows that are missing and never overwrites anything an admin has edited."""

# (number, Sanskrit name, Hindi name, English name, verse count, one-line summary in our own words)
# Verse counts follow the traditional 700-verse count (chapter 13 = 34; some editions number an extra opening verse as 35).
GITA_CHAPTERS = [
    (1, "अर्जुनविषादयोग", "अर्जुन विषाद योग", "Arjuna's Dejection", 47, "On the battlefield Arjuna sees his own kin on both sides and is overcome with grief and doubt."),
    (2, "साङ्ख्ययोग", "सांख्य योग", "The Yoga of Knowledge", 72, "Krishna teaches the imperishable self and the call to act without clinging to results."),
    (3, "कर्मयोग", "कर्म योग", "The Yoga of Action", 43, "Why action is necessary, and how to act as selfless duty rather than for reward."),
    (4, "ज्ञानकर्मसंन्यासयोग", "ज्ञान कर्म संन्यास योग", "Knowledge and Renunciation of Action", 42, "Knowledge, sacrifice, and why divine guidance returns whenever dharma declines."),
    (5, "कर्मसंन्यासयोग", "कर्म संन्यास योग", "The Yoga of Renunciation", 29, "Renouncing action and acting selflessly are compared; inner detachment is the key."),
    (6, "ध्यानयोग", "ध्यान योग", "The Yoga of Meditation", 47, "How to steady the restless mind through discipline, balance and meditation."),
    (7, "ज्ञानविज्ञानयोग", "ज्ञान विज्ञान योग", "Knowledge and Realisation", 30, "The divine nature and the different kinds of people who turn to it."),
    (8, "अक्षरब्रह्मयोग", "अक्षर ब्रह्म योग", "The Imperishable Brahman", 28, "What the mind holds at life's end, and the path of remembrance."),
    (9, "राजविद्याराजगुह्ययोग", "राज विद्या राज गुह्य योग", "The Royal Knowledge", 34, "The most confidential knowledge: devotion offered with a pure heart is accepted."),
    (10, "विभूतियोग", "विभूति योग", "Divine Glories", 42, "The many ways the divine is present and expressed in the world."),
    (11, "विश्वरूपदर्शनयोग", "विश्वरूप दर्शन योग", "The Universal Form", 55, "Arjuna is shown the cosmic form and responds with awe and humility."),
    (12, "भक्तियोग", "भक्ति योग", "The Yoga of Devotion", 20, "The qualities of a devotee and why loving devotion is dear to the divine."),
    (13, "क्षेत्रक्षेत्रज्ञविभागयोग", "क्षेत्र क्षेत्रज्ञ विभाग योग", "The Field and the Knower", 34, "The distinction between the body (field) and the one who knows it."),
    (14, "गुणत्रयविभागयोग", "गुणत्रय विभाग योग", "The Three Gunas", 27, "Sattva, rajas and tamas, and how to rise beyond their pull."),
    (15, "पुरुषोत्तमयोग", "पुरुषोत्तम योग", "The Supreme Person", 20, "The world as a tree, and the highest reality beyond the perishable and imperishable."),
    (16, "दैवासुरसम्पद्विभागयोग", "दैवासुर संपद् विभाग योग", "Divine and Demonic Natures", 24, "Virtuous and harmful tendencies, and the guidance of scripture."),
    (17, "श्रद्धात्रयविभागयोग", "श्रद्धा त्रय विभाग योग", "The Three Kinds of Faith", 28, "How faith, food, worship and austerity differ according to the gunas."),
    (18, "मोक्षसंन्यासयोग", "मोक्ष संन्यास योग", "Liberation through Renunciation", 78, "A summary of the teaching and the final call to surrender and act."),
]

_SRC = "Bhagavad Gita (Mahabharata, Bhishma Parva); traditional Sanskrit text. Compare with Wikisource / GRETIL before verifying."

# (chapter, verse, Sanskrit, transliteration, meaning_hi, meaning_en)
GITA_VERSES = [
    (1, 1, "धृतराष्ट्र उवाच ।\nधर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।\nमामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥",
     "dhṛtarāṣṭra uvāca\ndharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ\nmāmakāḥ pāṇḍavāś caiva kim akurvata sañjaya",
     "धृतराष्ट्र ने पूछा: हे सञ्जय, धर्म की उस भूमि कुरुक्षेत्र में युद्ध की इच्छा से इकट्ठा हुए मेरे पुत्रों और पाण्डवों ने क्या किया?",
     "Dhritarashtra asks Sanjaya: on the sacred field of Kurukshetra, what did my sons and the Pandavas do, gathered there eager to fight?"),
    (2, 20, "न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः ।\nअजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे ॥",
     "na jāyate mriyate vā kadācin nāyaṃ bhūtvā bhavitā vā na bhūyaḥ\najo nityaḥ śāśvato 'yaṃ purāṇo na hanyate hanyamāne śarīre",
     "आत्मा न कभी जन्म लेती है, न मरती है। वह अजन्मा, नित्य, शाश्वत और पुरातन है; शरीर के नष्ट होने पर भी उसका नाश नहीं होता।",
     "The self is never born and never dies. It is unborn, constant, eternal and ancient; it is not destroyed when the body is."),
    (2, 22, "वासांसि जीर्णानि यथा विहाय नवानि गृह्णाति नरोऽपराणि ।\nतथा शरीराणि विहाय जीर्णान्यन्यानि संयाति नवानि देही ॥",
     "vāsāṃsi jīrṇāni yathā vihāya navāni gṛhṇāti naro 'parāṇi\ntathā śarīrāṇi vihāya jīrṇāny anyāni saṃyāti navāni dehī",
     "जैसे मनुष्य पुराने वस्त्र छोड़कर नए वस्त्र पहन लेता है, वैसे ही देहधारी आत्मा पुराने शरीर छोड़कर नए शरीर धारण करती है।",
     "Just as a person casts off worn-out clothes and puts on new ones, the embodied self casts off worn-out bodies and takes on new ones."),
    (2, 47, "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥",
     "karmaṇy evādhikāras te mā phaleṣu kadācana\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi",
     "तुम्हारा अधिकार केवल कर्म करने में है, उसके फलों में कभी नहीं। न तो फल को अपने कर्म का कारण मानो, और न कर्म न करने में आसक्त हो।",
     "Your right is to the action alone, never to its fruits. Do not make the reward your motive, and do not cling to inaction either."),
    (4, 7, "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत ।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥",
     "yadā yadā hi dharmasya glānir bhavati bhārata\nabhyutthānam adharmasya tadātmānaṃ sṛjāmy aham",
     "हे भारत, जब-जब धर्म की हानि और अधर्म की वृद्धि होती है, तब-तब मैं स्वयं को प्रकट करता हूँ।",
     "Whenever righteousness declines and unrighteousness rises, O Arjuna, I bring myself forth."),
    (4, 8, "परित्राणाय साधूनां विनाशाय च दुष्कृताम् ।\nधर्मसंस्थापनार्थाय सम्भवामि युगे युगे ॥",
     "paritrāṇāya sādhūnāṃ vināśāya ca duṣkṛtām\ndharma-saṃsthāpanārthāya sambhavāmi yuge yuge",
     "सज्जनों की रक्षा, दुष्टों के विनाश और धर्म की स्थापना के लिए मैं युग-युग में प्रकट होता हूँ।",
     "To protect the good, to end evil-doing and to re-establish dharma, I appear age after age."),
    (6, 5, "उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥",
     "uddhared ātmanātmānaṃ nātmānam avasādayet\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ",
     "मनुष्य को अपने ही द्वारा अपना उद्धार करना चाहिए, अपने को गिराना नहीं चाहिए; क्योंकि मनुष्य स्वयं ही अपना मित्र है और स्वयं ही अपना शत्रु।",
     "Lift yourself by your own effort and do not let yourself sink; for you are your own friend, and you can also be your own enemy."),
    (18, 66, "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज ।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः ॥",
     "sarva-dharmān parityajya mām ekaṃ śaraṇaṃ vraja\nahaṃ tvāṃ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ",
     "सब धर्मों की चिंता छोड़कर केवल मेरी शरण में आ जाओ। मैं तुम्हें सब पापों से मुक्त कर दूँगा; शोक मत करो।",
     "Letting go of all other supports, come to me alone for refuge. I will free you from all burdens; do not grieve."),
    (18, 78, "यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः ।\nतत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मतिर्मम ॥",
     "yatra yogeśvaraḥ kṛṣṇo yatra pārtho dhanur-dharaḥ\ntatra śrīr vijayo bhūtir dhruvā nītir matir mama",
     "जहाँ योगेश्वर कृष्ण हैं और जहाँ धनुर्धारी अर्जुन हैं, वहीं श्री, विजय, समृद्धि और अटल नीति है: यह मेरा मत है।",
     "Where Krishna, lord of yoga, and Arjuna, the archer, are together, there are prosperity, victory, well-being and steady righteousness: this is my conviction."),
]
GITA_SOURCE = _SRC

HANUMAN_CHALISA = {
    "slug": "hanuman-chalisa", "kind": "chalisa", "deity": "hanuman",
    "title_hi": "हनुमान चालीसा", "title_en": "Hanuman Chalisa",
    "source": "Tulsidas, Hanuman Chalisa (16th century; traditional text). Compare with Wikisource before verifying.",
    "license": "Public domain (original text); meaning is our own wording",
    "body_hi": """॥ दोहा ॥
श्रीगुरु चरन सरोज रज, निज मनु मुकुरु सुधारि।
बरनउँ रघुबर बिमल जसु, जो दायकु फल चारि॥
बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार।
बल बुद्धि बिद्या देहु मोहिं, हरहु कलेस बिकार॥

॥ चौपाई ॥
जय हनुमान ज्ञान गुन सागर। जय कपीस तिहुँ लोक उजागर॥
रामदूत अतुलित बल धामा। अंजनि-पुत्र पवनसुत नामा॥
महाबीर बिक्रम बजरंगी। कुमति निवार सुमति के संगी॥
कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा॥
हाथ बज्र औ ध्वजा बिराजै। काँधे मूँज जनेऊ साजै॥
संकर सुवन केसरीनंदन। तेज प्रताप महा जग बंदन॥
बिद्यावान गुनी अति चातुर। राम काज करिबे को आतुर॥
प्रभु चरित्र सुनिबे को रसिया। राम लखन सीता मन बसिया॥
सूक्ष्म रूप धरि सियहिं दिखावा। बिकट रूप धरि लंक जरावा॥
भीम रूप धरि असुर सँहारे। रामचंद्र के काज सँवारे॥
लाय सजीवन लखन जियाए। श्रीरघुबीर हरषि उर लाए॥
रघुपति कीन्ही बहुत बड़ाई। तुम मम प्रिय भरतहि सम भाई॥
सहस बदन तुम्हरो जस गावैं। अस कहि श्रीपति कंठ लगावैं॥
सनकादिक ब्रह्मादि मुनीसा। नारद सारद सहित अहीसा॥
जम कुबेर दिगपाल जहाँ ते। कबि कोबिद कहि सके कहाँ ते॥
तुम उपकार सुग्रीवहिं कीन्हा। राम मिलाय राज पद दीन्हा॥
तुम्हरो मंत्र बिभीषन माना। लंकेस्वर भए सब जग जाना॥
जुग सहस्र जोजन पर भानू। लील्यो ताहि मधुर फल जानू॥
प्रभु मुद्रिका मेलि मुख माहीं। जलधि लाँघि गए अचरज नाहीं॥
दुर्गम काज जगत के जेते। सुगम अनुग्रह तुम्हरे तेते॥
राम दुआरे तुम रखवारे। होत न आज्ञा बिनु पैसारे॥
सब सुख लहै तुम्हारी सरना। तुम रच्छक काहू को डर ना॥
आपन तेज सम्हारो आपै। तीनों लोक हाँक तें काँपै॥
भूत पिसाच निकट नहिं आवै। महाबीर जब नाम सुनावै॥
नासै रोग हरै सब पीरा। जपत निरंतर हनुमत बीरा॥
संकट तें हनुमान छुड़ावै। मन क्रम बचन ध्यान जो लावै॥
सब पर राम तपस्वी राजा। तिन के काज सकल तुम साजा॥
और मनोरथ जो कोई लावै। सोइ अमित जीवन फल पावै॥
चारों जुग परताप तुम्हारा। है परसिद्ध जगत उजियारा॥
साधु-संत के तुम रखवारे। असुर निकंदन राम दुलारे॥
अष्ट सिद्धि नौ निधि के दाता। अस बर दीन जानकी माता॥
राम रसायन तुम्हरे पासा। सदा रहो रघुपति के दासा॥
तुम्हरे भजन राम को पावै। जनम-जनम के दुख बिसरावै॥
अंत काल रघुबर पुर जाई। जहाँ जन्म हरि-भक्त कहाई॥
और देवता चित्त न धरई। हनुमत सेइ सर्ब सुख करई॥
संकट कटै मिटै सब पीरा। जो सुमिरै हनुमत बलबीरा॥
जय जय जय हनुमान गोसाईं। कृपा करहु गुरुदेव की नाईं॥
जो सत बार पाठ कर कोई। छूटहि बंदि महा सुख होई॥
जो यह पढ़ै हनुमान चलीसा। होय सिद्धि साखी गौरीसा॥
तुलसीदास सदा हरि चेरा। कीजै नाथ हृदय मँह डेरा॥

॥ दोहा ॥
पवन तनय संकट हरन, मंगल मूरति रूप।
राम लखन सीता सहित, हृदय बसहु सुर भूप॥""",
    "meaning_hi": """सार (शब्दशः अनुवाद नहीं; हमारे अपने शब्दों में):

आरंभ के दोहे में कवि गुरु के चरणों की धूल से अपने मन का दर्पण साफ़ करके श्रीराम का निर्मल यश गाने की बात कहता है, और स्वयं को बुद्धिहीन मानकर हनुमान जी से बल, बुद्धि और विद्या माँगता है तथा क्लेश और विकारों को हरने की प्रार्थना करता है।

पहली चौपाइयों में हनुमान जी को ज्ञान और गुणों का सागर, तीनों लोकों को प्रकाशित करने वाला, श्रीराम का दूत और अतुल बल का भंडार कहा गया है। उनके स्वर्ण-वर्ण रूप, कुंडल, गदा और ध्वजा का वर्णन है, और बताया गया है कि वे विद्वान, गुणी और चतुर होकर भी श्रीराम के काम के लिए सदा तत्पर रहते हैं।

आगे उनके पराक्रम गिनाए गए हैं: सीता जी को खोजकर संदेश देना, लंका का दहन, संजीवनी लाकर लक्ष्मण जी के प्राण बचाना, सुग्रीव और विभीषण को श्रीराम से मिलाना, और समुद्र लाँघ जाना। श्रीराम उन्हें भरत के समान प्रिय भाई कहते हैं।

इसके बाद फल-श्रुति है: जो उनकी शरण लेता है उसे भय नहीं रहता, उनका नाम सुनकर बुरी शक्तियाँ दूर रहती हैं, और निरंतर स्मरण से रोग और पीड़ा मिटती है। कठिन से कठिन काम उनकी कृपा से सरल हो जाते हैं। वे श्रीराम के द्वार के रखवाले हैं और साधु-संतों के रक्षक हैं।

अंत में तुलसीदास स्वयं को सदा हरि का सेवक बताकर प्रार्थना करते हैं कि हनुमान जी उनके हृदय में निवास करें। समापन के दोहे में हनुमान जी को संकट हरने वाला और मंगलमूर्ति कहकर श्रीराम, लक्ष्मण और सीता सहित हृदय में बसने की विनती की गई है।""",
    "meaning_en": """Summary (not word-for-word; in our own words):

The opening couplet asks for the guru's grace to clean the mirror of the mind so that the poet can sing the spotless glory of Shri Ram. Admitting his own limits, he asks Hanuman for strength, wisdom and learning, and for the removal of suffering and faults.

The first verses praise Hanuman as an ocean of knowledge and virtue, a messenger of Ram with unmatched strength, and describe his golden form, earrings, mace and banner. Though learned and wise, he is always eager to serve Ram's work.

Next come his deeds: finding Sita and carrying Ram's message, burning Lanka, bringing the healing herb that saved Lakshmana, bringing Sugriva and Vibhishana to Ram, and leaping across the sea. Ram calls him as dear as his brother Bharata.

The closing verses give the benefit of devotion: whoever takes refuge in Hanuman is free of fear, harmful forces stay away at the sound of his name, and constant remembrance ends illness and pain. Hard tasks become easy through his grace; he guards Ram's door and protects the devout.

At the end Tulsidas calls himself a lifelong servant of Hari and asks Hanuman to dwell in his heart. The final couplet greets Hanuman as the remover of troubles and an embodiment of auspiciousness, asking him to stay in the heart together with Ram, Lakshmana and Sita.""",
}


# ---- Mandir Darshan -------------------------------------------------------------------------------------------------
# Facts are stated cautiously and in our own words. No timings are included anywhere: they change, and must come from the
# temple's own channel. Official websites are listed only where we are confident of them; otherwise the field stays empty.
TEMPLE_SOURCE = "Own summary of widely documented facts; compare with the temple's official site or ASI/State records before verifying."
TEMPLES = [
    ("kashi-vishwanath", "Kashi Vishwanath Temple", "काशी विश्वनाथ मंदिर", "Varanasi", "Uttar Pradesh", "Shiva (Vishwanath)",
     "Stands on the western bank of the Ganga in Varanasi. The shrine has been destroyed and rebuilt several times over the centuries; the main structure seen today dates from the late 18th century, supported by Ahilyabai Holkar of Indore. A wide pedestrian corridor linking the temple to the river was opened in 2021.",
     "Counted among the twelve Jyotirlingas of Shiva, and central to the pilgrimage identity of Kashi.",
     ["Mahashivratri", "Shravan month", "Dev Deepawali"], "https://shrikashivishwanath.org"),
    ("somnath", "Somnath Temple", "सोमनाथ मंदिर", "Prabhas Patan (Veraval)", "Gujarat", "Shiva (Somnath)",
     "Located on the Arabian Sea coast at Prabhas Patan. Tradition and history record that the temple was damaged and rebuilt many times. The present Chalukya-style temple was completed and opened in 1951.",
     "Regarded as the first of the twelve Jyotirlingas.",
     ["Mahashivratri", "Kartik Purnima fair"], "https://www.somnath.org"),
    ("tirumala-venkateswara", "Sri Venkateswara Swamy Temple, Tirumala", "श्री वेंकटेश्वर स्वामी मंदिर, तिरुमला", "Tirumala (Tirupati)", "Andhra Pradesh", "Venkateswara (a form of Vishnu)",
     "Set on the Tirumala hills of the Seshachalam range above Tirupati. It is a major Vaishnava pilgrimage centre, administered by the Tirumala Tirupati Devasthanams.",
     "One of the most visited pilgrimage sites in the world; devotees commonly travel there to offer prayers and vows.",
     ["Brahmotsavam", "Vaikuntha Ekadashi"], "https://www.tirumala.org"),
    ("vaishno-devi", "Mata Vaishno Devi Shrine", "माता वैष्णो देवी मंदिर", "Katra", "Jammu and Kashmir", "Mata Vaishno Devi",
     "A cave shrine in the Trikuta hills, reached on foot, by pony or by other facilities from the town of Katra. The shrine is run by the Shri Mata Vaishno Devi Shrine Board.",
     "A very widely visited Shakti pilgrimage in northern India.",
     ["Navratri"], "https://www.maavaishnodevi.org"),
    ("jagannath-puri", "Shri Jagannath Temple", "श्री जगन्नाथ मंदिर", "Puri", "Odisha", "Jagannath, with Balabhadra and Subhadra",
     "A large temple complex near the Bay of Bengal in Puri, known for its tradition of wooden deities that are periodically renewed, and for its annual chariot festival.",
     "Puri is one of the four Char Dham pilgrimage sites. Entry rules are set by the temple administration; please check them before travelling.",
     ["Rath Yatra", "Snana Purnima"], None),
    ("siddhivinayak-mumbai", "Shri Siddhivinayak Temple", "श्री सिद्धिविनायक मंदिर", "Mumbai (Prabhadevi)", "Maharashtra", "Ganesh",
     "A well-known Ganesh temple in the Prabhadevi area of Mumbai, visited daily by large numbers of devotees.",
     "Particularly crowded on Tuesdays and on Ganesh festival days.",
     ["Ganesh Chaturthi", "Sankashti Chaturthi"], "https://www.siddhivinayak.org"),
    ("meenakshi-madurai", "Meenakshi Amman Temple", "मीनाक्षी अम्मन मंदिर", "Madurai", "Tamil Nadu", "Meenakshi (Parvati) and Sundareswarar (Shiva)",
     "A large temple complex in the old city of Madurai, recognised for its tall painted gateway towers (gopurams) and its long Dravidian architectural tradition.",
     "Dedicated to Goddess Meenakshi and her consort Sundareswarar; the heart of Madurai's religious and cultural life.",
     ["Chithirai festival", "Navaratri"], None),
    ("badrinath", "Badrinath Temple", "बद्रीनाथ मंदिर", "Badrinath", "Uttarakhand", "Vishnu (Badrinarayan)",
     "Located in the Himalayas on the bank of the Alaknanda river. Because of winter snow the temple is open only for part of the year, so opening and closing dates must be checked each season.",
     "One of the four Char Dham sites and a major Vaishnava pilgrimage in the Himalayas.",
     ["Mata Murti Ka Mela"], None),
    ("kedarnath", "Kedarnath Temple", "केदारनाथ मंदिर", "Kedarnath", "Uttarakhand", "Shiva (Kedarnath)",
     "A high-altitude stone temple in the Garhwal Himalayas, reached by a trek or by helicopter services. It is open only for part of the year; check the season's dates before planning.",
     "Counted among the twelve Jyotirlingas and the Himalayan Char Dham.",
     ["Mahashivratri"], None),
    ("ram-mandir-ayodhya", "Shri Ram Janmabhoomi Mandir", "श्री राम जन्मभूमि मंदिर", "Ayodhya", "Uttar Pradesh", "Shri Ram (Ram Lalla)",
     "The temple at Ayodhya was consecrated in January 2024. Ayodhya has long been associated with the birthplace of Shri Ram in tradition.",
     "A major pilgrimage destination for devotees of Shri Ram.",
     ["Ram Navami", "Diwali"], None),
    ("mahakaleshwar-ujjain", "Mahakaleshwar Temple", "महाकालेश्वर मंदिर", "Ujjain", "Madhya Pradesh", "Shiva (Mahakaleshwar)",
     "An ancient Shiva temple on the Shipra river in Ujjain, one of the seven sacred cities (Sapta Puri). It is known for the early-morning Bhasma Aarti, which usually needs advance registration through official channels.",
     "Counted among the twelve Jyotirlingas.",
     ["Mahashivratri", "Shravan month"], None),
    ("dwarkadhish", "Dwarkadhish Temple", "द्वारकाधीश मंदिर", "Dwarka", "Gujarat", "Krishna (Dwarkadhish)",
     "A temple in Dwarka on the Gujarat coast, associated in tradition with the city of Krishna.",
     "One of the Char Dham pilgrimage sites.",
     ["Janmashtami"], None),
]
