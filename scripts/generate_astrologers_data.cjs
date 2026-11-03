const fs = require('fs');
const path = require('path');

const top6 = [
  {
    id: 'pt-rameshwar-dwivedi',
    slug: 'pt-rameshwar-dwivedi',
    name: 'Pt. Rameshwar Dwivedi',
    title: 'Vedic Astrology, Kundli, Vastu',
    avatar: '/assets/portraits/pt-rameshwar-dwivedi.jpg',
    fallbackAvatar: '/assets/portraits/pt-rameshwar-dwivedi.svg',
    rating: 4.9,
    review_count: 2846,
    experience_years: 15,
    price_per_minute: 40,
    languages: ['Hindi', 'English'],
    specialties: ['Vedic Astrology', 'Kundli', 'Vastu', 'Career'],
    availability: 'online',
    statusLabel: 'Online',
    gender: 'male'
  },
  {
    id: 'vidushi-meera-devi',
    slug: 'vidushi-meera-devi',
    name: 'Vidushi Meera Devi',
    title: 'Kundli, Marriage, Relationship',
    avatar: '/assets/portraits/vidushi-meera-ref.jpg',
    fallbackAvatar: '/assets/portraits/vidushi-meera-devi.jpg',
    rating: 4.8,
    review_count: 1932,
    experience_years: 12,
    price_per_minute: 35,
    languages: ['Hindi', 'English'],
    specialties: ['Kundli', 'Marriage', 'Love & Relationship'],
    availability: 'online',
    statusLabel: 'Online',
    gender: 'female'
  },
  {
    id: 'acharya-kn-rao',
    slug: 'acharya-kn-rao',
    name: 'Acharya K.N. Rao',
    title: 'Career, Business, Finance',
    avatar: '/assets/portraits/acharya-kn-rao.jpg',
    fallbackAvatar: '/assets/portraits/acharya-kn-rao.svg',
    rating: 4.9,
    review_count: 3418,
    experience_years: 20,
    price_per_minute: 50,
    languages: ['Hindi', 'English', 'Punjabi'],
    specialties: ['Career', 'Business', 'Finance', 'Kundli Analysis'],
    availability: 'available_5',
    statusLabel: 'Available in 5 min',
    gender: 'male'
  },
  {
    id: 'acharya-vaibhav-nath',
    slug: 'acharya-vaibhav-nath',
    name: 'Acharya Vaibhav Nath',
    title: 'Vedic Astrology, Numerology',
    avatar: '/assets/portraits/acharya-vaibhav-ref.jpg',
    fallbackAvatar: '/assets/portraits/pt-anand-swaroop.jpg',
    rating: 4.7,
    review_count: 1204,
    experience_years: 8,
    price_per_minute: 30,
    languages: ['Hindi', 'English'],
    specialties: ['Vedic Astrology', 'Numerology', 'Career'],
    availability: 'online',
    statusLabel: 'Online',
    gender: 'male'
  },
  {
    id: 'dr-meenakshi-sharma',
    slug: 'dr-meenakshi-sharma',
    name: 'Dr. Meenakshi Sharma',
    title: 'Vastu, Health, Family',
    avatar: '/assets/portraits/dr-meenakshi-ref.jpg',
    fallbackAvatar: '/assets/portraits/dr-meenakshi-iyer.jpg',
    rating: 4.8,
    review_count: 2106,
    experience_years: 14,
    price_per_minute: 40,
    languages: ['Hindi', 'English'],
    specialties: ['Vastu', 'Health', 'Family', 'Love & Relationship'],
    availability: 'online',
    statusLabel: 'Online',
    gender: 'female'
  },
  {
    id: 'acharya-vishwanath',
    slug: 'acharya-vishwanath',
    name: 'Acharya Vishwanath',
    title: 'Kundli, Remedial Astrology',
    avatar: '/assets/portraits/acharya-vishwanath.jpg',
    fallbackAvatar: '/assets/portraits/acharya-vishwanath.svg',
    rating: 4.9,
    review_count: 2979,
    experience_years: 18,
    price_per_minute: 45,
    languages: ['Hindi', 'English', 'Marathi'],
    specialties: ['Kundli Analysis', 'Remedial Astrology', 'Remedies', 'Finance'],
    availability: 'available_10',
    statusLabel: 'Available in 10 min',
    gender: 'male'
  }
];

