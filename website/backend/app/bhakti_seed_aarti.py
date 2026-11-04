"""More library texts, one for each weekday deity on the Bhakti home page (Shiva, Ganesh, Durga, Krishna, Hanuman, Ram).

These are traditional aartis and a Tulsidas stotra, long sung and printed with no known living author. The Hindi and Roman texts come from
common printed/sung versions; many variants exist. The meanings are our own short summaries, not word-for-word translations. Everything is seeded
as UNVERIFIED: an editor must compare each text with a trusted printed edition before turning `is_verified` on. Seeding only fills what is missing."""

_SRC = "Traditional aarti, sung and printed in many variant versions. Compare with a trusted printed edition before verifying."
_LIC = "Traditional / public domain (original text); meaning and Roman text are our own work"

SHIV_AARTI = {
    "slug": "om-jai-shiv-omkara", "kind": "aarti", "deity": "shiva",
    "title_hi": "ॐ जय शिव ओंकारा", "title_en": "Om Jai Shiv Omkara",
    "source": "Traditional Shiva aarti, commonly attributed to Shivanand Swami. Variants differ; compare with a trusted printed edition before verifying.",
    "license": _LIC,
    "body_hi": """ॐ जय शिव ओंकारा, स्वामी जय शिव ओंकारा।
ब्रह्मा विष्णु सदाशिव, अर्द्धांगी धारा॥
ॐ जय शिव ओंकारा॥

एकानन चतुरानन पंचानन राजे, स्वामी पंचानन राजे।
हंसानन गरुड़ासन वृषवाहन साजे॥
ॐ जय शिव ओंकारा॥

दो भुज चार चतुर्भुज दसभुज अति सोहे, स्वामी दसभुज अति सोहे।
तीनों रूप निरखता त्रिभुवन जन मोहे॥
ॐ जय शिव ओंकारा॥

अक्षमाला वनमाला मुण्डमाला धारी, स्वामी मुण्डमाला धारी।
चन्दन मृगमद सोहै भोले शशिधारी॥
ॐ जय शिव ओंकारा॥

श्वेताम्बर पीताम्बर बाघम्बर अंगे, स्वामी बाघम्बर अंगे।
सनकादिक ब्रह्मादिक भूतादिक संगे॥
ॐ जय शिव ओंकारा॥

कर के मध्य कमण्डल चक्र त्रिशूलधर्ता, स्वामी चक्र त्रिशूलधर्ता।
जगकर्ता जगहर्ता जग पालनकर्ता॥
ॐ जय शिव ओंकारा॥

ब्रह्मा विष्णु सदाशिव जानत अविवेका, स्वामी जानत अविवेका।
प्रणवाक्षर के मध्ये ये तीनों एका॥
ॐ जय शिव ओंकारा॥

त्रिगुण स्वामी जी की आरती जो कोई नर गावे, स्वामी जो कोई नर गावे।
कहत शिवानन्द स्वामी मनवांछित फल पावे॥
ॐ जय शिव ओंकारा॥""",
    "body_roman": """Om jai Shiv Omkara, Swami jai Shiv Omkara.
Brahma Vishnu Sadashiv, ardhangi dhara.
Om jai Shiv Omkara.

Ekanan chaturanan panchanan raje, Swami panchanan raje.
Hansanan Garudasan Vrishvahan saje.
Om jai Shiv Omkara.

Do bhuj char chaturbhuj dasbhuj ati sohe, Swami dasbhuj ati sohe.
Teenon roop nirakhta tribhuvan jan mohe.
Om jai Shiv Omkara.

Akshmala vanmala mundmala dhari, Swami mundmala dhari.
Chandan mrigmad sohai Bhole shashidhari.
Om jai Shiv Omkara.

Shvetambar pitambar baghambar ange, Swami baghambar ange.
Sanakadik Brahmadik bhootadik sange.
Om jai Shiv Omkara.

Kar ke madhya kamandal chakra trishuldharta, Swami chakra trishuldharta.
Jagkarta jaghartaa jag palankarta.
Om jai Shiv Omkara.

Brahma Vishnu Sadashiv janat aviveka, Swami janat aviveka.
Pranavakshar ke madhye ye teenon eka.
Om jai Shiv Omkara.

Trigun Swami ji ki aarti jo koi nar gave, Swami jo koi nar gave.
Kahat Shivanand Swami manvanchhit phal pave.
Om jai Shiv Omkara.""",
    "meaning_hi": """सार (शब्दशः अनुवाद नहीं; हमारे अपने शब्दों में):

यह आरती ओंकार-स्वरूप शिव की स्तुति है। इसमें उनके अलग-अलग रूपों, वाहनों और वेश का वर्णन है, और कहा गया है कि ब्रह्मा, विष्णु और सदाशिव प्रणव (ॐ) में एक ही हैं।

अंत में कहा गया है कि जो श्रद्धा से यह आरती गाता है, उसे मनचाहा फल मिलता है।""",
    "meaning_en": """Summary (not word-for-word; in our own words):

This aarti praises Shiva as the sound Om. It describes his many forms, his vehicles and his dress, and says that Brahma, Vishnu and Sadashiva are one within the syllable Om.

It ends by saying that whoever sings it with faith receives the fruit they wish for.""",
}

