const fs = require('node:fs');
const file = 'website/frontend/src/pages/Modals/Modals.html';
let html = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
if (!html.includes('id="modal-appointments"')) {
  const start = html.indexOf('        <!-- Appointment Booking Form');
  const end = html.indexOf('\n      </div>\n    </div>\n  </div>', start);
  if (start < 0 || end < 0) throw Error('Appointment section not found');
  const appointments = html.slice(start, end);
  html = html.slice(0, start) + `        <div class="wallet-footer-action"><span data-i18n="exp.appointmentsHint">Looking for an astrologer appointment?</span><button type="button" class="shop-btn shop-btn--line" onclick="App.openAppointmentsModal()" data-i18n="exp.manageAppointments">Manage appointments</button></div>` + html.slice(end);
  const marker = '  <!-- ====================================================================\n       MODAL 15:';
  const offset = html.indexOf(marker);
  if (offset < 0) throw Error('Glossary marker not found');
  const modal = `<div class="modal-overlay" id="modal-appointments"><div class="modal-card appointments-panel"><div class="modal-header"><div><h3 data-i18n="exp.sessions">Appointments</h3><p data-i18n="exp.appointmentsIntro">Book and manage a scheduled consultation.</p></div><button type="button" class="btn-icon modal-close" data-i18n-title="exp.close" aria-label="Close">✕</button></div><div class="modal-body">${appointments}</div></div></div>\n\n`;
  html = html.slice(0, offset) + modal + html.slice(offset);
}
const walletStart = html.indexOf('<div class="modal-overlay" id="modal-wallet-bookings">');
const walletEnd = html.indexOf('<div class="modal-overlay" id="modal-appointments">', walletStart);
let wallet = html.slice(walletStart, walletEnd);
wallet = wallet.replace('class="modal-card" style="max-width: 820px; max-height: 90vh;"', 'class="modal-card wallet-panel"');
wallet = wallet.replace('<span>👛</span> Astro Jyotish Wallet & Appointment Desk', '<span data-i18n="exp.wallet">Wallet</span>');
wallet = wallet.replace('Manage prepaid consultation credits, book appointments with verified human scholars, and track receipts.', '<span data-i18n="exp.walletIntro">Your balance and every payment, clearly organised.</span>');
wallet = wallet.replace('Available Balance (उपलब्ध बैलेंस)', '<span data-i18n="exp.balance">Available balance</span>');
wallet = wallet.replace('Instant test wallet enabled • Zero bank fees', '<span data-i18n="exp.testCreditNote">Test credits · no bank payment is collected</span>');
wallet = wallet.replace('Quick Top-Up:', '<span data-i18n="exp.topUp">Add funds</span>');
html = html.slice(0, walletStart) + wallet + html.slice(walletEnd);
// Fees come from the selected astrologer, not hardcoded mode prices.
html = html.replace('Text Chat Session (₹15/min)', 'Text Chat Session').replace('Direct Audio Call (₹20/min)', 'Direct Audio Call').replace('Live Video Consultation (₹30/min)', 'Live Video Consultation');
html = html.replace('id="booking-astrologer-select" class="form-select" required', 'id="booking-astrologer-select" class="form-select" onchange="App.updateBookingFeePreview()" required');
fs.writeFileSync(file, html);
