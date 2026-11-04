"""Library additions: a Roman (transliteration) text for the Hanuman Chalisa, and one public-domain aarti.

Both originals are old, public-domain texts (Tulsidas, 16th century; the aarti is attributed to Shraddha Ram Phillauri, 1870, d. 1881).
The Roman text and the meanings are our own work. Everything is seeded as UNVERIFIED: an editor must compare it with a trusted printed
edition before turning `is_verified` on. Seeding only fills what is missing and never overwrites an admin's edit."""

CHALISA_ROMAN = """|| Doha ||
Shri guru charan saroj raj, nij manu mukuru sudhari.
Baranau Raghubar bimal jasu, jo dayaku phal chari.
Buddhiheen tanu janike, sumirau Pavan-kumar.
Bal buddhi bidya dehu mohi, harahu kalesa bikar.

|| Chaupai ||
Jai Hanuman gyan gun sagar. Jai Kapis tihun lok ujagar.
Ramdoot atulit bal dhama. Anjani-putra Pavansut nama.
Mahabir bikram Bajrangi. Kumati nivar sumati ke sangi.
Kanchan baran biraj subesa. Kanan kundal kunchit kesa.
Hath bajra au dhvaja biraje. Kandhe moonj janeu saje.
Sankar suvan Kesarinandan. Tej pratap maha jag bandan.
Vidyavan guni ati chatur. Ram kaj karibe ko atur.
Prabhu charitra sunibe ko rasiya. Ram Lakhan Sita man basiya.
Sukshma roop dhari Siyahin dikhava. Bikat roop dhari Lanka jarava.
Bhim roop dhari asur sanhare. Ramchandra ke kaj sanvare.
Laye sanjivan Lakhan jiyaye. Shri Raghubir harashi ur laye.
Raghupati kinhi bahut barai. Tum mama priya Bharatahi sam bhai.
Sahas badan tumharo jas gavain. Asa kahi Shripati kanth lagavain.
Sanakadik Brahmadi munisa. Narad Sarad sahit Ahisa.
Jam Kuber digpal jahan te. Kabi kobid kahi sake kahan te.
Tum upkar Sugrivahin kinha. Ram milay rajpad dinha.
Tumharo mantra Bibhishan mana. Lankeshwar bhae sab jag jana.
Jug sahasra jojan par bhanu. Lilyo tahi madhur phal janu.
Prabhu mudrika meli mukh mahin. Jaladhi langhi gaye acharaj nahin.
Durgam kaj jagat ke jete. Sugam anugraha tumhare tete.
Ram duare tum rakhvare. Hot na agya binu paisare.
Sab sukh lahai tumhari sarana. Tum rakshak kahu ko darna.
Apan tej samharo aapai. Teenon lok hank te kanpai.
Bhoot pisach nikat nahin avai. Mahabir jab nam sunavai.
Nasai rog harai sab pira. Japat nirantar Hanumat bira.
Sankat te Hanuman chhudavai. Man kram bachan dhyan jo lavai.
Sab par Ram tapasvi raja. Tin ke kaj sakal tum saja.
Aur manorath jo koi lavai. Soi amit jivan phal pavai.
Charon jug partap tumhara. Hai prasiddh jagat ujiyara.
Sadhu sant ke tum rakhvare. Asur nikandan Ram dulare.
Asht siddhi nau nidhi ke data. Asa bar din Janaki mata.
Ram rasayan tumhare pasa. Sada raho Raghupati ke dasa.
Tumhare bhajan Ram ko pavai. Janam janam ke dukh bisaravai.
Ant kal Raghubar pur jai. Jahan janam Hari-bhakt kahai.
Aur devta chitt na dharai. Hanumat sei sarb sukh karai.
Sankat kate mite sab pira. Jo sumirai Hanumat balbira.
Jai jai jai Hanuman Gosain. Kripa karahu gurudev ki nain.
Jo sat bar path kar koi. Chhutahi bandi maha sukh hoi.
Jo yah padhai Hanuman Chalisa. Hoy siddhi sakhi Gaurisa.
Tulsidas sada Hari chera. Kijai Nath hriday mah dera.

|| Doha ||
Pavan tanay sankat harana, mangal moorati roop.
Ram Lakhan Sita sahit, hriday basahu sur bhoop."""