GANESH_AARTI = {
    "slug": "jai-ganesh-deva", "kind": "aarti", "deity": "ganesh",
    "title_hi": "जय गणेश जय गणेश देवा", "title_en": "Jai Ganesh Deva",
    "source": _SRC, "license": _LIC,
    "body_hi": """जय गणेश जय गणेश जय गणेश देवा।
माता जाकी पार्वती पिता महादेवा॥

एकदन्त दयावन्त चार भुजाधारी।
माथे सिन्दूर सोहे मूसे की सवारी॥
जय गणेश जय गणेश जय गणेश देवा॥

अन्धन को आँख देत कोढ़िन को काया।
बाँझन को पुत्र देत निर्धन को माया॥
जय गणेश जय गणेश जय गणेश देवा॥

हार चढ़े फूल चढ़े और चढ़े मेवा।
लड्डुअन का भोग लगे सन्त करें सेवा॥
जय गणेश जय गणेश जय गणेश देवा॥

दीनन की लाज राखो शम्भु सुतवारी।
कामना को पूर्ण करो जाऊँ बलिहारी॥
जय गणेश जय गणेश जय गणेश देवा॥""",
    "body_roman": """Jai Ganesh jai Ganesh jai Ganesh deva.
Mata jaki Parvati pita Mahadeva.

Ekdant dayavant char bhujadhari.
Mathe sindoor sohe moose ki savari.
Jai Ganesh jai Ganesh jai Ganesh deva.

Andhan ko aankh det kodhin ko kaya.
Baanjhan ko putra det nirdhan ko maya.
Jai Ganesh jai Ganesh jai Ganesh deva.

Haar chade phool chade aur chade meva.
Ladduan ka bhog lage sant karen seva.
Jai Ganesh jai Ganesh jai Ganesh deva.

Deenan ki laaj rakho Shambhu sutvari.
Kamna ko poorn karo jaoon balihari.
Jai Ganesh jai Ganesh jai Ganesh deva.""",
    "meaning_hi": """सार (शब्दशः अनुवाद नहीं; हमारे अपने शब्दों में):

यह आरती पार्वती और महादेव के पुत्र एकदन्त गणेश की स्तुति है। उनके चार हाथ, सिन्दूर का तिलक और मूषक की सवारी का वर्णन है।

भक्त प्रार्थना करता है कि वे दीनों की लाज रखें और मनोकामना पूरी करें। फूल, मेवा और लड्डू का भोग चढ़ाने की बात भी कही गई है।""",
    "meaning_en": """Summary (not word-for-word; in our own words):

This aarti praises Ganesh, the one-tusked son of Parvati and Mahadeva, with four arms, a vermilion mark and a mouse as his vehicle.

The devotee asks him to protect the dignity of the humble and fulfil their wishes, and mentions offerings of flowers, fruit and laddus.""",
}

