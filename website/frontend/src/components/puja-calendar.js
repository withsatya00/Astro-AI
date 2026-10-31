import { REFERENCE_PUJAS } from './reference-pujas.js';
// Observance calendar only. These entries do not represent confirmed temple bookings.
// New Delhi / IST reference dates; temple-specific muhurat must be confirmed separately.
export const calendarSources=[
  'https://www.drikpanchang.com/calendars/hindu/hinducalendar.html?year=2026',
  'https://www.drikpanchang.com/calendars/hindu/hinducalendar.html?year=2027',
  'https://panchang.astrosage.com/calendars/hindu-calendar',
  'https://globalpanchang.com/hindu-calendar/2027/january'
];
const festivals=[
 ['2026-11-01','Ahoi Ashtami Puja','अहोई अष्टमी पूजा','devi'],
 ['2026-11-05','Rama Ekadashi Vishnu Puja','रमा एकादशी विष्णु पूजा','vishnu'],
 ['2026-11-05','Govatsa Dwadashi Gau Puja','गोवत्स द्वादशी गौ पूजा','vishnu'],
 ['2026-11-06','Dhanteras Lakshmi Kuber Puja','धनतेरस लक्ष्मी कुबेर पूजा','devi'],
 ['2026-11-06','Pradosh Shiva Puja','प्रदोष शिव पूजा','shiva'],
 ['2026-11-07','Kali Chaudas Puja','काली चौदस पूजा','devi'],
 ['2026-11-07','Masik Shivaratri Rudrabhishek','मासिक शिवरात्रि रुद्राभिषेक','shiva'],
 ['2026-11-08','Diwali Lakshmi Ganesh Puja','दीपावली लक्ष्मी गणेश पूजा','devi'],
 ['2026-11-08','Narak Chaturdashi Puja','नरक चतुर्दशी पूजा','vishnu'],
 ['2026-11-09','Kartik Amavasya Pitru Tarpan','कार्तिक अमावस्या पितृ तर्पण','shiva'],
 ['2026-11-10','Govardhan Annakut Puja','गोवर्धन अन्नकूट पूजा','vishnu'],
 ['2026-11-11','Bhai Dooj Yam Dwitiya Puja','भाई दूज यम द्वितीया पूजा','vishnu'],
 ['2026-11-15','Chhath Surya Arghya','छठ सूर्य अर्घ्य','surya'],
 ['2026-11-16','Vrishchika Sankranti Surya Puja','वृश्चिक संक्रांति सूर्य पूजा','surya'],
 ['2026-11-20','Devutthana Ekadashi Puja','देवउठनी एकादशी पूजा','vishnu'],
 ['2026-11-21','Tulsi Vivah Puja','तुलसी विवाह पूजा','vishnu'],
 ['2026-11-22','Pradosh Rudrabhishek','प्रदोष रुद्राभिषेक','shiva'],
 ['2026-11-24','Dev Deepawali & Kartik Purnima Puja','देव दीपावली और कार्तिक पूर्णिमा पूजा','shiva'],
 ['2026-11-27','Sankashti Ganesh Puja','संकष्टी गणेश पूजा','ganesh'],
 ['2026-12-01','Kalabhairav Jayanti Puja','कालभैरव जयंती पूजा','shiva'],
 ['2026-12-04','Utpanna Ekadashi Puja','उत्पन्ना एकादशी पूजा','vishnu'],
 ['2026-12-06','Pradosh Shiva Puja','प्रदोष शिव पूजा','shiva'],
 ['2026-12-07','Masik Shivaratri Rudrabhishek','मासिक शिवरात्रि रुद्राभिषेक','shiva'],
 ['2026-12-08','Margashirsha Amavasya Tarpan','मार्गशीर्ष अमावस्या तर्पण','shiva'],
 ['2026-12-14','Vivah Panchami Sita Ram Puja','विवाह पंचमी सीता राम पूजा','vishnu'],
 ['2026-12-16','Dhanu Sankranti Surya Puja','धनु संक्रांति सूर्य पूजा','surya'],
 ['2026-12-20','Mokshada Ekadashi & Gita Jayanti Puja','मोक्षदा एकादशी और गीता जयंती पूजा','vishnu'],
 ['2026-12-21','Pradosh Rudrabhishek','प्रदोष रुद्राभिषेक','shiva'],
 ['2026-12-23','Dattatreya Jayanti & Purnima Puja','दत्तात्रेय जयंती और पूर्णिमा पूजा','vishnu'],
 ['2026-12-26','Sankashti Ganesh Puja','संकष्टी गणेश पूजा','ganesh'],
 ['2027-01-03','Saphala Ekadashi Puja','सफला एकादशी पूजा','vishnu'],
 ['2027-01-05','Pradosh Shiva Puja','प्रदोष शिव पूजा','shiva'],
 ['2027-01-05','Masik Shivaratri Rudrabhishek','मासिक शिवरात्रि रुद्राभिषेक','shiva'],
 ['2027-01-07','Pausha Amavasya Pitru Tarpan','पौष अमावस्या पितृ तर्पण','shiva'],
 ['2027-01-14','Lohri Agni Puja','लोहड़ी अग्नि पूजा','surya'],
 ['2027-01-15','Makar Sankranti & Pongal Surya Puja','मकर संक्रांति और पोंगल सूर्य पूजा','surya'],
 ['2027-01-18','Pausha Putrada Ekadashi Puja','पौष पुत्रदा एकादशी पूजा','vishnu'],
 ['2027-01-20','Pradosh Rudrabhishek','प्रदोष रुद्राभिषेक','shiva'],
 ['2027-01-22','Pausha Purnima Satyanarayan Puja','पौष पूर्णिमा सत्यनारायण पूजा','vishnu'],
 ['2027-01-25','Sakat Chauth Ganesh Puja','सकट चौथ गणेश पूजा','ganesh']
];
export const deityImages={shiva:'/assets/img/temples/kashi-vishwanath-varanasi.jpg',devi:'/assets/img/temples/mahalakshmi-kolhapur.jpg',vishnu:'/assets/img/temples/tirupati-balaji-andhra.jpg',ganesh:'/assets/img/temples/siddhivinayak-mumbai.jpg',hanuman:'/assets/img/temples/sankat-mochan-hanuman-varanasi.jpg',shani:'/assets/img/temples/shani-shingnapur.jpg',surya:'/assets/img/mandir-banner.webp'};
// Several photos per deity (temple photo + its gallery shots) so a long list of pujas does not repeat one image.
const photoSlugs={
  shiva:['kashi-vishwanath-varanasi','mahakaleshwar-ujjain','somnath-jyotirlinga-gujarat','kedarnath-dham-uttarakhand','trimbakeshwar-nashik'],
  devi:['mahalakshmi-kolhapur','vaishno-devi-katra','kamakhya-devi-assam','meenakshi-amman-madurai','kalighat-kali-kolkata'],
  vishnu:['tirupati-balaji-andhra','jagannath-temple-puri','badrinath-dham-uttarakhand','dwarkadhish-dwarka','padmanabhaswamy-thiruvananthapuram'],
  ganesh:['siddhivinayak-mumbai'],hanuman:['sankat-mochan-hanuman-varanasi'],shani:['shani-shingnapur']
};
export function deityPhoto(deity,key=''){
  const slugs=photoSlugs[deity];
  if(!slugs)return deityImages[deity];
  const pool=slugs.flatMap(slug=>[`/assets/img/temples/${slug}.webp`,...[1,2,3,4].map(n=>`/assets/img/seva-gallery/${slug}-${n}.webp`)]);
  let h=0;for(const ch of String(key))h=(h*31+ch.charCodeAt(0))>>>0;
  return pool[h%pool.length];
}