JAGDISH_AARTI = {
    "slug": "om-jai-jagdish-hare", "kind": "aarti", "deity": "vishnu",
    "title_hi": "ॐ जय जगदीश हरे", "title_en": "Om Jai Jagdish Hare",
    "source": "Attributed to Shraddha Ram Phillauri (composed c. 1870). Many variant texts are sung; compare with a trusted printed edition before verifying.",
    "license": "Public domain (original text); meaning and Roman text are our own work",
    "body_hi": """ॐ जय जगदीश हरे, स्वामी जय जगदीश हरे।
भक्त जनों के संकट, दास जनों के संकट, क्षण में दूर करे॥
ॐ जय जगदीश हरे॥

जो ध्यावे फल पावे, दुःख बिनसे मन का, स्वामी दुःख बिनसे मन का।
सुख सम्पति घर आवे, सुख सम्पति घर आवे, कष्ट मिटे तन का॥
ॐ जय जगदीश हरे॥

मात-पिता तुम मेरे, शरण गहूँ किसकी, स्वामी शरण गहूँ मैं किसकी।
तुम बिन और न दूजा, तुम बिन और न दूजा, आस करूँ मैं जिसकी॥
ॐ जय जगदीश हरे॥

तुम पूरण परमात्मा, तुम अन्तर्यामी, स्वामी तुम अन्तर्यामी।
पारब्रह्म परमेश्वर, पारब्रह्म परमेश्वर, तुम सबके स्वामी॥
ॐ जय जगदीश हरे॥

तुम करुणा के सागर, तुम पालनकर्ता, स्वामी तुम पालनकर्ता।
मैं मूरख खल कामी, मैं सेवक तुम स्वामी, कृपा करो भर्ता॥
ॐ जय जगदीश हरे॥

तुम हो एक अगोचर, सबके प्राणपति, स्वामी सबके प्राणपति।
किस विधि मिलूँ दयामय, किस विधि मिलूँ दयामय, तुमको मैं कुमति॥
ॐ जय जगदीश हरे॥

दीनबन्धु दुखहर्ता, तुम रक्षक मेरे, स्वामी तुम रक्षक मेरे।
अपने हाथ उठाओ, अपने शरण लगाओ, द्वार पड़ा तेरे॥
ॐ जय जगदीश हरे॥

विषय विकार मिटाओ, पाप हरो देवा, स्वामी पाप हरो देवा।
श्रद्धा भक्ति बढ़ाओ, श्रद्धा भक्ति बढ़ाओ, सन्तन की सेवा॥
ॐ जय जगदीश हरे॥""",
    "body_roman": """Om jai jagdish hare, Swami jai jagdish hare.
Bhakt janon ke sankat, das janon ke sankat, kshan mein door kare.
Om jai jagdish hare.

Jo dhyave phal pave, dukh binse man ka, Swami dukh binse man ka.
Sukh sampati ghar aave, sukh sampati ghar aave, kasht mite tan ka.
Om jai jagdish hare.

Maat-pita tum mere, sharan gahoon kiski, Swami sharan gahoon main kiski.
Tum bin aur na dooja, tum bin aur na dooja, aas karoon main jiski.
Om jai jagdish hare.

Tum pooran paramatma, tum antaryami, Swami tum antaryami.
Parabrahma parameshwar, parabrahma parameshwar, tum sabke swami.
Om jai jagdish hare.

Tum karuna ke sagar, tum palankarta, Swami tum palankarta.
Main moorakh khal kaami, main sevak tum swami, kripa karo bharta.
Om jai jagdish hare.

Tum ho ek agochar, sabke pranpati, Swami sabke pranpati.
Kis vidhi miloon dayamay, kis vidhi miloon dayamay, tumko main kumati.
Om jai jagdish hare.

Deenbandhu dukhharta, tum rakshak mere, Swami tum rakshak mere.
Apne haath uthao, apne sharan lagao, dwar pada tere.
Om jai jagdish hare.

Vishay vikar mitao, paap haro deva, Swami paap haro deva.
Shraddha bhakti badhao, shraddha bhakti badhao, santan ki seva.
Om jai jagdish hare.""",
    "meaning_hi": """सार (शब्दशः अनुवाद नहीं; हमारे अपने शब्दों में):

यह आरती जगत के स्वामी की स्तुति है। पहले छंद में भक्त कहता है कि वे भक्तों और सेवकों के संकट क्षण भर में दूर कर देते हैं।

आगे कहा गया है कि जो उनका ध्यान करता है उसके मन के दुःख मिटते हैं, घर में सुख-सम्पत्ति आती है और तन के कष्ट दूर होते हैं। भक्त उन्हें माता-पिता के समान मानकर कहता है कि उनके सिवा किसी और की शरण नहीं और किसी और से आशा नहीं।

इसके बाद उन्हें पूर्ण परमात्मा, अंतर्यामी, करुणा का सागर, पालनकर्ता और सबके प्राणों का स्वामी कहा गया है। भक्त अपनी विनम्रता से स्वयं को अज्ञानी और दोषों वाला मानकर कृपा माँगता है, और पूछता है कि किस प्रकार उनसे मिला जाए।

अंत में वह दीनों के बंधु और दुःख हरने वाले से प्रार्थना करता है कि हाथ बढ़ाकर अपनी शरण में ले लें, विषय-विकार और पाप मिटाएँ, तथा श्रद्धा, भक्ति और संतों की सेवा की भावना बढ़ाएँ।""",
    "meaning_en": """Summary (not word-for-word; in our own words):

This aarti praises the Lord of the world. The first verse says he removes the troubles of devotees and servants in a moment.

It goes on to say that whoever meditates on him finds mental sorrow ending, prosperity coming to the home and bodily suffering easing. The devotee treats him as mother and father, saying there is no other refuge and no other hope.

He is then called the complete Supreme Self, the inner controller, an ocean of compassion, the sustainer and the lord of all life. With humility the devotee calls himself ignorant and flawed and asks for grace, wondering how one can meet him.

At the end the devotee prays to the friend of the lowly and remover of sorrow: stretch out your hand and take me into your shelter, clear away desires and faults, and increase faith, devotion and service to the holy.""",
}