AMBE_AARTI = {
    "slug": "om-jai-ambe-gauri", "kind": "aarti", "deity": "durga",
    "title_hi": "ॐ जय अम्बे गौरी", "title_en": "Om Jai Ambe Gauri",
    "source": "Traditional Devi aarti, commonly attributed to Shivanand Swami. Variants differ; compare with a trusted printed edition before verifying.",
    "license": _LIC,
    "body_hi": """जय अम्बे गौरी, मैया जय श्यामा गौरी।
तुमको निशदिन ध्यावत, हरि ब्रह्मा शिवरी॥
ॐ जय अम्बे गौरी॥

माँग सिन्दूर विराजत, टीको मृगमद को।
उज्ज्वल से दोउ नैना, चन्द्रवदन नीको॥
ॐ जय अम्बे गौरी॥

कनक समान कलेवर, रक्ताम्बर राजै।
रक्तपुष्प गल माला, कण्ठन पर साजै॥
ॐ जय अम्बे गौरी॥

केहरि वाहन राजत, खड्ग खप्पर धारी।
सुर-नर मुनिजन सेवत, तिनके दुखहारी॥
ॐ जय अम्बे गौरी॥

कानन कुण्डल शोभित, नासाग्रे मोती।
कोटिक चन्द्र दिवाकर, राजत सम ज्योति॥
ॐ जय अम्बे गौरी॥

शुम्भ निशुम्भ बिदारे, महिषासुर घाती।
धूम्र विलोचन नैना, निशदिन मदमाती॥
ॐ जय अम्बे गौरी॥

चण्ड-मुण्ड संहारे, शोणित बीज हरे।
मधु-कैटभ दोउ मारे, सुर भयहीन करे॥
ॐ जय अम्बे गौरी॥

ब्रह्माणी रुद्राणी तुम कमला रानी।
आगम निगम बखानी, तुम शिव पटरानी॥
ॐ जय अम्बे गौरी॥

चौंसठ योगिनी गावत, नृत्य करत भैरू।
बाजत ताल मृदंगा, अरु बाजत डमरू॥
ॐ जय अम्बे गौरी॥

तुम ही जग की माता, तुम ही हो भर्ता।
भक्तन की दुःख हर्ता, सुख सम्पत्ति कर्ता॥
ॐ जय अम्बे गौरी॥

भुजा चार अति शोभित, वर मुद्रा धारी।
मनवांछित फल पावत, सेवत नर नारी॥
ॐ जय अम्बे गौरी॥

कंचन थाल विराजत, अगर कपूर बाती।
श्रीमालकेतु में राजत, कोटि रतन ज्योती॥
ॐ जय अम्बे गौरी॥

श्री अम्बे जी की आरती, जो कोई नर गावै।
कहत शिवानन्द स्वामी, सुख सम्पत्ति पावै॥
ॐ जय अम्बे गौरी॥""",
    "body_roman": """Jai Ambe Gauri, Maiya jai Shyama Gauri.
Tumko nishdin dhyavat, Hari Brahma Shivri.
Om jai Ambe Gauri.

Maang sindoor virajat, teeko mrigmad ko.
Ujjwal se dou naina, chandravadan neeko.
Om jai Ambe Gauri.

Kanak saman kalevar, raktambar raje.
Raktpushp gal mala, kanthan par saje.
Om jai Ambe Gauri.

Kehri vahan rajat, khadg khappar dhari.
Sur-nar munijan sevat, tinke dukhhari.
Om jai Ambe Gauri.

Kanan kundal shobhit, nasagre moti.
Kotik chandra divakar, rajat sam jyoti.
Om jai Ambe Gauri.

Shumbh Nishumbh bidare, Mahishasur ghati.
Dhumra vilochan naina, nishdin madmati.
Om jai Ambe Gauri.

Chand-Mund sanhare, shonit beej hare.
Madhu-Kaitabh dou mare, sur bhayhin kare.
Om jai Ambe Gauri.

Brahmani Rudrani tum Kamla rani.
Aagam nigam bakhani, tum Shiv patrani.
Om jai Ambe Gauri.

Chausath yogini gavat, nritya karat Bhairu.
Bajat taal mridanga, aru bajat damru.
Om jai Ambe Gauri.

Tum hi jag ki mata, tum hi ho bharta.
Bhaktan ki dukh harta, sukh sampatti karta.
Om jai Ambe Gauri.

Bhuja char ati shobhit, var mudra dhari.
Manvanchhit phal pavat, sevat nar nari.
Om jai Ambe Gauri.

Kanchan thal virajat, agar kapoor bati.
Shrimalketu mein rajat, koti ratan jyoti.
Om jai Ambe Gauri.

Shri Ambe ji ki aarti, jo koi nar gavai.
Kahat Shivanand Swami, sukh sampatti pavai.
Om jai Ambe Gauri.""",
    "meaning_hi": """सार (शब्दशः अनुवाद नहीं; हमारे अपने शब्दों में):

यह आरती देवी अम्बे (गौरी, श्यामा) की स्तुति है। इसमें उनके स्वरूप, सिंह की सवारी और अस्त्रों का वर्णन है, और शुम्भ-निशुम्भ, महिषासुर, चण्ड-मुण्ड और मधु-कैटभ के संहार का स्मरण है।

उन्हें जगत की माता, पालन करने वाली और भक्तों के दुःख हरने वाली कहा गया है। अंत में फल बताया गया है कि गाने वाले को सुख-सम्पत्ति मिलती है।""",
    "meaning_en": """Summary (not word-for-word; in our own words):

This aarti praises the Goddess as Ambe, Gauri and Shyama. It describes her form, her lion and her weapons, and recalls her victories over Shumbha, Nishumbha, Mahishasura, Chanda-Munda and Madhu-Kaitabha.

She is called the mother and sustainer of the world and the remover of her devotees' sorrow. It ends by saying that those who sing it receive comfort and prosperity.""",
}