export function pujaCalendar(today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})){
 const refRows = REFERENCE_PUJAS.map(p => ({ id: p.id, date: p.date, en: p.title, hi: p.title_hi, deity: p.deity, weekly: p.weekly, image: p.image, price: p.price, benefit: p.benefit, benefit_hi: p.benefit_hi, location: p.location, location_hi: p.location_hi, schedule: p.schedule, schedule_hi: p.schedule_hi, tag: p.tag, tag_hi: p.tag_hi }));
 const rows=festivals.map(([date,en,hi,deity],i)=>({id:`festival-${i}`,date,en,hi,deity,weekly:false}));
 const weekly={1:['Somvar Shiva Rudrabhishek','सोमवार शिव रुद्राभिषेक','shiva'],2:['Hanuman Chalisa & Sundarkand Path','हनुमान चालीसा और सुंदरकांड पाठ','hanuman'],3:['Ganesh Archana','गणेश अर्चना','ganesh'],4:['Vishnu Sahasranama Path','विष्णु सहस्रनाम पाठ','vishnu'],5:['Lakshmi Archana','लक्ष्मी अर्चना','devi'],6:['Shani Tailabhishek','शनि तैलाभिषेक','shani'],0:['Surya Arghya & Aditya Hridaya Path','सूर्य अर्घ्य और आदित्य हृदय पाठ','surya']};
 for(let day=new Date('2026-10-30T12:00:00Z');day<=new Date('2027-01-31T12:00:00Z');day.setUTCDate(day.getUTCDate()+1)){
   const date=day.toISOString().slice(0,10),[en,hi,deity]=weekly[day.getUTCDay()];
   rows.push({id:`weekly-${date}`,date,en,hi,deity,weekly:true});
 }
 return [...refRows, ...rows.filter(row=>row.date>=today && !refRows.some(r => r.id === row.id))].sort((a,b)=>a.date.localeCompare(b.date)||Number(a.weekly)-Number(b.weekly));
}
