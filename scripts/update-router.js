const fs = require('fs');
const filePath = 'website/frontend/js/router.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldPujaRoute = `    else if (/^\\/mandir-seva\\/puja\\/[\\w-]+\\/?$/.test(pathname)) {
      // A puja detail page: the puja list sits behind it, the detail opens over it and has its own shareable URL.
      this.switchView('view-mandir');
      this.updateNavbarActive('nav-link-mandir');
      const id = pathname.replace('/mandir-seva/puja/', '').replace(/\\/+$/, '');
      const page = window.MandirSevaPageComponent;
      if (page) { page.mode = 'puja'; if (page.applyMode) page.applyMode(); }
      setTimeout(() => window.ChadhavaExperience?.calendarDetail?.(id), 150);
    }`;

const newPujaRoute = `    else if (/^\\/mandir-seva\\/puja\\/[\\w-]+\\/?$/.test(pathname)) {
      this.switchView('view-puja-detail');
      this.updateNavbarActive('nav-link-mandir');
      const id = pathname.replace('/mandir-seva/puja/', '').replace(/\\/+$/, '');
      if (window.PujaDetailPageComponent) {
        setTimeout(() => window.PujaDetailPageComponent.open(id), 20);
      } else if (window.ChadhavaExperience) {
        setTimeout(() => window.ChadhavaExperience?.calendarDetail?.(id), 20);
      }
    }`;

const oldViews = `    const views = ['view-dashboard', 'view-home', 'view-directory', 'view-profile', 'view-consultation', 'view-horoscope', 'view-calculators', 'view-panchang', 'view-mandir', 'view-mall', 'view-admin', 'view-product', 'view-temple', 'view-rewards', 'view-gifts', 'view-gau-sewa', 'view-seller', 'view-verify'];`;
const newViews = `    const views = ['view-dashboard', 'view-home', 'view-directory', 'view-profile', 'view-consultation', 'view-horoscope', 'view-calculators', 'view-panchang', 'view-mandir', 'view-mall', 'view-admin', 'view-product', 'view-temple', 'view-puja-detail', 'view-rewards', 'view-gifts', 'view-gau-sewa', 'view-seller', 'view-verify'];`;

const norm = s => s.replace(/\r\n/g, '\n');
content = norm(content);

if (content.includes(norm(oldPujaRoute))) {
  content = content.replace(norm(oldPujaRoute), newPujaRoute);
  console.log('Replaced oldPujaRoute');
} else {
  console.log('oldPujaRoute not found directly');
}

if (content.includes(norm(oldViews))) {
  content = content.replace(norm(oldViews), newViews);
  console.log('Replaced oldViews');
} else {
  console.log('oldViews not found directly');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated router.js successfully!');