KUNJ_BIHARI_AARTI = {
    "slug": "aarti-kunj-bihari-ki", "kind": "aarti", "deity": "krishna",
    "title_hi": "आरती कुंज बिहारी की", "title_en": "Aarti Kunj Bihari Ki",
    "source": _SRC, "license": _LIC,
    "body_hi": """आरती कुंज बिहारी की, श्री गिरिधर कृष्ण मुरारी की॥

गले में बैजंती माला, बजावै मुरली मधुर बाला।
श्रवण में कुण्डल झलकाला, नंद के आनंद नंदलाला॥
गगन सम अंग कांति काली, राधिका चमक रही आली।
लतन में ठाढ़े बनमाली, भ्रमर सी अलक, कस्तूरी तिलक,
चंद्र सी झलक, ललित छवि श्यामा प्यारी की॥
श्री गिरिधर कृष्ण मुरारी की॥
आरती कुंज बिहारी की॥

कनकमय मोर मुकुट बिलसै, देवता दरसन को तरसैं।
गगन सों सुमन रासि बरसै, बजे मुरचंग, मधुर मिरदंग,
ग्वालिन संग, अतुल रति गोप कुमारी की॥
श्री गिरिधर कृष्ण मुरारी की॥
आरती कुंज बिहारी की॥

जहाँ ते प्रकट भई गंगा, कलुष कलि हारिणि श्री गंगा।
स्मरण ते होत मोह भंगा, बसी शिव सीस, जटा के बीच,
हरै अघ कीच, चरन छवि श्री बनवारी की॥
श्री गिरिधर कृष्ण मुरारी की॥
आरती कुंज बिहारी की॥

चमकती उज्ज्वल तट रेनू, बज रही वृंदावन बेनू।
चहूँ दिशि गोपी ग्वाल धेनू, हँसत मृदु मंद, चाँदनी चंद,
कटत भव फंद, टेर सुन दीन भिखारी की॥
श्री गिरिधर कृष्ण मुरारी की॥
आरती कुंज बिहारी की॥""",
    "body_roman": """Aarti kunj bihari ki, Shri Giridhar Krishna Murari ki.

Gale mein Baijanti mala, bajavai murli madhur bala.
Shravan mein kundal jhalkala, Nand ke anand Nandlala.
Gagan sam ang kanti kali, Radhika chamak rahi aali.
Latan mein thade Banmali, bhramar si alak, kasturi tilak,
chandra si jhalak, lalit chhavi Shyama pyari ki.
Shri Giridhar Krishna Murari ki.
Aarti kunj bihari ki.

Kanakmay mor mukut bilsai, devta darsan ko tarsain.
Gagan son suman rasi barsai, baje murchang, madhur mridang,
gwalin sang, atul rati gop kumari ki.
Shri Giridhar Krishna Murari ki.
Aarti kunj bihari ki.

Jahan te prakat bhai Ganga, kalush kali harini Shri Ganga.
Smaran te hot moh bhanga, basi Shiv sees, jata ke beech,
harai agh keech, charan chhavi Shri Banvari ki.
Shri Giridhar Krishna Murari ki.
Aarti kunj bihari ki.

Chamakti ujjwal tat renu, baj rahi Vrindavan benu.
Chahun dishi gopi gwal dhenu, hansat mridu mand, chandni chand,
katat bhav phand, ter sun deen bhikhari ki.
Shri Giridhar Krishna Murari ki.
Aarti kunj bihari ki.""",
    "meaning_hi": """सार (शब्दशः अनुवाद नहीं; हमारे अपने शब्दों में):

यह आरती वृन्दावन के कुंजों में विहार करने वाले गिरधर कृष्ण की स्तुति है। इसमें उनकी वैजयन्ती माला, मुरली, कुण्डल और मोर मुकुट के साथ राधा और गोपियों का स्मरण है।

तीसरे छंद में कहा गया है कि गंगा उनके चरणों से प्रकट हुईं। अंत में भक्त अपनी पुकार सुनने की प्रार्थना करता है।""",
    "meaning_en": """Summary (not word-for-word; in our own words):

This aarti praises Krishna, the lifter of the mountain, who plays in the groves of Vrindavan. It describes his garland, flute, earrings and peacock crown, with Radha and the gopis.

The third verse says the Ganga arose from his feet. At the end the humble devotee asks him to hear their call.""",
}

