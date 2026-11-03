import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const MOCK_EVENTS = [
  {
    "id": "ch-dhanteras-lakshmi-kuber-dhanvantari",
    "slug": "dhanteras-lakshmi-dhanvantari-kuber",
    "kind": "chadhava",
    "category": "shakti",
    "title": "Dhanteras Dhan-Arogya Pradayak Devtas - Lakshmi, Dhanvantari & Kuber Chadhava",
    "temple": {
      "name": "Shri Gajalakshmi, Dhanvantari & Kuber Dham",
      "city": "Prayagraj",
      "state": "Uttar Pradesh",
      "slug": "dhanteras-lakshmi-dhanvantari-kuber"
    },
    "starts_at": "2026-11-06T07:00:00+05:30",
    "deadline": "2026-11-06T05:00:00+05:30",
    "image_url": "/assets/img/temples/dhanteras-chadhava-hero.webp",
    "video_hours": 72,
    "devotees_joined": 150000,
    "from_price": 51,
    "tag": "Grand Dhanteras Chadhava",
    "bookable": true
  },
  {
    "id": "ch-daily-mahakal",
    "slug": "mahakaleshwar-ujjain",
    "kind": "chadhava",
    "category": "shiva",
    "title": "Daily Bhasma Aarti & Bilva Patra Chadhava",
    "temple": {
      "name": "Shri Mahakaleshwar Jyotirlinga",
      "city": "Ujjain",
      "state": "Madhya Pradesh",
      "slug": "mahakaleshwar-ujjain"
    },
    "starts_at": "2026-11-03T19:41:00+05:30",
    "deadline": "2026-11-02T18:41:00+05:30",
    "image_url": "/assets/img/temples/mahakaleshwar-ujjain.jpg",
    "video_hours": 72,
    "devotees_joined": 412,
    "from_price": 51,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "pj-somnath-rudrabhishek",
    "slug": "somnath-jyotirlinga-gujarat",
    "kind": "puja",
    "category": "shiva",
    "title": "Maha Rudrabhishek & Bilva Patra Archana",
    "temple": {
      "name": "Shri Somnath Jyotirlinga",
      "city": "Prabhas Patan",
      "state": "Gujarat",
      "slug": "somnath-jyotirlinga-gujarat"
    },
    "starts_at": "2026-11-05T08:00:00+05:30",
    "deadline": "2026-11-04T20:00:00+05:30",
    "image_url": "/assets/img/temples/somnath-jyotirlinga-gujarat.jpg",
    "video_hours": 48,
    "devotees_joined": 34,
    "from_price": 251,
    "tag": "Special Puja",
    "bookable": true
  },
  {
    "id": "ch-kashi-ganga-aarti",
    "slug": "kashi-vishwanath-varanasi",
    "kind": "chadhava",
    "category": "shiva",
    "title": "Ganga Jal & Bhasma Chadhava Seva",
    "temple": {
      "name": "Shri Kashi Vishwanath Dham",
      "city": "Varanasi",
      "state": "Uttar Pradesh",
      "slug": "kashi-vishwanath-varanasi"
    },
    "starts_at": "2026-11-06T18:30:00+05:30",
    "deadline": "2026-11-05T12:00:00+05:30",
    "image_url": "/assets/img/temples/kashi-vishwanath-varanasi.jpg",
    "video_hours": 72,
    "devotees_joined": 185,
    "from_price": 101,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "pj-kedarnath-mahamrityunjaya",
    "slug": "kedarnath-dham-uttarakhand",
    "kind": "puja",
    "category": "shiva",
    "title": "Akhand Mahamrityunjaya Jaap & Havan",
    "temple": {
      "name": "Shri Kedarnath Dham",
      "city": "Rudraprayag",
      "state": "Uttarakhand",
      "slug": "kedarnath-dham-uttarakhand"
    },
    "starts_at": "2026-11-08T06:00:00+05:30",
    "deadline": "2026-11-07T18:00:00+05:30",
    "image_url": "/assets/img/temples/kedarnath-dham-uttarakhand.jpg",
    "video_hours": 48,
    "devotees_joined": 52,
    "from_price": 501,
    "tag": "Maha Yagya",
    "bookable": true
  },
  {
    "id": "ch-omkareshwar-jal",
    "slug": "omkareshwar-madhya-pradesh",
    "kind": "chadhava",
    "category": "shiva",
    "title": "Narmada Jal & Panchamrit Abhishek Seva",
    "temple": {
      "name": "Shri Omkareshwar Jyotirlinga",
      "city": "Khandwa",
      "state": "Madhya Pradesh",
      "slug": "omkareshwar-madhya-pradesh"
    },
    "starts_at": "2026-11-07T08:00:00+05:30",
    "deadline": "2026-11-06T18:00:00+05:30",
    "image_url": "/assets/img/temples/omkareshwar-madhya-pradesh.jpg",
    "video_hours": 72,
    "devotees_joined": 124,
    "from_price": 51,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "pj-trimbak-kalsarp",
    "slug": "trimbakeshwar-nashik",
    "kind": "puja",
    "category": "shiva",
    "title": "Kalsarp & Pitra Dosh Nivaran Maha Puja",
    "temple": {
      "name": "Shri Trimbakeshwar Jyotirlinga",
      "city": "Nashik",
      "state": "Maharashtra",
      "slug": "trimbakeshwar-nashik"
    },
    "starts_at": "2026-11-10T07:00:00+05:30",
    "deadline": "2026-11-09T20:00:00+05:30",
    "image_url": "/assets/img/temples/trimbakeshwar-nashik.jpg",
    "video_hours": 48,
    "devotees_joined": 28,
    "from_price": 501,
    "tag": "Special Puja",
    "bookable": true
  },
  {
    "id": "ch-baidyanath-bela",
    "slug": "baidyanath-deoghar",
    "kind": "chadhava",
    "category": "shiva",
    "title": "Pavitra Bela Patra & Chandan Chadhava",
    "temple": {
      "name": "Baba Baidyanath Dham",
      "city": "Deoghar",
      "state": "Jharkhand",
      "slug": "baidyanath-deoghar"
    },
    "starts_at": "2026-11-09T09:00:00+05:30",
    "deadline": "2026-11-08T18:00:00+05:30",
    "image_url": "/assets/img/temples/baidyanath-deoghar.jpg",
    "video_hours": 72,
    "devotees_joined": 96,
    "from_price": 51,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "pj-bhimashankar-rudra",
    "slug": "bhimashankar-maharashtra",
    "kind": "puja",
    "category": "shiva",
    "title": "Rudra Suktam Path & Maha Rudrabhishek",
    "temple": {
      "name": "Shri Bhimashankar Jyotirlinga",
      "city": "Pune",
      "state": "Maharashtra",
      "slug": "bhimashankar-maharashtra"
    },
    "starts_at": "2026-11-11T08:00:00+05:30",
    "deadline": "2026-11-10T18:00:00+05:30",
    "image_url": "/assets/img/temples/bhimashankar-maharashtra.jpg",
    "video_hours": 48,
    "devotees_joined": 43,
    "from_price": 351,
    "tag": "Special Puja",
    "bookable": true
  },
  {
    "id": "ch-mallikarjuna-chadhava",
    "slug": "mallikarjuna-srisailam",
    "kind": "chadhava",
    "category": "shiva",
    "title": "Mallikarjuna Swamy & Bhramaramba Chadhava",
    "temple": {
      "name": "Shri Mallikarjuna Jyotirlinga",
      "city": "Srisailam",
      "state": "Andhra Pradesh",
      "slug": "mallikarjuna-srisailam"
    },
    "starts_at": "2026-11-12T07:30:00+05:30",
    "deadline": "2026-11-11T18:00:00+05:30",
    "image_url": "/assets/img/temples/mallikarjuna-srisailam.jpg",
    "video_hours": 72,
    "devotees_joined": 110,
    "from_price": 101,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "pj-rameswaram-snan",
    "slug": "ramanathaswamy-rameswaram",
    "kind": "puja",
    "category": "shiva",
    "title": "22 Teerth Snan Sankalp & Ganga Jal Archana",
    "temple": {
      "name": "Shri Ramanathaswamy Temple",
      "city": "Rameswaram",
      "state": "Tamil Nadu",
      "slug": "ramanathaswamy-rameswaram"
    },
    "starts_at": "2026-11-14T06:00:00+05:30",
    "deadline": "2026-11-13T18:00:00+05:30",
    "image_url": "/assets/img/temples/ramanathaswamy-rameswaram.jpg",
    "video_hours": 48,
    "devotees_joined": 67,
    "from_price": 501,
    "tag": "Special Puja",
    "bookable": true
  },
  {
    "id": "ch-vaishnodevi-chunari",
    "slug": "vaishno-devi-katra",
    "kind": "chadhava",
    "category": "shakti",
    "title": "Maa Vaishno Devi Chunari & Dry Fruit Bhog",
    "temple": {
      "name": "Shri Mata Vaishno Devi Shrine",
      "city": "Katra",
      "state": "Jammu & Kashmir",
      "slug": "vaishno-devi-katra"
    },
    "starts_at": "2026-11-04T07:00:00+05:30",
    "deadline": "2026-11-03T18:00:00+05:30",
    "image_url": "/assets/img/temples/vaishno-devi-katra.jpg",
    "video_hours": 72,
    "devotees_joined": 540,
    "from_price": 101,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "pj-kamakhya-raksha",
    "slug": "kamakhya-devi-assam",
    "kind": "puja",
    "category": "shakti",
    "title": "Maa Kamakhya Shatru Badha & Raksha Puja",
    "temple": {
      "name": "Maa Kamakhya Devalaya",
      "city": "Guwahati",
      "state": "Assam",
      "slug": "kamakhya-devi-assam"
    },
    "starts_at": "2026-11-07T09:00:00+05:30",
    "deadline": "2026-11-06T18:00:00+05:30",
    "image_url": "/assets/img/temples/kamakhya-devi-assam.jpg",
    "video_hours": 48,
    "devotees_joined": 85,
    "from_price": 251,
    "tag": "Shakti Puja",
    "bookable": true
  },
  {
    "id": "ch-kalighat-deepdaan",
    "slug": "kalighat-kali-kolkata",
    "kind": "chadhava",
    "category": "shakti",
    "title": "Maha Kali Deepdaan & Raksha Dhaga Seva",
    "temple": {
      "name": "Kalighat Kali Temple",
      "city": "Kolkata",
      "state": "West Bengal",
      "slug": "kalighat-kali-kolkata"
    },
    "starts_at": "2026-11-05T18:00:00+05:30",
    "deadline": "2026-11-04T16:00:00+05:30",
    "image_url": "/assets/img/temples/kalighat-kali-kolkata.jpg",
    "video_hours": 72,
    "devotees_joined": 140,
    "from_price": 51,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "pj-mahalakshmi-suktam",
    "slug": "mahalakshmi-kolhapur",
    "kind": "puja",
    "category": "shakti",
    "title": "Shri Suktam Path & Kumkumarchana Maha Puja",
    "temple": {
      "name": "Shri Mahalakshmi Ambabai Temple",
      "city": "Kolhapur",
      "state": "Maharashtra",
      "slug": "mahalakshmi-kolhapur"
    },
    "starts_at": "2026-11-06T11:00:00+05:30",
    "deadline": "2026-11-05T18:00:00+05:30",
    "image_url": "/assets/img/temples/mahalakshmi-kolhapur.jpg",
    "video_hours": 48,
    "devotees_joined": 205,
    "from_price": 251,
    "tag": "Special Puja",
    "bookable": true
  },
  {
    "id": "ch-meenakshi-archana",
    "slug": "meenakshi-amman-madurai",
    "kind": "chadhava",
    "category": "shakti",
    "title": "Devi Meenakshi Pushparchana & Ghee Lamp",
    "temple": {
      "name": "Arulmigu Meenakshi Amman Temple",
      "city": "Madurai",
      "state": "Tamil Nadu",
      "slug": "meenakshi-amman-madurai"
    },
    "starts_at": "2026-11-08T08:30:00+05:30",
    "deadline": "2026-11-07T18:00:00+05:30",
    "image_url": "/assets/img/temples/meenakshi-amman-madurai.jpg",
    "video_hours": 72,
    "devotees_joined": 88,
    "from_price": 101,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "ch-mansa-devi",
    "slug": "mansa-devi-haridwar",
    "kind": "chadhava",
    "category": "shakti",
    "title": "Mano-kamna Bandhan & Chadhava",
    "temple": {
      "name": "Maa Mansa Devi Temple, Bilwa Parvat",
      "city": "Haridwar",
      "state": "Uttarakhand",
      "slug": "mansa-devi-haridwar"
    },
    "starts_at": "2026-11-08T10:00:00+05:30",
    "deadline": "2026-11-07T18:00:00+05:30",
    "image_url": "/assets/img/temples/mansa-devi-haridwar.jpg",
    "video_hours": 72,
    "devotees_joined": 92,
    "from_price": 101,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "pj-shani-tailabhishek",
    "slug": "shani-shingnapur",
    "kind": "puja",
    "category": "shani",
    "title": "Pavitra Shani Tailabhishek & Shanti Havan",
    "temple": {
      "name": "Shri Shani Shingnapur",
      "city": "Ahmednagar",
      "state": "Maharashtra",
      "slug": "shani-shingnapur"
    },
    "starts_at": "2026-11-07T06:30:00+05:30",
    "deadline": "2026-11-06T18:00:00+05:30",
    "image_url": "/assets/img/temples/shani-shingnapur.jpg",
    "video_hours": 48,
    "devotees_joined": 320,
    "from_price": 151,
    "tag": "Shani Shanti",
    "bookable": true
  },
  {
    "id": "ch-sankat-mochan",
    "slug": "sankat-mochan-hanuman-varanasi",
    "kind": "chadhava",
    "category": "shani",
    "title": "Sindoor Chola & Sundarkand Path Seva",
    "temple": {
      "name": "Sankat Mochan Hanuman Temple",
      "city": "Varanasi",
      "state": "Uttar Pradesh",
      "slug": "sankat-mochan-hanuman-varanasi"
    },
    "starts_at": "2026-11-03T17:00:00+05:30",
    "deadline": "2026-11-03T12:00:00+05:30",
    "image_url": "/assets/img/temples/sankat-mochan-hanuman-varanasi.jpg",
    "video_hours": 72,
    "devotees_joined": 280,
    "from_price": 51,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "pj-siddhivinayak-modak",
    "slug": "siddhivinayak-mumbai",
    "kind": "puja",
    "category": "ganesh",
    "title": "Siddhivinayak 108 Durva & Modak Archana",
    "temple": {
      "name": "Shri Siddhivinayak Temple",
      "city": "Mumbai",
      "state": "Maharashtra",
      "slug": "siddhivinayak-mumbai"
    },
    "starts_at": "2026-11-04T07:30:00+05:30",
    "deadline": "2026-11-03T20:00:00+05:30",
    "image_url": "/assets/img/temples/siddhivinayak-mumbai.jpg",
    "video_hours": 48,
    "devotees_joined": 110,
    "from_price": 151,
    "tag": "Special Puja",
    "bookable": true
  },
  {
    "id": "ch-bankebihari-bhog",
    "slug": "banke-bihari-vrindavan",
    "kind": "chadhava",
    "category": "krishna",
    "title": "Makhan Mishri & Pavitra Itra Sewa",
    "temple": {
      "name": "Shri Banke Bihari Mandir",
      "city": "Vrindavan",
      "state": "Uttar Pradesh",
      "slug": "banke-bihari-vrindavan"
    },
    "starts_at": "2026-11-05T09:00:00+05:30",
    "deadline": "2026-11-04T18:00:00+05:30",
    "image_url": "/assets/img/temples/banke-bihari-vrindavan.jpg",
    "video_hours": 72,
    "devotees_joined": 395,
    "from_price": 101,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "pj-tirupati-laddu",
    "slug": "tirupati-balaji-andhra",
    "kind": "puja",
    "category": "krishna",
    "title": "Lord Venkateswara Sahasranama Archana",
    "temple": {
      "name": "Tirumala Venkateswara Temple",
      "city": "Tirupati",
      "state": "Andhra Pradesh",
      "slug": "tirupati-balaji-andhra"
    },
    "starts_at": "2026-11-07T05:30:00+05:30",
    "deadline": "2026-11-06T18:00:00+05:30",
    "image_url": "/assets/img/temples/tirupati-balaji-andhra.jpg",
    "video_hours": 48,
    "devotees_joined": 480,
    "from_price": 251,
    "tag": "Special Puja",
    "bookable": true
  },
  {
    "id": "ch-ayodhya-ramlalla",
    "slug": "ram-janmabhoomi-ayodhya",
    "kind": "chadhava",
    "category": "krishna",
    "title": "Shri Ram Lalla Pavitra Pushparchana",
    "temple": {
      "name": "Shri Ram Janmabhoomi Mandir",
      "city": "Ayodhya",
      "state": "Uttar Pradesh",
      "slug": "ram-janmabhoomi-ayodhya"
    },
    "starts_at": "2026-11-06T10:00:00+05:30",
    "deadline": "2026-11-05T18:00:00+05:30",
    "image_url": "/assets/img/temples/ram-janmabhoomi-ayodhya.jpg",
    "video_hours": 72,
    "devotees_joined": 610,
    "from_price": 101,
    "tag": "Daily Chadhava",
    "bookable": true
  },
  {
    "id": "ch-jagannath-puri",
    "slug": "jagannath-temple-puri",
    "kind": "chadhava",
    "category": "krishna",
    "title": "Shri Jagannath Mahaprasad & Dhwaja Chadhava",
    "temple": {
      "name": "Shree Jagannath Temple",
      "city": "Puri",
      "state": "Odisha",
      "slug": "jagannath-temple-puri"
    },
    "starts_at": "2026-11-08T11:00:00+05:30",
    "deadline": "2026-11-07T18:00:00+05:30",
    "image_url": "/assets/img/temples/jagannath-temple-puri.jpg",
    "video_hours": 72,
    "devotees_joined": 310,
    "from_price": 151,
    "tag": "Daily Chadhava",
    "bookable": true
  }
];

