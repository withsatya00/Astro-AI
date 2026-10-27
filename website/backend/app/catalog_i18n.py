"""English text for the Hindi starter catalog (temples, sevas, products).

The database keeps the original Hindi text. When a request asks for ``lang=en`` the API swaps in the English
below, matched by temple slug or by the Hindi title. Anything not listed here (for example a product a seller
typed in themselves) is returned exactly as stored.
"""
from typing import Dict, List, Optional, Tuple

TEMPLES_EN: Dict[str, Dict[str, str]] = {
    "mahakaleshwar-ujjain": {
        "name": "Shri Mahakaleshwar Jyotirlinga, Ujjain", "deity": "Lord Shiva (Mahakal)", "city": "Ujjain", "state": "Madhya Pradesh",
        "description": "The only south-facing Jyotirlinga among the twelve. Darshan and the Bhasma Aarti of Mahakal, the lord of time, are believed to remove the fear of untimely death."},
    "kashi-vishwanath-varanasi": {
        "name": "Shri Kashi Vishwanath Dham, Varanasi", "deity": "Lord Shiva (Vishweshwar)", "city": "Varanasi", "state": "Uttar Pradesh",
        "description": "Lord Mahadev, ruler of moksha-granting Kashi. Gangajal and Rudrabhishek here are believed to pacify sins and planetary afflictions."},
    "somnath-jyotirlinga-gujarat": {
        "name": "Shri Somnath Jyotirlinga Dham, Gujarat", "deity": "Lord Somnath (Chandramauli Shiva)", "city": "Prabhas Patan / Veraval", "state": "Gujarat",
        "description": "The first of the twelve Jyotirlingas and an ancient pilgrimage, where the Moon god was freed from his affliction. Revered for peace of mind and relief from Moon-related doshas."},
    "kedarnath-dham-uttarakhand": {
        "name": "Shri Kedarnath Dham, Himalayas", "deity": "Lord Kedarnath (Sadashiva)", "city": "Rudraprayag", "state": "Uttarakhand",
        "description": "Foremost of the Panch Kedars, on the banks of the Mandakini in the lap of the Himalayas. Darshan is believed to free one from the cycle of birth and death."},
    "tirupati-balaji-andhra": {
        "name": "Shri Tirupati Balaji (Venkateswara Swami), Tirumala", "deity": "Lord Sri Venkateswara (Vishnu)", "city": "Tirumala / Tirupati", "state": "Andhra Pradesh",
        "description": "The living Vaikuntha of Kali Yuga, revered as the giver of prosperity, freedom from debt, business success and protection of the family."},
    "vaishno-devi-katra": {
        "name": "Mata Vaishno Devi Dham, Katra", "deity": "Goddess Mahalakshmi, Mahakali, Mahasaraswati (in Pindi form)", "city": "Katra", "state": "Jammu & Kashmir",
        "description": "A powerful Shakti Peeth in the sacred cave on Trikuta mountain. Devotees believe every heartfelt wish is fulfilled at the Mother's court."},
    "kamakhya-devi-assam": {
        "name": "Maa Kamakhya Shaktipeeth, Guwahati", "deity": "Goddess Bhagwati Kamakhya", "city": "Guwahati", "state": "Assam",
        "description": "The supreme tantric Shakti Peeth among the 51. Devotees seek the Mother's blessings for the fulfilment of wishes and protection from the evil eye."},
    "siddhivinayak-mumbai": {
        "name": "Shri Siddhivinayak Temple, Prabhadevi", "deity": "Lord Shri Ganesh", "city": "Mumbai", "state": "Maharashtra",
        "description": "Siddhivinayak with the right-turned trunk, giver of Riddhi-Siddhi. A shrine of faith for new ventures, housewarming and career success."},
    "shani-shingnapur": {
        "name": "Shri Shani Shingnapur Dham, Maharashtra", "deity": "Lord Shani Dev", "city": "Newasa / Ahmednagar", "state": "Maharashtra",
        "description": "The shrine of the self-manifested stone Shani Dev. Devotees offer oil in devotion to ease Sade Sati, Dhaiya and Shani-related hardships."},
    "jagannath-temple-puri": {
        "name": "Shri Jagannath Temple, Puri", "deity": "Lord Jagannath, Balabhadra, Subhadra", "city": "Puri", "state": "Odisha",
        "description": "One of the four Dhams and the Vaikuntha of Lord Jagannath. Revered for removing poverty and giving lasting merit."},
    "ram-janmabhoomi-ayodhya": {
        "name": "Shri Ram Janmabhoomi Temple, Ayodhya", "deity": "Lord Shri Ramlala Sarkar", "city": "Ayodhya", "state": "Uttar Pradesh",
        "description": "The sacred birthplace of Maryada Purushottam Shri Ram. Ramlala's blessings are believed to bring family prosperity, truth, dharma and protection from hardship."},
}