HANUMAN_AARTI = {
    "slug": "aarti-kije-hanuman-lala-ki", "kind": "aarti", "deity": "hanuman",
    "title_hi": "आरती कीजै हनुमान लला की", "title_en": "Aarti Kije Hanuman Lala Ki",
    "source": _SRC, "license": _LIC,
    "body_hi": """आरती कीजै हनुमान लला की। दुष्ट दलन रघुनाथ कला की॥
जाके बल से गिरिवर काँपै। रोग दोष जाके निकट न झाँपै॥
अंजनि पुत्र महा बलदायी। सन्तन के प्रभु सदा सहायी॥
दे बीरा रघुनाथ पठाये। लंका जारि सिया सुधि लाये॥
लंका सो कोट समुद्र सी खाई। जात पवनसुत बार न लाई॥
लंका जारि असुर संहारे। सियारामजी के काज सँवारे॥
लक्ष्मण मूर्छित पड़े सकारे। आनि संजीवन प्राण उबारे॥
पैठि पाताल तोरि यम-कारे। अहिरावण की भुजा उखारे॥
बाईं भुजा असुर दल मारे। दाहिने भुजा सन्तजन तारे॥
सुर-नर-मुनि आरती उतारें। जय जय जय हनुमान उचारें॥
कंचन थार कपूर लौ छाई। आरती करत अंजना माई॥
जो हनुमानजी की आरती गावै। बसि बैकुण्ठ परमपद पावै॥
लंका जारि असुर संहारे। सियारामजी के काज सँवारे॥
आरती कीजै हनुमान लला की। दुष्ट दलन रघुनाथ कला की॥""",
    "body_roman": """Aarti kijai Hanuman lala ki. Dusht dalan Raghunath kala ki.
Jake bal se girivar kanpai. Rog dosh jake nikat na jhanpai.
Anjani putra maha baldayi. Santan ke prabhu sada sahayi.
De beera Raghunath pathaye. Lanka jari Siya sudhi laye.
Lanka so kot samudra si khai. Jat Pavansut baar na lai.
Lanka jari asur sanhare. Siyaramji ke kaaj sanvare.
Lakshman moorchhit pade sakare. Aani sanjeevan pran ubare.
Paithi patal tori Yam-kare. Ahiravan ki bhuja ukhare.
Baayi bhuja asur dal mare. Dahine bhuja santjan tare.
Sur-nar-muni aarti utaren. Jai jai jai Hanuman ucharen.
Kanchan thar kapoor lau chhai. Aarti karat Anjana mai.
Jo Hanumanji ki aarti gavai. Basi Baikunth parampad pavai.
Lanka jari asur sanhare. Siyaramji ke kaaj sanvare.
Aarti kijai Hanuman lala ki. Dusht dalan Raghunath kala ki.""",
    "meaning_hi": """सार (शब्दशः अनुवाद नहीं; हमारे अपने शब्दों में):

यह आरती अंजनि-पुत्र हनुमान की स्तुति है, जिनके बल से पर्वत काँपते हैं और जिनके पास रोग-दोष नहीं आते। इसमें लंका-दहन, सीता की खोज, लक्ष्मण के लिए संजीवनी लाने और अहिरावण की कथाओं का स्मरण है।

अंत में कहा गया है कि जो हनुमान जी की आरती गाता है, उसे परम पद मिलता है।""",
    "meaning_en": """Summary (not word-for-word; in our own words):

This aarti praises Hanuman, son of Anjani, whose strength shakes mountains and keeps illness and faults away. It recalls his burning of Lanka, finding Sita, bringing the Sanjeevani herb for Lakshman and defeating Ahiravan.

It ends by saying that whoever sings Hanuman's aarti reaches the highest state.""",
}

