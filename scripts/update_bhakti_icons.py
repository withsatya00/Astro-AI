with open('website/frontend/src/pages/BhaktiPage/BhaktiHome.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """function SevaStrip({ wd, isHi }) {
  const items = [
    [
      '🛕',
      isHi ? 'मंदिर सेवा' : 'Mandir Seva',
      isHi ? 'अपने नाम व गोत्र से संकल्प पूजा' : 'Online Puja & Sankalp in your name',
      '/mandir-seva/puja',
    ],
    [
      '🌸',
      isHi ? 'दैनिक चढ़ावा' : 'Daily Chadhava',
      isHi ? 'गर्भगृह में पावन सामग्री अर्पण' : 'Offer sacred items at holy sanctums',
      '/mandir-seva/chadhava',
    ],
    [
      '📿',
      isHi ? `${wd.name_hi || wd.name} हेतु सामग्री` : `Offerings for ${wd.name}`,
      isHi ? 'माला, रुद्राक्ष एवं पूजन सामग्री' : 'Mala, rudraksha & puja essentials',
      `/astro-mall?category=${wd.mall}`,
    ],
    [
      '🐄',
      isHi ? 'गौ सेवा' : 'Gau Sewa',
      isHi ? 'गौ माता संरक्षण हेतु पावन दान' : 'Support and protect sacred cows',
      '/gau-sewa',
    ],
  ];"""

replacement = """// Sacred Golden Devotional Icons
function TempleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 3L27.5 9.5H20.5L24 3Z" fill="#D4AF37"/>
      <path d="M24 9.5V14" stroke="#F3D079" strokeWidth="2" strokeLinecap="round"/>
      <path d="M13 20L24 11.5L35 20H13Z" fill="url(#goldGrad1)" stroke="#D4AF37" strokeWidth="1.5"/>
      <path d="M11 20H37V24H11V20Z" fill="#8C2B32" stroke="#D4AF37" strokeWidth="1"/>
      <path d="M15 24V41M24 24V41M33 24V41" stroke="#F3D079" strokeWidth="2" strokeLinecap="round"/>
      <path d="M19 41V31.5C19 28.5 21.2 26.5 24 26.5C26.8 26.5 29 28.5 29 31.5V41H19Z" fill="#FFFDF8" stroke="#8C2B32" strokeWidth="1.5"/>
      <path d="M8 41H40V45H8V41Z" fill="url(#goldGrad1)" stroke="#D4AF37" strokeWidth="1.2"/>
      <defs>
        <linearGradient id="goldGrad1" x1="8" y1="11" x2="40" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FCE7A1"/>
          <stop offset="0.5" stopColor="#D4AF37"/>
          <stop offset="1" stopColor="#9E7418"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function PushpaIcon() {
  return (
    <svg viewBox="0 0 48 48" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 11C24 11 17 20 17 27C17 31 20.1 34 24 34C27.9 34 31 31 31 27C31 20 24 11 24 11Z" fill="url(#lotusGrad)" stroke="#E8A0BF" strokeWidth="1.2"/>
      <path d="M17 18C17 18 9 23.5 9 29.5C9 33 12 35.5 15.5 35.5C20 35.5 22 29.5 22 29.5" fill="url(#lotusGrad)" stroke="#E8A0BF" strokeWidth="1.2"/>
      <path d="M31 18C31 18 39 23.5 39 29.5C39 33 36 35.5 32.5 35.5C28 35.5 26 29.5 26 29.5" fill="url(#lotusGrad)" stroke="#E8A0BF" strokeWidth="1.2"/>
      <path d="M24 34V43M19 41C19 41 21.5 43 24 43C26.5 43 29 41 29 41" stroke="#529E72" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="24" cy="26.5" r="3.5" fill="#FFE885" stroke="#D4AF37" strokeWidth="1"/>
      <defs>
        <linearGradient id="lotusGrad" x1="10" y1="11" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA8B6"/>
          <stop offset="0.55" stopColor="#E84393"/>
          <stop offset="1" stopColor="#9E1B48"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function MalaIcon() {
  return (
    <svg viewBox="0 0 48 48" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="19" r="14.5" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="4.5 3.5"/>
      <circle cx="24" cy="33.5" r="4.2" fill="#D4AF37" stroke="#8C2B32" strokeWidth="1.5"/>
      <path d="M24 37.5L20.5 45.5H27.5L24 37.5Z" fill="#C23934" stroke="#D4AF37" strokeWidth="1"/>
      <circle cx="16" cy="10.5" r="2.8" fill="#8C4A28" stroke="#F3D079" strokeWidth="0.8"/>
      <circle cx="32" cy="10.5" r="2.8" fill="#8C4A28" stroke="#F3D079" strokeWidth="0.8"/>
      <circle cx="9.5" cy="19" r="2.8" fill="#8C4A28" stroke="#F3D079" strokeWidth="0.8"/>
      <circle cx="38.5" cy="19" r="2.8" fill="#8C4A28" stroke="#F3D079" strokeWidth="0.8"/>
      <circle cx="14.5" cy="27.5" r="2.8" fill="#8C4A28" stroke="#F3D079" strokeWidth="0.8"/>
      <circle cx="33.5" cy="27.5" r="2.8" fill="#8C4A28" stroke="#F3D079" strokeWidth="0.8"/>
    </svg>
  );
}

function GauMataIcon() {
  return (
    <svg viewBox="0 0 48 48" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" fill="url(#cowGrad)" stroke="#D4AF37" strokeWidth="1.5"/>
      <path d="M14 15.5C13 11 17 8 19 10.5C19 12.8 17 15 15 15.5Z" fill="#D4AF37" stroke="#8C2B32" strokeWidth="0.8"/>
      <path d="M34 15.5C35 11 31 8 29 10.5C29 12.8 31 15 33 15.5Z" fill="#D4AF37" stroke="#8C2B32" strokeWidth="0.8"/>
      <path d="M18.5 15C18.5 15 21.5 13 24 13C26.5 13 29.5 15 29.5 15C32 17.5 33.5 21.5 33.5 27C33.5 32.5 29.5 36.5 24 36.5C18.5 36.5 14.5 32.5 14.5 27C14.5 21.5 16 17.5 18.5 15Z" fill="#FFFDF9" stroke="#8C2B32" strokeWidth="1.4"/>
      <ellipse cx="24" cy="30.5" rx="6.5" ry="4.5" fill="#FCE6EC" stroke="#8C2B32" strokeWidth="1"/>
      <circle cx="21" cy="30" r="1.2" fill="#8C2B32"/>
      <circle cx="27" cy="30" r="1.2" fill="#8C2B32"/>
      <circle cx="19.5" cy="22.5" r="1.8" fill="#2D1F1D"/>
      <circle cx="28.5" cy="22.5" r="1.8" fill="#2D1F1D"/>
      <path d="M24 16.5L22.8 20H25.2L24 16.5Z" fill="#C23934"/>
      <circle cx="24" cy="20.8" r="1" fill="#D4AF37"/>
      <defs>
        <linearGradient id="cowGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFDF8"/>
          <stop offset="1" stopColor="#F8EEDB"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function SevaStrip({ wd, isHi }) {
  const items = [
    [
      <TempleIcon key="mandir" />,
      isHi ? 'मंदिर सेवा' : 'Mandir Seva',
      isHi ? 'अपने नाम व गोत्र से संकल्प पूजा' : 'Online Puja & Sankalp in your name',
      '/mandir-seva/puja',
    ],
    [
      <PushpaIcon key="chadhava" />,
      isHi ? 'दैनिक चढ़ावा' : 'Daily Chadhava',
      isHi ? 'गर्भगृह में पावन सामग्री अर्पण' : 'Offer sacred items at holy sanctums',
      '/mandir-seva/chadhava',
    ],
    [
      <MalaIcon key="offerings" />,
      isHi ? `${wd.name_hi || wd.name} हेतु सामग्री` : `Offerings for ${wd.name}`,
      isHi ? 'माला, रुद्राक्ष एवं पूजन सामग्री' : 'Mala, rudraksha & puja essentials',
      `/astro-mall?category=${wd.mall}`,
    ],
    [
      <GauMataIcon key="gau" />,
      isHi ? 'गौ सेवा' : 'Gau Sewa',
      isHi ? 'गौ माता संरक्षण हेतु पावन दान' : 'Support and protect sacred cows',
      '/gau-sewa',
    ],
  ];"""

assert target in content, "target not found in BhaktiHome.jsx"
content = content.replace(target, replacement)

with open('website/frontend/src/pages/BhaktiPage/BhaktiHome.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated BhaktiHome.jsx successfully!")