# English (title, description) of each seva, in the same order as the offerings of each temple in INITIAL_TEMPLES.
OFFERINGS_EN: Dict[str, List[Tuple[str, str]]] = {
    "mahakaleshwar-ujjain": [
        ("Flowers, Bilva leaves & lamp offering", "Fresh bilva leaves, fragrant flowers and an unbroken ghee lamp offered to Mahakal."),
        ("Panchamrit Abhishek & Bhasma offering sankalp", "Abhishek with milk, curd, honey, sugar and ghee, and offering of sacred bhasma."),
        ("Special Mahamrityunjaya Shanti Anushthan", "Mahamrityunjaya chanting and protective sankalp by 11 priests in the name and gotra of the yajman."),
    ],
    "kashi-vishwanath-varanasi": [
        ("Gangajal & Bilva offering", "Holy north-flowing Gangajal and 108 bilva leaves offered to Baba Vishwanath."),
        ("Dwadash Jyotirlinga Rudrabhishek sankalp", "Complete Rudrashtadhyayi recitation and milk abhishek in the name of the yajman."),
        ("Annapurna & Vishwanath prosperity Maha Puja", "Special shodashopachara puja and raksha sutra for business growth and peace at home."),
    ],
    "somnath-jyotirlinga-gujarat": [
        ("Someshwar milk abhishek & bilva offering", "Abhishek of the Somnath Shivling with pure cow's milk and offering of bilva leaves."),
        ("Chandra dosh nivaran & peace of mind sankalp", "Special anushthan for a strong Moon in the kundli and mental stability."),
    ],
    "kedarnath-dham-uttarakhand": [
        ("Himalayan flowers & akhand ghee lamp offering", "Akhand jyoti and flowers offered in the sanctum of Kedarnath in the name of the yajman."),
        ("Maha Abhishek & Kedar prasad sankalp", "Maha abhishek with Vedic chanting by temple priests, and sacred bhasma sent to you."),
    ],
    "tirupati-balaji-andhra": [
        ("Tulsi garland & lamp offering", "Sacred tulsi leaves and an unbroken lamp offered at the feet of Lord Venkateswara."),
        ("Ashtalakshmi Dhanvarsha special archana & laddu prasad", "Sahasranama archana in the name of the yajman, with authentic Tirupati laddu prasad sent to your home."),
    ],
    "vaishno-devi-katra": [
        ("Red chunri, coconut & flowers offering", "Red chunri and suhag pitara offered on the sacred pindis of the Mother."),
        ("Sarvasankat Nivarak Maha Havan & mishri prasad", "Special ahuti at the Mother's Bhawan for your family's protection, with prasad sent to you."),
    ],
    "kamakhya-devi-assam": [
        ("Sacred sindoor, chunri & red flowers offering", "Red chunri, roli and sindoor offered to the Mother for lasting good fortune and relief from troubles."),
        ("Sarvamanokamana Siddhi special archana", "Your name, gotra and wish placed at the Mother's feet in sankalp."),
        ("Tantrokta Kamakhya raksha kavach & sindoor delivery", "A rare energized red cloth and Kamakhya sindoor sent to your home."),
    ],
    "siddhivinayak-mumbai": [
        ("Modak, durva & red flowers offering", "21 durva knots and modak bhog offered to Lord Ganpati."),
        ("Sankashti Chaturthi & Wednesday special abhishek", "Panchamrit abhishek with Atharvashirsha recitation and sindoor lepan."),
        ("Complete Karya Siddhi Maha Ganapati puja", "To remove obstacles in business, property or marriage."),
    ],
    "shani-shingnapur": [
        ("Mustard oil & black sesame offering", "Pure mustard oil, black sesame and blue flowers offered to Shani Dev."),
        ("Shani Sade Sati & Dhaiya shanti oil abhishek", "Abhishek with Vedic Shani shanti mantras in the name and gotra of the yajman."),
        ("Shani Peeda Nivaran Maha Yagya & raksha kavach", "Special ahuti for Shani dosh shanti, with energized black thread and prasad sent to you."),
    ],
    "jagannath-temple-puri": [
        ("Tulsi manjari & fragrant lamp offering", "Fresh tulsi manjari and an unbroken ghee lamp offered to Mahaprabhu Jagannath."),
        ("Anna Brahma Mahaprasad & khaja sankalp", "Authentic Mahaprasad of Lord Jagannath (khaja and dry prasad) sent to your home."),
    ],
    "ram-janmabhoomi-ayodhya": [
        ("Pitambar, flowers & tulsi dal offering", "Yellow cloth, a fragrant flower garland and tulsi dal offered to Bal Ram."),
        ("Shri Ram Raksha Stotra path & elaichi dana prasad", "Ram Raksha Stotra recited by 11 priests in the name and gotra of the yajman, with prasad delivered."),
    ],
}

