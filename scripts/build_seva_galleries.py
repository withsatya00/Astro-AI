"""Download Wikimedia gallery photos and preserve source/author/license metadata."""
import concurrent.futures
import json
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1] / 'website/frontend'
DEST = ROOT / 'assets/img/seva-gallery'
DEST.mkdir(parents=True, exist_ok=True)
QUERIES = {
 'kashi-vishwanath-varanasi':'Kashi Vishwanath Temple',
 'mahakaleshwar-ujjain':'Mahakaleshwar Temple Ujjain',
 'somnath-jyotirlinga-gujarat':'Somnath temple',
 'kedarnath-dham-uttarakhand':'Kedarnath temple',
 'tirupati-balaji-andhra':'Tirumala Venkateswara Temple',
 'vaishno-devi-katra':'Vaishno Devi temple',
 'kamakhya-devi-assam':'Kamakhya temple',
 'siddhivinayak-mumbai':'Siddhivinayak Temple Mumbai',
 'shani-shingnapur':'Shani Shingnapur temple',
 'jagannath-temple-puri':'Jagannath temple Puri',
 'ram-janmabhoomi-ayodhya':'Ram Mandir Ayodhya',
 'trimbakeshwar-nashik':'Trimbakeshwar temple',
 'sankat-mochan-hanuman-varanasi':'Sankat Mochan Hanuman Temple Varanasi',
 'ramanathaswamy-rameswaram':'Ramanathaswamy temple',
 'padmanabhaswamy-thiruvananthapuram':'Padmanabhaswamy temple',
 'omkareshwar-madhya-pradesh':'Omkareshwar temple',
 'meenakshi-amman-madurai':'intitle:Meenakshi intitle:Madurai',
 'mansa-devi-haridwar':'Mansa Devi temple Haridwar',
 'mallikarjuna-srisailam':'Mallikarjuna temple Srisailam',
 'mahalakshmi-kolhapur':'Mahalakshmi temple Kolhapur',
 'krishna-janmabhoomi-mathura':'Krishna Janmasthan Temple',
 'khatu-shyam-rajasthan':'Khatu Shyam temple',
 'kalighat-kali-kolkata':'Kalighat temple',
 'dwarkadhish-dwarka':'Dwarkadhish temple Dwarka',
 'brihadeeswara-thanjavur':'Brihadisvara Temple Thanjavur',
 'bhimashankar-maharashtra':'Bhimashankar temple',
 'banke-bihari-vrindavan':'Banke Bihari temple',
 'baidyanath-deoghar':'Baidyanath temple Deoghar',
 'badrinath-dham-uttarakhand':'Badrinath temple',
 'ritual-shiva':'Shiva abhishekam',
 'ritual-devi':'Lakshmi puja',
 'ritual-vishnu':'Satyanarayan puja',
 'ritual-ganesh':'Ganesha puja',
 'ritual-hanuman':'Hanuman puja',
 'ritual-shani':'Shani puja',
 'ritual-surya':'Surya puja'
}

def collect(pair):
 slug, query = pair
 try:
  response = requests.get('https://commons.wikimedia.org/w/api.php', params=dict(action='query',format='json',generator='search',gsrsearch=query,gsrnamespace=6,gsrlimit=12,prop='imageinfo',iiprop='url|extmetadata',iiurlwidth=1100), headers={'User-Agent':'AstroJyotishPreview/1.0 (local gallery research)'}, timeout=25)
  response.raise_for_status()
  pages=sorted(response.json().get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',0))
  photos=[]
  for page in pages:
   info=page.get('imageinfo',[{}])[0]
   url=info.get('thumburl',info.get('url',''))
   if not url or not any(ext in url.lower() for ext in ('.jpg','.jpeg','.png','.webp')): continue
   meta=info.get('extmetadata',{})
   # Use only openly licensed photographs; omit maps, logos and drawings.
   if any(word in page['title'].lower() for word in ('map','logo','drawing','painting','illustration','3d','plan.','svg','flag')):continue
   if slug=='trimbakeshwar-nashik' and 'pune' in page['title'].lower():continue
   if slug=='somnath-jyotirlinga-gujarat' and 'chatterjee' in page['title'].lower():continue
   if slug=='ram-janmabhoomi-ayodhya' and not any(name in page['title'].lower() for name in ('ram mandir','ram janmabhoomi','ram lalla','rammandirayodhya')):continue
   license_name=meta.get('LicenseShortName',{}).get('value','')
   if not any(word in license_name for word in ('CC','Public domain')):continue
   data=requests.get(url,headers={'User-Agent':'AstroJyotishPreview/1.0'},timeout=25)
   if data.status_code!=200 or not data.headers.get('Content-Type','').startswith('image/'):continue
   ext='.png' if 'png' in data.headers['Content-Type'] else '.jpg'
   filename=f'{slug}-{len(photos)+1}{ext}'
   (DEST/filename).write_bytes(data.content)
   photos.append(dict(src='/assets/img/seva-gallery/'+filename,title=page['title'].removeprefix('File:'),source=info.get('descriptionurl'),author=meta.get('Artist',{}).get('value',''),license=license_name,license_url=meta.get('LicenseUrl',{}).get('value','')))
   if len(photos)==5:break
  print(slug,len(photos),flush=True)
  return slug,photos
 except Exception as e:
  print(slug,type(e).__name__,flush=True)
  return slug,[]

if __name__=='__main__':
 target=ROOT/'assets/seva-galleries.json'
 galleries=json.loads(target.read_text(encoding='utf-8')) if target.exists() else {}
 with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
  for slug,photos in pool.map(collect,[(s,q) for s,q in QUERIES.items() if not galleries.get(s)]):
   galleries[slug]=photos
   target.write_text(json.dumps(galleries,ensure_ascii=False,indent=2),encoding='utf-8')
 (ROOT/'assets/seva-galleries.json').write_text(json.dumps(galleries,ensure_ascii=False,indent=2),encoding='utf-8')