// Existing portraits pool
const poolPortraits = [
  { file: 'pt-harinarayan-mishra.jpg', name: 'Pt. Harinarayan Mishra', gender: 'male', exp: 22, rating: 4.9, reviews: 2640, price: 45, title: 'Kaal Sarp & Shani Shanti Specialist', specs: ['Vedic Astrology', 'Remedies', 'Kundli Analysis'], langs: ['Hindi', 'Bhojpuri'] },
  { file: 'vidushi-sunita-sharma.jpg', name: 'Vidushi Sunita Sharma', gender: 'female', exp: 16, rating: 4.8, reviews: 1840, price: 38, title: 'Tarot Grandmaster & Relationship Guide', specs: ['Tarot', 'Love & Relationship', 'Marriage'], langs: ['Hindi', 'English', 'Punjabi'] },
  { file: 'dr-arvind-mohan.jpg', name: 'Dr. Arvind Mohan', gender: 'male', exp: 24, rating: 4.9, reviews: 3120, price: 55, title: 'Medical Astrology & KP System Scholar', specs: ['Health', 'Career', 'KP System'], langs: ['Hindi', 'English', 'Bengali'] },
  { file: 'vidushi-tarot-aradhana.jpg', name: 'Vidushi Aradhana', gender: 'female', exp: 11, rating: 4.7, reviews: 1420, price: 32, title: 'Intuitive Tarot & Crystal Healing Counselor', specs: ['Tarot', 'Education', 'Love & Relationship'], langs: ['Hindi', 'English'] },
  { file: 'acharya-shastri.jpg', name: 'Acharya Ram Shastri', gender: 'male', exp: 21, rating: 4.9, reviews: 2780, price: 48, title: 'Vedic Gemstone & Yantra Specialist', specs: ['Gemology', 'Vedic Astrology', 'Remedies', 'Finance'], langs: ['Hindi', 'English', 'Sanskrit'] },
  { file: 'dr-radhika-nair.jpg', name: 'Dr. Radhika Nair', gender: 'female', exp: 17, rating: 4.8, reviews: 1950, price: 42, title: 'Prashna Jyotish & Nadi Astrology Authority', specs: ['Nadi Astrology', 'Career', 'Health'], langs: ['English', 'Hindi', 'Tamil'] },
  { file: 'pt-devavrata.jpg', name: 'Pt. Devavrata Shastri', gender: 'male', exp: 19, rating: 4.8, reviews: 1890, price: 40, title: 'Past Life Karmic Healer & Muhurat Expert', specs: ['Vedic Astrology', 'Remedies', 'Marriage'], langs: ['Hindi', 'Sanskrit'] },
  { file: 'vidushi-gayatri-bhatt.jpg', name: 'Vidushi Gayatri Bhatt', gender: 'female', exp: 15, rating: 4.9, reviews: 2210, price: 44, title: 'Lal Kitab & Vastu Shastra Consultant', specs: ['Lal Kitab', 'Vastu', 'Finance'], langs: ['Hindi', 'English', 'Gujarati'] },
  { file: 'acharya-raghavendra.jpg', name: 'Acharya Raghavendra', gender: 'male', exp: 23, rating: 4.9, reviews: 3340, price: 52, title: 'Vivah Kundli & Shubh Muhurat Specialist', specs: ['Marriage', 'Kundli Analysis', 'Career'], langs: ['Hindi', 'English', 'Telugu'] },
  { file: 'vidushi-priyanka-sen.jpg', name: 'Vidushi Priyanka Sen', gender: 'female', exp: 13, rating: 4.7, reviews: 1530, price: 35, title: 'Numerology & Name Correction Expert', specs: ['Numerology', 'Business', 'Education'], langs: ['Hindi', 'English', 'Bengali'] },
  { file: 'pt-brijesh-pandey.jpg', name: 'Pt. Brijesh Pandey', gender: 'male', exp: 20, rating: 4.8, reviews: 2490, price: 45, title: 'Vedic Horoscope & Manglik Dosha Expert', specs: ['Kundli Analysis', 'Marriage', 'Remedies'], langs: ['Hindi', 'Bhojpuri'] },
  { file: 'vidushi-shambhavi.jpg', name: 'Vidushi Shambhavi', gender: 'female', exp: 14, rating: 4.8, reviews: 1760, price: 38, title: 'Chakra Balancing & Spiritual Mentor', specs: ['Love & Relationship', 'Health', 'Remedies'], langs: ['Hindi', 'English'] },
  { file: 'pt-devesh-jha.jpg', name: 'Pt. Devesh Jha', gender: 'male', exp: 18, rating: 4.8, reviews: 2080, price: 42, title: 'Maithil Jyotish & Career Guidance Acharya', specs: ['Career', 'Finance', 'Vedic Astrology'], langs: ['Hindi', 'English'] },
  { file: 'vidushi-shalini-kapoor.jpg', name: 'Vidushi Shalini Kapoor', gender: 'female', exp: 16, rating: 4.8, reviews: 1870, price: 40, title: 'Palmistry & Face Reading Specialist', specs: ['Career', 'Business', 'Marriage'], langs: ['Hindi', 'English'] },
  { file: 'acharya-mukund.jpg', name: 'Acharya Mukund Joshi', gender: 'male', exp: 25, rating: 4.9, reviews: 3450, price: 60, title: 'Senior Jyotish Shiromani & Astakavarga Expert', specs: ['Vedic Astrology', 'Kundli Analysis', 'Finance'], langs: ['Hindi', 'Marathi', 'Sanskrit'] },
  { file: 'dr-krishna-murthy.jpg', name: 'Dr. Krishna Murthy', gender: 'male', exp: 22, rating: 4.9, reviews: 2980, price: 50, title: 'KP System & Sub-Lord Astrologer', specs: ['KP System', 'Career', 'Business'], langs: ['English', 'Hindi', 'Tamil'] },
  { file: 'vidushi-kalpana-trivedi.jpg', name: 'Vidushi Kalpana Trivedi', gender: 'female', exp: 17, rating: 4.8, reviews: 2150, price: 42, title: 'Child Birth & Education Jyotish Scholar', specs: ['Education', 'Family', 'Health'], langs: ['Hindi', 'Gujarati'] },
  { file: 'pt-govind-shastri.jpg', name: 'Pt. Govind Shastri', gender: 'male', exp: 19, rating: 4.8, reviews: 2260, price: 44, title: 'Panchang & Graha Dosh Niwaran Acharya', specs: ['Remedies', 'Kundli Analysis', 'Finance'], langs: ['Hindi', 'Sanskrit'] },
  { file: 'vidushi-ananya-joshi.jpg', name: 'Vidushi Ananya Joshi', gender: 'female', exp: 12, rating: 4.7, reviews: 1390, price: 34, title: 'Modern Career & Corporate Astrology Advisor', specs: ['Career', 'Business', 'Education'], langs: ['Hindi', 'English'] },
  { file: 'pt-vidyadhar.jpg', name: 'Pt. Vidyadhar Sharma', gender: 'male', exp: 26, rating: 4.9, reviews: 3620, price: 58, title: 'Trikal Darshi Vedic Scholar & Tantra Jyotish', specs: ['Vedic Astrology', 'Remedies', 'Health'], langs: ['Hindi', 'English', 'Sanskrit'] },
  { file: 'vidushi-pallavi-deshmukh.jpg', name: 'Vidushi Pallavi Deshmukh', gender: 'female', exp: 15, rating: 4.8, reviews: 1820, price: 39, title: 'Kundli Milan & Pre-Marital Vedic Counselor', specs: ['Marriage', 'Love & Relationship', 'Kundli Analysis'], langs: ['Hindi', 'Marathi'] },
  { file: 'pt-anand-swaroop.jpg', name: 'Pt. Anand Swaroop', gender: 'male', exp: 21, rating: 4.8, reviews: 2540, price: 46, title: 'Rahu-Ketu Transit & Dasha Remedies Guide', specs: ['Vedic Astrology', 'Remedies', 'Career'], langs: ['Hindi', 'English'] }
];