RAM_STUTI = {
    "slug": "shri-ramchandra-kripalu-bhajuman", "kind": "stotra", "deity": "ram",
    "title_hi": "श्री रामचन्द्र कृपालु भजु मन", "title_en": "Shri Ramchandra Kripalu Bhajuman",
    "source": "Tulsidas, Vinaya Patrika (16th century). Variant readings exist; compare with a trusted printed edition before verifying.",
    "license": "Public domain (original text, Tulsidas); meaning and Roman text are our own work",
    "body_hi": """श्री रामचन्द्र कृपालु भजु मन हरण भवभय दारुणम्।
नवकंज-लोचन, कंज-मुख, कर-कंज, पद कंजारुणम्॥

कन्दर्प अगणित अमित छवि नवनील-नीरद सुन्दरम्।
पटपीत मानहुँ तडित रुचि शुचि नौमि जनक सुतावरम्॥

भजु दीनबन्धु दिनेश दानव-दैत्य-वंश-निकन्दनम्।
रघुनन्द आनंदकंद कोशलचन्द दशरथ-नन्दनम्॥

सिर मुकुट कुंडल तिलक चारु उदारु अंग विभूषणम्।
आजानुभुज शर-चाप-धर सङ्ग्राम-जित-खरदूषणम्॥

इति वदति तुलसीदास शंकर शेष मुनि-मन-रंजनम्।
मम हृदय कंज निवास कुरु कामादि खलदल-गंजनम्॥""",
    "body_roman": """Shri Ramchandra kripalu bhaju man haran bhavbhay darunam.
Navkanj-lochan, kanj-mukh, kar-kanj, pad kanjarunam.

Kandarp aganit amit chhavi navneel-neerad sundaram.
Patpeet manahu tadit ruchi shuchi naumi Janak sutavaram.

Bhaju deenbandhu dinesh danav-daitya-vansh-nikandanam.
Raghunand anandkand Koshalchand Dashrath-nandanam.

Sir mukut kundal tilak charu udaru ang vibhushanam.
Aajanubhuj shar-chap-dhar sangram-jit-Kharadooshanam.

Iti vadati Tulsidas Shankar Shesh muni-man-ranjanam.
Mam hriday kanj nivas kuru kamadi khaldal-ganjanam.""",
    "meaning_hi": """सार (शब्दशः अनुवाद नहीं; हमारे अपने शब्दों में):

हे मन, कृपालु श्री रामचन्द्र का भजन कर, जो संसार के कठिन भय को हरने वाले हैं। उनके नेत्र, मुख, हाथ और चरण कमल के समान हैं।

उनकी छवि नए नीले मेघ जैसी सुन्दर है, वे दीनों के बन्धु हैं और दशरथ के पुत्र हैं। अंत में तुलसीदास प्रार्थना करते हैं कि वे उनके हृदय-कमल में निवास करें और काम आदि विकारों का नाश करें।""",
    "meaning_en": """Summary (not word-for-word; in our own words):

O mind, worship the merciful Ramachandra, who removes the hard fear of worldly life. His eyes, face, hands and feet are like lotuses.

His form is lovely like a fresh blue rain cloud; he is the friend of the humble and the son of Dasharatha. At the end Tulsidas prays that he dwell in the lotus of his heart and destroy desire and the other inner enemies.""",
}

ALL = [SHIV_AARTI, GANESH_AARTI, AMBE_AARTI, KUNJ_BIHARI_AARTI, HANUMAN_AARTI, RAM_STUTI]
