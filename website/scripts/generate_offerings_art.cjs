const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../frontend/assets/img/offerings');

const items = [
  {
    name: 'sindoor.webp',
    svg: `<svg width='480' height='480' viewBox='0 0 480 480' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <radialGradient id='bgGrad' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#FFFDF7'/>
          <stop offset='100%' stop-color='#FCECD2'/>
        </radialGradient>
        <radialGradient id='thaliGrad' cx='45%' cy='45%' r='55%'>
          <stop offset='0%' stop-color='#FFE58F'/>
          <stop offset='60%' stop-color='#D48806'/>
          <stop offset='100%' stop-color='#874D00'/>
        </radialGradient>
        <radialGradient id='kumkumGrad' cx='40%' cy='40%' r='60%'>
          <stop offset='0%' stop-color='#FF4D4F'/>
          <stop offset='70%' stop-color='#CF1322'/>
          <stop offset='100%' stop-color='#820014'/>
        </radialGradient>
        <radialGradient id='haldiGrad' cx='40%' cy='40%' r='60%'>
          <stop offset='0%' stop-color='#FFEC3D'/>
          <stop offset='70%' stop-color='#FAAD14'/>
          <stop offset='100%' stop-color='#AD6800'/>
        </radialGradient>
      </defs>
      <rect width='480' height='480' fill='url(#bgGrad)'/>
      <!-- Brass Thali -->
      <ellipse cx='240' cy='240' rx='200' ry='155' fill='url(#thaliGrad)' filter='drop-shadow(0px 15px 22px rgba(0,0,0,0.25))'/>
      <ellipse cx='240' cy='238' rx='180' ry='138' fill='#FAAD14' stroke='#D48806' stroke-width='4'/>
      <ellipse cx='240' cy='236' rx='165' ry='122' fill='url(#thaliGrad)'/>
      <!-- Sindoor Bowl (Red Kumkum) -->
      <ellipse cx='185' cy='220' rx='65' ry='50' fill='url(#kumkumGrad)' filter='drop-shadow(0px 8px 12px rgba(130,0,20,0.45))'/>
      <ellipse cx='185' cy='215' rx='55' ry='38' fill='#FF4D4F' opacity='0.85'/>
      <!-- Haldi Bowl -->
      <ellipse cx='295' cy='210' rx='55' ry='42' fill='url(#haldiGrad)' filter='drop-shadow(0px 8px 10px rgba(173,104,0,0.3))'/>
      <!-- Akshat (Rice grains) & Petals -->
      <ellipse cx='240' cy='275' rx='60' ry='32' fill='#FFFDF8' stroke='#FFE58F' stroke-width='3'/>
      <circle cx='235' cy='270' r='5' fill='#D48806'/>
      <circle cx='245' cy='275' r='5' fill='#CF1322'/>
      <circle cx='240' cy='280' r='4' fill='#FAAD14'/>
      <!-- Red flower petals -->
      <path d='M145,290 C135,270 155,260 165,280 Z' fill='#F5222D'/>
      <path d='M330,285 C345,270 355,285 340,295 Z' fill='#F5222D'/>
    </svg>`
  },
  {
    name: 'combo.webp',
    svg: `<svg width='480' height='480' viewBox='0 0 480 480' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <radialGradient id='bgGrad2' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#FFFDF7'/>
          <stop offset='100%' stop-color='#FFE7BA'/>
        </radialGradient>
        <linearGradient id='goldCoin' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#FFF566'/>
          <stop offset='50%' stop-color='#FAAD14'/>
          <stop offset='100%' stop-color='#D46B08'/>
        </linearGradient>
      </defs>
      <rect width='480' height='480' fill='url(#bgGrad2)'/>
      <!-- Large Royal Brass Thali -->
      <ellipse cx='240' cy='240' rx='205' ry='160' fill='#D48806' filter='drop-shadow(0px 18px 24px rgba(0,0,0,0.25))'/>
      <ellipse cx='240' cy='237' rx='185' ry='142' fill='#FFD666'/>
      <ellipse cx='240' cy='235' rx='170' ry='126' fill='#FAAD14'/>
      <!-- Kalash in center -->
      <path d='M215,185 Q240,170 265,185 Q275,220 265,240 Q240,250 215,240 Q205,220 215,185 Z' fill='url(#goldCoin)'/>
      <!-- Coconut & Mango leaves -->
      <ellipse cx='240' cy='175' rx='18' ry='22' fill='#874D00'/>
      <polygon points='225,180 200,160 220,170' fill='#52C41A'/>
      <polygon points='255,180 280,160 260,170' fill='#52C41A'/>
      <!-- Lotus Flower on left -->
      <path d='M145,225 Q155,195 165,225 Q155,245 145,225 Z' fill='#EB2F96'/>
      <path d='M130,230 Q140,205 155,230 Q140,250 130,230 Z' fill='#FF85C0'/>
      <path d='M160,230 Q170,205 180,230 Q170,250 160,230 Z' fill='#FF85C0'/>
      <!-- Gold Coins Stack on right -->
      <ellipse cx='325' cy='240' rx='28' ry='14' fill='url(#goldCoin)' stroke='#874D00'/>
      <ellipse cx='325' cy='232' rx='28' ry='14' fill='url(#goldCoin)' stroke='#874D00'/>
      <ellipse cx='325' cy='224' rx='28' ry='14' fill='url(#goldCoin)' stroke='#874D00'/>
      <!-- Sweets / Peda -->
      <circle cx='210' cy='275' r='14' fill='#FFF0F6' stroke='#D48806'/>
      <circle cx='240' cy='280' r='14' fill='#FFF0F6' stroke='#D48806'/>
      <circle cx='270' cy='275' r='14' fill='#FFF0F6' stroke='#D48806'/>
    </svg>`
  },
  {
    name: 'yantra.webp',
    svg: `<svg width='480' height='480' viewBox='0 0 480 480' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <radialGradient id='yantraBg' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#FFFBE6'/>
          <stop offset='100%' stop-color='#FFE58F'/>
        </radialGradient>
        <linearGradient id='goldPlate' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#FFF1B8'/>
          <stop offset='40%' stop-color='#FFD666'/>
          <stop offset='80%' stop-color='#D48806'/>
          <stop offset='100%' stop-color='#874D00'/>
        </linearGradient>
      </defs>
      <rect width='480' height='480' fill='url(#yantraBg)'/>
      <!-- Square Yantra Plate with Bhupura -->
      <rect x='60' y='60' width='360' height='360' rx='16' fill='url(#goldPlate)' filter='drop-shadow(0px 16px 22px rgba(135,77,0,0.35))'/>
      <rect x='80' y='80' width='320' height='320' rx='8' fill='#FFD666' stroke='#874D00' stroke-width='4'/>
      <!-- Sacred Concentric Circles -->
      <circle cx='240' cy='240' r='130' fill='#FFF1B8' stroke='#874D00' stroke-width='3'/>
      <circle cx='240' cy='240' r='112' fill='none' stroke='#D48806' stroke-width='2' stroke-dasharray='5,5'/>
      <!-- 8-Petal Lotus in Yantra -->
      <circle cx='240' cy='240' r='90' fill='#FFE58F' stroke='#874D00' stroke-width='2'/>
      <!-- Interlocking Sacred Triangles / Kuber Yantra Matrix -->
      <polygon points='240,160 320,285 160,285' fill='none' stroke='#CF1322' stroke-width='4'/>
      <polygon points='240,320 320,195 160,195' fill='none' stroke='#874D00' stroke-width='4'/>
      <!-- Central Bindu -->
      <circle cx='240' cy='240' r='14' fill='#CF1322'/>
      <circle cx='240' cy='240' r='6' fill='#FFD666'/>
    </svg>`
  },
  {
    name: 'shringar.webp',
    svg: `<svg width='480' height='480' viewBox='0 0 480 480' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <radialGradient id='shringarBg' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#FFF0F6'/>
          <stop offset='100%' stop-color='#FFD6E7'/>
        </radialGradient>
      </defs>
      <rect width='480' height='480' fill='url(#shringarBg)'/>
      <!-- Brass Shringar Thali -->
      <ellipse cx='240' cy='240' rx='200' ry='155' fill='#D48806' filter='drop-shadow(0px 16px 20px rgba(0,0,0,0.22))'/>
      <ellipse cx='240' cy='237' rx='185' ry='138' fill='#FAAD14'/>
      <ellipse cx='240' cy='235' rx='170' ry='122' fill='#FFE58F'/>
      <!-- Red Silk Chunri with Golden Border -->
      <path d='M125,255 Q165,175 225,195 Q295,175 335,235 Q275,275 195,265 Z' fill='#CF1322' opacity='0.9' stroke='#FFD666' stroke-width='6'/>
      <!-- Bangles (Choodiyan) -->
      <circle cx='175' cy='225' r='26' fill='none' stroke='#52C41A' stroke-width='5'/>
      <circle cx='180' cy='225' r='26' fill='none' stroke='#EB2F96' stroke-width='5'/>
      <circle cx='185' cy='225' r='26' fill='none' stroke='#FAAD14' stroke-width='5'/>
      <!-- Alta & Sindoor Box -->
      <ellipse cx='295' cy='220' rx='30' ry='22' fill='#A8071A' stroke='#FFD666' stroke-width='3'/>
      <!-- Small Silver Mirror -->
      <circle cx='240' cy='245' r='24' fill='#BAE7FF' stroke='#874D00' stroke-width='3'/>
    </svg>`
  },
  {
    name: 'kamalgatta.webp',
    svg: `<svg width='480' height='480' viewBox='0 0 480 480' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <radialGradient id='lotusBg' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#F6FFED'/>
          <stop offset='100%' stop-color='#D9F7BE'/>
        </radialGradient>
      </defs>
      <rect width='480' height='480' fill='url(#lotusBg)'/>
      <!-- Sacred Brass Plate -->
      <ellipse cx='240' cy='240' rx='200' ry='150' fill='#D48806' filter='drop-shadow(0px 15px 22px rgba(0,0,0,0.25))'/>
      <ellipse cx='240' cy='237' rx='182' ry='134' fill='#FFD666'/>
      <ellipse cx='240' cy='235' rx='166' ry='118' fill='#FFFBE6'/>
      <!-- Lotus Leaf Base -->
      <ellipse cx='240' cy='235' rx='140' ry='100' fill='#52C41A' opacity='0.85'/>
      <!-- Kamal Gatta Rosary Beads -->
      <ellipse cx='240' cy='230' rx='100' ry='68' fill='none' stroke='#262626' stroke-width='16' stroke-dasharray='14,6'/>
      <!-- Loose Sacred Kamal Gatta seeds -->
      <ellipse cx='230' cy='225' rx='14' ry='10' fill='#1F1F1F' stroke='#434343' stroke-width='2'/>
      <ellipse cx='255' cy='230' rx='15' ry='10' fill='#262626' stroke='#434343' stroke-width='2'/>
      <ellipse cx='240' cy='248' rx='14' ry='9' fill='#141414' stroke='#434343' stroke-width='2'/>
      <!-- Lotus Flower Accent -->
      <path d='M240,150 Q250,125 260,150 Q250,170 240,150 Z' fill='#EB2F96'/>
      <path d='M225,155 Q235,130 245,155 Q235,175 225,155 Z' fill='#FF85C0'/>
      <path d='M255,155 Q265,130 275,155 Q265,175 255,155 Z' fill='#FF85C0'/>
    </svg>`
  },
  {
    name: 'jowar.webp',
    svg: `<svg width='480' height='480' viewBox='0 0 480 480' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <radialGradient id='jowarBg' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#FFFDF0'/>
          <stop offset='100%' stop-color='#FEF3D6'/>
        </radialGradient>
      </defs>
      <rect width='480' height='480' fill='url(#jowarBg)'/>
      <!-- Traditional Brass Thali -->
      <ellipse cx='240' cy='240' rx='200' ry='150' fill='#D48806' filter='drop-shadow(0px 15px 22px rgba(0,0,0,0.22))'/>
      <ellipse cx='240' cy='237' rx='182' ry='134' fill='#FFD666'/>
      <ellipse cx='240' cy='235' rx='166' ry='118' fill='#FAAD14'/>
      <!-- Mound of Golden Sorghum Grains -->
      <ellipse cx='240' cy='232' rx='135' ry='92' fill='#FFF1B8' stroke='#D48806' stroke-width='3'/>
      <ellipse cx='240' cy='228' rx='105' ry='68' fill='#FFE58F'/>
      <ellipse cx='240' cy='222' rx='72' ry='45' fill='#FFF566'/>
      <!-- Betel nut & flowers on top -->
      <circle cx='240' cy='218' r='16' fill='#874D00'/>
      <circle cx='218' cy='228' r='9' fill='#CF1322'/>
      <circle cx='262' cy='228' r='9' fill='#FF4D4F'/>
    </svg>`
  },
  {
    name: 'bilva.webp',
    svg: `<svg width='480' height='480' viewBox='0 0 480 480' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <radialGradient id='shivaBg' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#F0F5FF'/>
          <stop offset='100%' stop-color='#D6E4FF'/>
        </radialGradient>
      </defs>
      <rect width='480' height='480' fill='url(#shivaBg)'/>
      <!-- Sacred Silver Plate -->
      <ellipse cx='240' cy='240' rx='200' ry='150' fill='#8C8C8C' filter='drop-shadow(0px 16px 20px rgba(0,0,0,0.22))'/>
      <ellipse cx='240' cy='237' rx='182' ry='134' fill='#D9D9D9'/>
      <ellipse cx='240' cy='235' rx='166' ry='118' fill='#F5F5F5'/>
      <!-- Three-leaf Bilva Patra -->
      <path d='M240,135 C215,170 215,205 240,225 C265,205 265,170 240,135 Z' fill='#389E0D' stroke='#237804' stroke-width='3'/>
      <path d='M170,205 C192,182 225,200 235,220 C212,242 180,225 170,205 Z' fill='#52C41A' stroke='#237804' stroke-width='3'/>
      <path d='M310,205 C288,182 255,200 245,220 C268,242 300,225 310,205 Z' fill='#52C41A' stroke='#237804' stroke-width='3'/>
      <path d='M240,225 Q240,265 245,285' stroke='#237804' stroke-width='6' fill='none'/>
      <!-- Chandan Tripundra & Bhasma bowl -->
      <ellipse cx='240' cy='280' rx='50' ry='25' fill='#FFFFFF' stroke='#BFBFBF' stroke-width='2' filter='drop-shadow(0px 5px 8px rgba(0,0,0,0.15))'/>
      <line x1='230' y1='175' x2='250' y2='175' stroke='#FFE58F' stroke-width='3'/>
      <line x1='228' y1='181' x2='252' y2='181' stroke='#FFE58F' stroke-width='3'/>
      <line x1='230' y1='187' x2='250' y2='187' stroke='#FFE58F' stroke-width='3'/>
      <circle cx='240' cy='181' r='2.5' fill='#CF1322'/>
    </svg>`
  },
  {
    name: 'gangajal.webp',
    svg: `<svg width='480' height='480' viewBox='0 0 480 480' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <radialGradient id='gangaBg' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#E6F7FF'/>
          <stop offset='100%' stop-color='#BAE7FF'/>
        </radialGradient>
        <linearGradient id='brassLota' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#FFE58F'/>
          <stop offset='50%' stop-color='#D48806'/>
          <stop offset='100%' stop-color='#874D00'/>
        </linearGradient>
      </defs>
      <rect width='480' height='480' fill='url(#gangaBg)'/>
      <!-- Holy Brass Gangajali Lota / Kalash -->
      <ellipse cx='240' cy='320' rx='95' ry='32' fill='#874D00' opacity='0.3'/>
      <path d='M195,175 L285,175 L295,200 L280,310 L200,310 L185,200 Z' fill='url(#brassLota)' filter='drop-shadow(0px 14px 18px rgba(0,0,0,0.22))'/>
      <!-- Rim -->
      <ellipse cx='240' cy='175' rx='46' ry='18' fill='#FFD666' stroke='#874D00' stroke-width='3'/>
      <!-- Ganga Water Droplets -->
      <path d='M240,135 Q245,155 240,175' stroke='#1890FF' stroke-width='4' fill='none'/>
      <circle cx='240' cy='125' r='9' fill='#40A9FF'/>
      <!-- Flowers -->
      <circle cx='175' cy='320' r='16' fill='#FFFDF8' stroke='#FAAD14'/>
      <circle cx='305' cy='320' r='16' fill='#FFFDF8' stroke='#FAAD14'/>
      <circle cx='240' cy='335' r='17' fill='#FFFDF8' stroke='#FAAD14'/>
    </svg>`
  },
  {
    name: 'vastra.webp',
    svg: `<svg width='480' height='480' viewBox='0 0 480 480' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <radialGradient id='vastraBg' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#FFFBE6'/>
          <stop offset='100%' stop-color='#FFE58F'/>
        </radialGradient>
      </defs>
      <rect width='480' height='480' fill='url(#vastraBg)'/>
      <!-- Brass Platter -->
      <ellipse cx='240' cy='240' rx='200' ry='150' fill='#D48806' filter='drop-shadow(0px 15px 22px rgba(0,0,0,0.22))'/>
      <ellipse cx='240' cy='237' rx='182' ry='134' fill='#FFD666'/>
      <ellipse cx='240' cy='235' rx='166' ry='118' fill='#FFF1B8'/>
      <!-- Folded Pitambari Yellow Silk Vastra -->
      <rect x='140' y='170' width='200' height='115' rx='14' fill='#FAAD14' stroke='#CF1322' stroke-width='7' filter='drop-shadow(0px 8px 12px rgba(135,77,0,0.3))'/>
      <rect x='155' y='185' width='170' height='85' rx='10' fill='#FFE58F' stroke='#D48806' stroke-width='2'/>
      <!-- Pavitra Janeu Thread -->
      <ellipse cx='240' cy='228' rx='55' ry='28' fill='none' stroke='#FFFFFF' stroke-width='6' stroke-dasharray='10,4'/>
      <circle cx='240' cy='228' r='14' fill='#874D00'/>
    </svg>`
  },
  {
    name: 'harachara.webp',
    svg: `<svg width='480' height='480' viewBox='0 0 480 480' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <radialGradient id='grassBg' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#F6FFED'/>
          <stop offset='100%' stop-color='#B7EB8F'/>
        </radialGradient>
      </defs>
      <rect width='480' height='480' fill='url(#grassBg)'/>
      <!-- Fresh Green Grass Sheaf -->
      <ellipse cx='240' cy='330' rx='140' ry='38' fill='#389E0D' opacity='0.3'/>
      <path d='M195,320 Q155,200 120,120' stroke='#52C41A' stroke-width='11' stroke-linecap='round' fill='none'/>
      <path d='M210,320 Q180,180 160,100' stroke='#389E0D' stroke-width='13' stroke-linecap='round' fill='none'/>
      <path d='M230,320 Q225,170 215,80' stroke='#73D13D' stroke-width='12' stroke-linecap='round' fill='none'/>
      <path d='M250,320 Q260,160 270,85' stroke='#52C41A' stroke-width='12' stroke-linecap='round' fill='none'/>
      <path d='M265,320 Q290,180 315,105' stroke='#389E0D' stroke-width='13' stroke-linecap='round' fill='none'/>
      <path d='M280,320 Q325,200 360,130' stroke='#73D13D' stroke-width='11' stroke-linecap='round' fill='none'/>
      <rect x='190' y='255' width='100' height='18' rx='9' fill='#CF1322'/>
      <rect x='215' y='310' width='55' height='32' rx='6' fill='#874D00' stroke='#D46B08' stroke-width='2'/>
    </svg>`
  }
];

async function generateAll() {
  for (const item of items) {
    const buf = Buffer.from(item.svg);
    const dest = path.join(outDir, item.name);
    await sharp(buf)
      .webp({ quality: 92 })
      .toFile(dest);
  }
  console.log('Re-generated all 10 offerings icons cleanly without bottom labels.');
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
