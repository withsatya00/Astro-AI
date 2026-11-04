import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WalletModal from '../../components/WalletModal/WalletModal.jsx';
import './consultation-room.css';

const experts = {
  'pt-rameshwar-dwivedi': { name: 'Pt. Rameshwar Dwivedi', avatar: '/assets/portraits/pt-rameshwar-dwivedi.jpg', rate: 35 },
  'acharya-kn-rao': { name: 'Acharya K.N. Rao Ji', avatar: '/assets/portraits/acharya-kn-rao.jpg', rate: 51 },
  'vidushi-sunita-sharma': { name: 'Vidushi Sunita Sharma', avatar: '/assets/portraits/vidushi-sunita-sharma.jpg', rate: 45 },
};
const questions = ['👑 राजयोग का प्रभाव?', '🍂 शनि शांति उपाय', '💎 भाग्यशाली रत्न?', '💍 शादी का योग?', '💼 करियर तरक्की?'];

export default function ConsultationRoom() {
  const { slug = 'pt-rameshwar-dwivedi' } = useParams();
  const navigate = useNavigate();
  const astrologer = experts[slug] || experts['pt-rameshwar-dwivedi'];
  const [seconds, setSeconds] = useState(88);
  const [walletOpen, setWalletOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [ended, setEnded] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [birthCertainty, setBirthCertainty] = useState('exact');
  const [messages, setMessages] = useState([{ id: 1, sender: 'astro', text: `प्रणाम! यह ${astrologer.name} का consultation desk है। पहले आपका प्रश्न और जन्म-समय की विश्वसनीयता समझेंगे। Human review होने पर जवाब पर स्पष्ट review label दिखेगा।` }]);
  const endRef = useRef(null);
  useEffect(() => { const id = setInterval(() => setSeconds(v => v + 1), 1000); return () => clearInterval(id); }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const send = (value = input) => {
    const text = value.trim(); if (!text) return;
    setMessages(m => [...m, { id: Date.now(), sender: 'user', text }]); setInput(''); setTyping(true);
    setTimeout(() => { setMessages(m => [...m, { id: Date.now() + 1, sender: 'astro', text: 'आपके प्रश्न को समझ रहा हूँ। कृपया अपनी जन्म तिथि, सही समय और जन्म स्थान साझा करें, ताकि मैं सटीक मार्गदर्शन दे सकूँ।' }]); setTyping(false); }, 900);
  };
  return <div className="cr-shell">
    <header className="cr-topbar"><button className="cr-back" onClick={() => navigate('/astrologers')}>←</button><img className="cr-top-avatar" src={astrologer.avatar} alt=""/><div className="cr-top-person"><strong>{astrologer.name} <i>✓</i></strong><span>Digital intake · Human review is labelled only after review</span></div><div className="cr-actions"><span className="cr-live">Session: {time}</span><button className="cr-wallet" onClick={() => setWalletOpen(true)}>👛 ₹150</button><button className="cr-call" onClick={() => setCallOpen(true)}>☎ <span>Request Call</span></button><button className="cr-end" onClick={() => setEnded(true)}>□ <span>End</span></button></div></header>
    <div className="cr-workspace"><aside className="cr-profile"><div className="cr-om">ॐ</div><img src={astrologer.avatar} alt={astrologer.name}/><h1>{astrologer.name} <i>✓</i></h1><div className="cr-flourish">◆</div><p className="cr-role">Vedic Astrologer &amp; Jyotishacharya</p><div className="cr-stats"><div>🪷<b>Profile</b><small>Verified details</small></div><div>👥<b>Review</b><small>Real status only</small></div><div>⭐<b>Feedback</b><small>Clients only</small></div></div><section><h2>◎ &nbsp;Specialty</h2><p>Kundli Analysis, Career, Marriage,<br/>Finance, Health, Grih Shanti</p></section><div className="cr-profile-secure">🛡️ <span><b>Private &amp; secure consultation</b><small>Your conversation is confidential</small></span></div></aside>
      <main className="cr-chat"><div className="cr-notice">🔒 <strong>Private consultation intake</strong><span>|</span><em>Calculations may be prepared digitally. Human-reviewed guidance carries a separate review label.</em></div><div className="cr-certainty"><b>Birth time:</b>{[['exact','Exact'],['approx','Approximate'],['unknown','Unknown']].map(([k,l]) => <button key={k} className={birthCertainty === k ? 'on' : ''} onClick={() => setBirthCertainty(k)}>{l}</button>)}<small>{birthCertainty === 'exact' ? 'Detailed chart timing can be used.' : birthCertainty === 'approx' ? 'A time range should be compared before precise timing.' : 'Minute-specific predictions should be avoided.'}</small></div><div className="cr-messages">{messages.map(message => <div key={message.id} className={`cr-message ${message.sender === 'user' ? 'is-user' : ''}`}>{message.sender === 'astro' && <img src={astrologer.avatar} alt=""/>}<div className="cr-bubble">{message.sender === 'astro' && <strong>Consultation desk</strong>}<p>{message.text}</p><small>Just now</small></div></div>)}{typing && <div className="cr-typing">● ● ● &nbsp; Preparing the next question…</div>}<div ref={endRef}/></div><footer className="cr-composer-wrap"><div className="cr-chips">{questions.map(q => <button key={q} onClick={() => send(q.replace(/^\S+\s/, ''))}>{q}</button>)}</div><div className="cr-composer"><button title="Attach">⌕</button><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask your astrological question…"/><button className="cr-send" onClick={() => send()}>➤</button></div></footer></main>
    </div>
    {callOpen && <div className="cr-modal"><div><img src={astrologer.avatar} alt=""/><h2>Request a call with {astrologer.name}</h2><p>A confirmed availability slot is required before billing starts.</p><button onClick={() => setCallOpen(false)}>Close request</button></div></div>}
    {ended && <div className="cr-modal"><div><div className="cr-namaste">🙏</div><h2>Consultation complete</h2><p>Thank you for consulting with {astrologer.name}.</p><button onClick={() => navigate('/astrologers')}>Back to astrologers</button><button className="cr-modal-link" onClick={() => setEnded(false)}>Continue chat</button></div></div>}
    <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)}/>
  </div>;
}