// Generate exactly 72 astrologers
const allAstrologers = [...top6];
let counter = 7;
while (allAstrologers.length < 72) {
  const template = poolPortraits[(counter - 7) % poolPortraits.length];
  const cycle = Math.floor((counter - 7) / poolPortraits.length);
  const suffix = cycle > 0 ? ` (${cycle + 1})` : '';
  const id = `astro-${counter}`;
  
  const availability = counter % 5 === 0 ? 'available_5' : (counter % 7 === 0 ? 'available_10' : 'online');
  const statusLabel = availability === 'online' ? 'Online' : (availability === 'available_5' ? 'Available in 5 min' : 'Available in 10 min');

  allAstrologers.push({
    id,
    slug: id,
    name: `${template.name}${suffix}`,
    title: template.title,
    avatar: `/assets/portraits/${template.file}`,
    fallbackAvatar: '/assets/portraits/default-avatar.svg',
    rating: Number((template.rating - (cycle * 0.1)).toFixed(1)),
    review_count: Math.max(800, template.reviews - (cycle * 220) + (counter * 7)),
    experience_years: template.exp,
    price_per_minute: template.price,
    languages: template.langs,
    specialties: template.specs,
    availability,
    statusLabel,
    gender: template.gender
  });
  counter++;
}

console.log(`Generated total astrologers: ${allAstrologers.length}`);

const outContent = `// Autogenerated 72 Verified Astrologers Dataset for Astro Jyotish Directory
export const ALL_ASTROLOGERS = ${JSON.stringify(allAstrologers, null, 2)};
`;

const targetPath = path.resolve(__dirname, '../website/frontend/src/pages/DirectoryPage/astrologersData.js');
fs.writeFileSync(targetPath, outContent, 'utf8');
console.log(`Saved to ${targetPath}`);
