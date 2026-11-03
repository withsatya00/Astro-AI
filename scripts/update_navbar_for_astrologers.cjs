const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../website/frontend/src/components/Navbar/Navbar.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCrlf = content.includes('\r\n');
if (isCrlf) content = content.replace(/\r\n/g, '\n');

const targetTickerStart = '      {/* 2. Live Planetary Ephemeris Ticker */}';
const newTickerStart = '      {/* 2. Live Planetary Ephemeris Ticker */}\n      {!location.pathname.startsWith(\'/astrologers\') && (';

const targetTickerEnd = '        </div>\n      </div>\n\n      {/* 3. Sticky Site Navbar */}';
const newTickerEnd = '        </div>\n      </div>\n      )}\n\n      {/* 3. Sticky Site Navbar */}';

if (content.includes(targetTickerStart) && content.includes(targetTickerEnd)) {
  content = content.replace(targetTickerStart, newTickerStart);
  content = content.replace(targetTickerEnd, newTickerEnd);
  console.log('Successfully wrapped ticker in Navbar.jsx!');
} else {
  console.log('Could not find ticker string boundaries:');
  console.log('targetTickerStart exists?', content.includes(targetTickerStart));
  console.log('targetTickerEnd exists?', content.includes(targetTickerEnd));
}

if (isCrlf) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