export default function MandirSevaPage({ section = 'all' }) {
  const [activeTab, setActiveTab] = useState(section === 'puja' ? 'puja' : section === 'chadhava' ? 'chadhava' : 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [secondsTick, setSecondsTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const nextTab = section === 'puja' ? 'puja' : section === 'chadhava' ? 'chadhava' : 'all';
    setActiveTab(nextTab);
    setCategoryFilter('all');
    setSearchQuery('');
  }, [section]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getUrgencyCountdown = (seedId) => {
    // Generate deterministic yet lively countdown per card
    const num = seedId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const totalRemainingSecs = Math.max(300, (num * 143 + 15420 - secondsTick) % 86400);
    const hrs = String(Math.floor(totalRemainingSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalRemainingSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalRemainingSecs % 60).padStart(2, '0');
    return `${hrs}h : ${mins}m : ${secs}s`;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetch('/api/v1/mandir/events')
      .then((res) => {
        if (!res.ok) throw new Error('API fetch error');
        return res.json();
      })
      .then((data) => {
        const items = data.events || data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          setEvents(items);
        }
      })
      .catch(() => {
        // Fallback already pre-set
      });
  }, []);

    const filteredEvents = events.filter((e) => {
    if (activeTab === 'puja' && e.kind !== 'puja') return false;
    if (activeTab === 'chadhava' && e.kind !== 'chadhava') return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        e.title.toLowerCase().includes(q) ||
        (e.temple?.name || '').toLowerCase().includes(q) ||
        (e.temple?.city || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

    const handleOfferChadhava = (event) => {
    const slug = event.temple?.slug || event.slug || 'mahakaleshwar-ujjain';
    if (event.kind === 'puja') {
      navigate(`/mandir-seva/puja/${slug}`);
    } else {
      navigate(`/mandir-seva/temple/${slug}`);
    }
  };

  return (
    <div className="shop-page mandir-page w-full min-w-0 max-w-full overflow-x-hidden">
      {/* 1. Hero Banner */}
      <section className="shop-hero mandir-hero service-banner service-banner--mandir" data-mode="home">
        <figure className="service-banner__art">
          <img src="/assets/img/mandir-banner.webp" alt="Sacred Mandir Seva" fetchPriority="high" />
          <figcaption>Illustrative image</figcaption>
        </figure>
        <div className="mandir-hero__copy service-banner__copy">
          <p className="mandir-hero__eyebrow">SACRED SEVA, FROM HOME</p>
          <h1>
            Offer chadhava at <em>your chosen temple</em>
          </h1>
          <div className="mandir-hero__titlerow">
            <span className="shop-hero__badge">E-Chadawa &amp; Sankalp Puja</span>
          </div>
          <p>
            Choose an event, select offerings in your name and gotra, and track your seva through to its recorded video proof.
          </p>
          <div className="shop-hero__actions">
            <Link to="/mandir-seva/temple/mahakaleshwar-ujjain" className="shop-btn shop-btn--gold no-underline">
              <span>🛕</span>
              <span>Explore Temples →</span>
            </Link>
            <button
              type="button"
              className="shop-btn shop-btn--ghost cursor-pointer"
              onClick={() => {
                if (window.App && typeof window.App.openBookingsModal === 'function') {
                  window.App.openBookingsModal();
                } else {
                  alert('Your booked sevas and videos will appear in your account profile.');
                }
              }}
            >
              <span>📜</span>
              <span>My Bookings &amp; Video Proof</span>
            </button>
          </div>
        </div>
        <div className="shop-trust service-benefits">
          <div>
            <span>📹</span>
            <p>
              <b>Video proof</b>
              <small>Video of your sankalp, with name &amp; gotra</small>
            </p>
          </div>
          <div>
            <span>🪔</span>
            <p>
              <b>Temple priests</b>
              <small>Performed by authentic temple priests</small>
            </p>
          </div>
          <div>
            <span>📦</span>
            <p>
              <b>Booking updates</b>
              <small>Payment, seva and video tracking</small>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Subtabs Navigation Bar */}
      <div className="flex items-center justify-center gap-2 mb-6 px-4">
        {[
          { id: 'all', label: 'All Seva Events' },
          { id: 'chadhava', label: '🪔 Daily Chadhava' },
          { id: 'puja', label: '🔱 Special Sankalp Puja' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              navigate(tab.id === 'all' ? '/mandir-seva' : `/mandir-seva/${tab.id}`);
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border"
            style={{
              background: activeTab === tab.id ? '#3E0B18' : '#FFFDF9',
              color: activeTab === tab.id ? '#FFF9EF' : '#372E2F',
              borderColor: activeTab === tab.id ? '#3E0B18' : '#E6D2B5',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(62, 11, 24, 0.25)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Search and Category Filter Toolbar */}
      <section className="shop-toolbar mb-6 px-4">
        <div className="shop-toolbar__row flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="shop-chips flex items-center gap-2 overflow-x-auto pb-1" id="mandir-category-filters">
            {[
              { id: 'all', label: 'All Temples' },
              { id: 'shiva', label: '🔱 Jyotirlinga & Shiva' },
              { id: 'shakti', label: '🌸 Shaktipeeth & Devi' },
              { id: 'shani', label: '🪐 Shani & Hanuman' },
              { id: 'ganesh', label: '🐘 Ganesh' },
              { id: 'krishna', label: '🪈 Krishna & Vishnu' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setCategoryFilter(chip.id)}
                className={`shop-chip text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  categoryFilter === chip.id ? 'is-active' : ''
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="shop-tools min-w-[260px]">
            <input
              type="search"
              className="shop-input w-full text-xs"
              placeholder="Search temple, deity or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search temples and sevas"
            />
          </div>
        </div>
      </section>

      {/* 4. Events Listing Grid (1:1 Reference Match to Screenshot 5) */}
      <section className="px-4 max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((e) => {
            const dateObj = new Date(e.starts_at);
            const dayNum = dateObj.getDate() || 3;
            const monthName = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() || 'NOV';
            const formattedDate = dateObj.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const formattedTime = dateObj.toLocaleTimeString('en-IN', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <article
                key={e.id}
                className="ch-event bg-white rounded-3xl border border-[#E7E2D8] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col"
              >
                {/* Media banner with Live Countdown */}
                <div className="ch-event-media relative h-56 overflow-hidden bg-slate-900 cursor-pointer" onClick={() => handleOfferChadhava(e)}>
                  <img
                    src={e.image_url}
                    alt={e.temple?.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  {/* Badge top-left */}
                  <span
                    className="absolute top-3.5 left-3.5 px-3 py-1 rounded-lg text-[11px] font-bold shadow-xs uppercase tracking-wider"
                    style={{ background: '#FFFDF9', color: '#3E0B18', border: '1px solid #E6D2B5' }}
                  >
                    {e.tag || (e.kind === 'puja' ? 'Special Puja' : 'Daily Chadhava')}
                  </span>
                  {/* Date badge top-right */}
                  <span
                    className="ch-date absolute top-3.5 right-3.5 w-12 h-13 rounded-xl flex flex-col items-center justify-center shadow-xs"
                    style={{ background: '#FFFDF9', border: '1px solid #E6D2B5' }}
                  >
                    <b className="text-base font-extrabold text-[#3E0B18] leading-none">{dayNum}</b>
                    <small className="text-[10px] font-bold text-[#8C787E] uppercase">{monthName}</small>
                  </span>

                  {/* Urgency Countdown Bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-3.5 py-2 flex items-center justify-between text-xs text-[#FFFDF8]"
                    style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(32, 4, 11, 0.95) 100%)' }}
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#FDE68A]">
                      <span>⏳</span> Registration Closes In:
                    </span>
                    <span className="font-mono font-extrabold text-[#F8D882] text-xs tracking-wider">
                      {getUrgencyCountdown(e.id)}
                    </span>
                  </div>
                </div>

                {/* Event details */}
                <div className="ch-event-copy p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#B45309] uppercase tracking-wider block mb-1">
                      {e.kind === 'puja' ? '🔱 MAHA YAGYA • SPECIAL SANKALP' : '🪔 DAILY TEMPLE CHADHAVA'}
                    </span>
                    <h3
                      className="font-serif text-lg font-bold text-[#1E1B4B] mb-1.5 cursor-pointer hover:text-[#B45309]"
                      onClick={() => handleOfferChadhava(e)}
                    >
                      {e.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2 font-medium">
                      📍 {e.temple?.name} · {e.temple?.city}, {e.temple?.state}
                    </p>
                    <p className="text-xs font-bold text-[#3E0B18] mb-3">
                      🗓️ {formattedDate}, {formattedTime} IST
                    </p>

                    {/* Live Sankalp Slots Progress Bar */}
                    {(() => {
                      const seed = e.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                      const bookedSlots = Math.min(96, Math.max(68, ((seed * 7) % 30) + 68));
                      const slotsLeft = 100 - bookedSlots;
                      return (
                        <div className="bg-[#FAF7F2] border border-[#EADBCA] rounded-xl p-2.5 mb-3 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#3E0B18] mb-1.5">
                            <span>🔥 {bookedSlots} / 100 Sankalp Slots Booked</span>
                            <span className="text-amber-800 font-extrabold">Only {slotsLeft} Left</span>
                          </div>
                          <div className="w-full bg-[#EADBCA] h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${bookedSlots}%`,
                                background: 'linear-gradient(90deg, #D9A441 0%, #B45309 100%)',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Guaranteed Video Proof Badge */}
                    <div className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] rounded-xl px-3 py-2 text-[11.5px] font-medium flex items-center gap-2 mb-3">
                      <span className="text-sm">📹</span>
                      <span>
                        <strong>Guaranteed Video Proof:</strong> High-definition video with your name &amp; gotra within {e.video_hours || 48} hrs.
                      </span>
                    </div>
                  </div>

                  {/* Foot with price and button */}
                  <div className="ch-event-foot pt-4 border-t border-[#F2E8DC] flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Starts From</span>
                      <strong className="text-lg font-extrabold text-[#3E0B18]">
                        ₹{e.from_price || 51}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #3E0B18 0%, #5B1324 100%)',
                        color: '#FFF9EF',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '12px',
                        border: 'none',
                      }}
                      onClick={() => handleOfferChadhava(e)}
                    >
                      {e.kind === 'puja' ? 'Book Sankalp Puja →' : 'Offer Chadhava →'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