# English fields of each starter product, in the same order as INITIAL_PRODUCTS.
PRODUCTS_EN: List[Dict[str, str]] = [
    {"title": "Natural 5-Mukhi Nepali Rudraksha (Silver Capped)", "material": "Pure Nepali rudraksha bead, 925 sterling silver caps", "origin": "Nepal",
     "description": "Natural, untreated 5-Mukhi Nepali rudraksha, a form of Lord Shiva, believed to bring peace of mind, focus, balanced blood pressure and spiritual awakening.",
     "energized": "Energized with 108 Mahamrityunjaya mantras at Kashi Vishwanath"},
    {"title": "108 Beads Natural Sphatik Mala (Diamond-Cut Crystal)", "material": "100% natural crystal quartz", "origin": "Himalayas",
     "description": "A cooling, pure crystal quartz mala. Traditionally linked with the grace of Maa Saraswati and Maa Lakshmi, calm temper, positive energy and deeper meditation.",
     "energized": "Consecrated with 1008 chants of the Gayatri mantra and Shri Suktam"},
    {"title": "Siddh Sampoorna Vyapar Vridhi Mahayantra (Gold-Plated Copper)", "material": "Copper with 24K gold polish", "origin": "Ujjain",
     "description": "Made on a pure copper plate with a 24-carat gold layer. Installed in a shop, office, factory or home, it is traditionally believed to support income, recovery of dues and business growth.",
     "energized": "Energized with the Kanakadhara Stotra and Kuber Ashtalakshmi mantras"},
    {"title": "Natural Zambian Emerald (Panna, 4.25 Ratti)", "material": "Natural unheated emerald (beryl)", "origin": "Kafue, Zambia",
     "description": "The principal gemstone of Mercury (Budh), traditionally worn for intellect, speech, business decisions, exams and quick memory. Natural emerald.",
     "energized": "Energized on a Wednesday with the Budh beej mantra (Om Bram Brim Braum Sah Budhaya Namah)"},
    {"title": "Sacred Tulsi Kanthi Mala (Vrindavan)", "material": "Natural Shyama tulsi wood", "origin": "Vrindavan, Mathura",
     "description": "A handmade kanthi mala of Shyama tulsi, dear to Lord Vishnu and Shri Krishna. Believed to protect from negative energy, fear and bad dreams.",
     "energized": "Energized with the Hare Krishna Maha Mantra and Narayan Kavach"},
    {"title": "Vedic Navgrah Shanti Hawan Kit (31 Herbs)", "material": "100% natural herbs and dry samidha", "origin": "Haridwar, Uttarakhand",
     "description": "A scripture-based blend of 31 rare herbs, gular, palash samidha, pure ghee and guggul for Navgrah shanti, griha pravesh and vastu dosh nivaran.",
     "energized": "Sprinkled with Gangajal and energized at the Navgrah vedi"},
    {"title": "Siddh Parad (Rasraj) Shivling (Pure Mercury, 50 g)", "material": "Ashtasanskarit pure solid mercury", "origin": "Kashi, Varanasi",
     "description": "A rare Shivling made of mercury by the classical Ashtasanskar method. Kept in the home temple, it is traditionally believed to ease vastu and pitru doshas.",
     "energized": "Energized with the Mahamrityunjaya and Rudra Sukta"},
    {"title": "Siddh Kuber Dhan-Varsha Yantra (Pure Brass, Gold Tone)", "material": "Solid brass with 24K gold finish", "origin": "Ujjain",
     "description": "The sacred yantra of Yaksharaj Kuber, god of wealth. Kept in a locker, cash box or office, it is traditionally believed to support savings and remove business obstacles.",
     "energized": "Energized with the Kuber beej mantra"},
    {"title": "Original 7-Mukhi Nepali Rudraksha (Silver Pendant)", "material": "Nepali 7-Mukhi rudraksha, 925 sterling silver", "origin": "Nepal",
     "description": "A form of Goddess Mahalakshmi. Traditionally worn for relief during Shani Sade Sati, career promotion, relief from financial stress and fame.",
     "energized": "Energized 108 times with Shri Suktam and Kanakadhara mantras"},
    {"title": "Natural Dakshinavarti Shankh (Right-Handed Conch)", "material": "100% natural rare Dakshinavarti conch", "origin": "Rameswaram coast",
     "description": "Born of the churning of the ocean, regarded as the brother of Goddess Lakshmi. Filled with water and sprinkled at home, it is believed to invite lasting prosperity, peace and positive energy.",
     "energized": "Consecrated with the Lakshmi Gayatri mantra and Gangajal"},
    {"title": "108 Lotus Seed (Kamalgatta) Mala (For Lakshmi Japa)", "material": "100% natural kamalgatta beads", "origin": "Madhya Pradesh",
     "description": "A very sacred mala made of lotus seeds. Recommended for japa for Maa Mahalakshmi's grace, freedom from debt and Diwali puja.",
     "energized": "Energized with the mantra Om Shreem Hreem Kleem Kamale Kamalalaye Praseed Praseed"},
    {"title": "Panchmukhi Hanuman Kavach Pendant (Pure Silver)", "material": "92.5% sterling silver", "origin": "Haridwar",
     "description": "A protective kavach of Panchmukhi Hanuman. Traditionally worn for protection from negative influences, enemy fear and accidents, and for courage.",
     "energized": "Energized with the Hanuman Bahuk and 108 Hanuman Chalisa recitations"},
]

