const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (p) => fs.readFileSync(p, 'utf8');
const consult = read('website/frontend/src/pages/ConsultationPage/ConsultationRoom.jsx');
assert.ok(!consult.includes('● Live consultation'), 'consultation must not claim a fake live connection');
assert.ok(!consult.includes('is typing…'), 'consultation must not claim a named astrologer is typing');
assert.ok(consult.includes("['exact','Exact'],['approx','Approximate'],['unknown','Unknown']"), 'birth-time certainty control missing');
assert.ok(consult.includes('Human review is labelled only after review'), 'human review state must be explicit');

const faq = read('website/frontend/src/components/FAQAccordion/FAQAccordion.html');
assert.ok(!faq.includes('100% genuine'), 'FAQ contains an absolute product claim');
assert.ok(!faq.includes('Yes, 100%'), 'FAQ contains an absolute verification claim');
assert.equal((faq.match(/faq-question-btn/g) || []).length, 7, 'FAQ count changed unexpectedly');

const trust = read('website/frontend/src/pages/TrustCenterPage/TrustCenterPage.jsx');
for (const text of ['Prediction audit', 'Free or simple alternative', 'Export this data', 'No fear selling']) assert.ok(trust.includes(text), `${text} missing`);
console.log('PASS Week 1 trust states, birth-time confidence, FAQ claims and privacy controls');