# Starter product titles carry English brackets in the stored Hindi text; this is the Hindi-only form for Hindi mode.
TITLES_HI: Dict[str, str] = {
    "प्राकृतिक 5-मुखी नेपाली रुद्राक्ष (Silver Capped)": "प्राकृतिक 5-मुखी नेपाली रुद्राक्ष (चांदी कैप)",
    "108 मणकों की प्राकृतिक स्फटिक माला (Diamond-Cut Crystal)": "108 मणकों की प्राकृतिक स्फटिक माला (डायमंड-कट क्रिस्टल)",
    "सिद्ध सम्पूर्ण व्यापार वृद्धि महायंत्र (Gold Plated Copper)": "सिद्ध सम्पूर्ण व्यापार वृद्धि महायंत्र (गोल्ड प्लेटेड तांबा)",
    "मूल जाम्बियन पन्ना रत्न (Natural Emerald 4.25 Ratti)": "मूल जाम्बियन पन्ना रत्न (4.25 रत्ती)",
    "सिद्ध पारद (रसराज) शिवलिंग (Pure Mercury Shivling 50g)": "सिद्ध पारद (रसराज) शिवलिंग (शुद्ध पारद, 50 ग्राम)",
    "सिद्ध कुबेर धनवर्षा यंत्र (Pure Brass Gold Tone)": "सिद्ध कुबेर धनवर्षा यंत्र (शुद्ध पीतल, गोल्ड टोन)",
    "मूल 7-मुखी नेपाली रुद्राक्ष (Silver Capped Pendant)": "मूल 7-मुखी नेपाली रुद्राक्ष (चांदी कैप पेंडेंट)",
    "सिद्ध प्राकृतिक दक्षिणवर्ती शंख (Natural Dakshinavarti Shankh)": "सिद्ध प्राकृतिक दक्षिणवर्ती शंख",
    "प्राकृतिक 108 मणकों की कमलगट्टा माला (Lotus Seed Mala)": "प्राकृतिक 108 मणकों की कमलगट्टा माला",
    "सर्वकष्ट निवारक पंचमुखी हनुमान लॉकेट (Pure Silver)": "सर्वकष्ट निवारक पंचमुखी हनुमान लॉकेट (शुद्ध चांदी)",
}

SELLERS_EN: Dict[str, str] = {
    "पं. रामेश्वर द्विवेदी (काशी)": "Pt. Rameshwar Dwivedi (Kashi)",
    "आचार्य विद्याधर शास्त्री": "Acharya Vidyadhar Shastri",
    "पं. सत्येंद्र शास्त्री (उज्जैन)": "Pt. Satyendra Shastri (Ujjain)",
    "डॉ. सुनीता शर्मा (वैदिक ज्योतिषाचार्य)": "Dr. Sunita Sharma (Vedic Astrologer)",
    "महाकाल वैदिक आश्रम (उज्जैन)": "Mahakal Vedic Ashram (Ujjain)",
    "पं. शिवचरण जोशी (हरिद्वार)": "Pt. Shivcharan Joshi (Haridwar)",
    "आचार्य ब्रजेश शास्त्री (काशी)": "Acharya Brajesh Shastri (Kashi)",
}

PURPOSES_EN: Dict[str, str] = {
    "स्वास्थ्य, दीर्घायु एवं आरोग्य लाभ": "Health & long life",
    "व्यापार वृद्धि एवं धन आगमन": "Business growth & prosperity",
    "शीघ्र विवाह एवं दांपत्य सुख": "Marriage & family harmony",
    "शनि साढ़ेसाती व ग्रह दोष शांति": "Shani / graha shanti",
    "संतान सुख एवं विद्या प्राप्ति": "Children & education",
    "सर्वमनोकामना सिद्धि": "All wishes fulfilled",
    "स्वास्थ्य, सुख-शांति एवं कार्यसिद्धि": "Health, peace and success in endeavours",
}


_OFFERINGS: Dict[str, Tuple[str, str]] = {}
_PRODUCTS: Dict[str, Dict[str, str]] = {}


def register_temples(temples: list) -> None:
    """Called by the Mandir module with its starter catalog so Hindi seva titles can be matched to English."""
    for t in temples:
        for hi, en in zip(t.get("offerings", []), OFFERINGS_EN.get(t["slug"], [])):
            _OFFERINGS[hi["title"]] = en


def register_products(products: list) -> None:
    for hi, en in zip(products, PRODUCTS_EN):
        _PRODUCTS[hi["title"]] = en


def hi_title(title: str) -> str:
    return TITLES_HI.get(title, title)


def is_en(lang: Optional[str]) -> bool:
    return (lang or "").lower().startswith("en")


def temple_en(slug: str) -> Optional[Dict[str, str]]:
    return TEMPLES_EN.get(slug)


def offering_en(hindi_title: str) -> Optional[Tuple[str, str]]:
    return _OFFERINGS.get(hindi_title)


def product_en(hindi_title: str) -> Optional[Dict[str, str]]:
    return _PRODUCTS.get(hindi_title)


def en_text(text: str) -> str:
    """English for a known seva title, product title or seller name; unknown text is returned unchanged."""
    if not text:
        return text
    if text in _OFFERINGS:
        return _OFFERINGS[text][0]
    if text in _PRODUCTS:
        return _PRODUCTS[text]["title"]
    return SELLERS_EN.get(text, text)
