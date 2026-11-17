import React, { useState, useEffect, useRef } from 'react';
import { speakVedicText, stopVedicSpeech, createSpeechRecognizer } from './voiceAcharya.js';

export default function VoiceCallModal({
  isOpen,
  onClose,
  astro,
  consult,
  lang,
  onSendMessage,
  remainingSeconds = 600,
  pricePerMin = 20
}) {
  const isHi = lang === 'hi';
  const [callStatus, setCallStatus] = useState('connected'); // connected | listening | speaking | thinking | ended
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState(
    isHi
      ? `हरि ॐ! मैं ${astro?.name || 'आचार्य जी'}। आपकी जन्मकुंडली मेरे समक्ष है। कहिए, क्या संशय है आपके मन में?`
      : `Hari Om! I am ${astro?.name || 'Acharya Ji'}. Your birth chart is before me. Please tell me your concern.`
  );
  const [devoteeInput, setDevoteeInput] = useState('');

  const recognizerRef = useRef(null);
  const timerRef = useRef(null);
  const activeRef = useRef(true);

  // 1. Call Duration Timer
  useEffect(() => {
    if (!isOpen) return;
    activeRef.current = true;
    setCallDuration(0);

    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      activeRef.current = false;
      clearInterval(timerRef.current);
      stopVedicSpeech();
      if (recognizerRef.current) {
        try { recognizerRef.current.abort(); } catch {}
      }
    };
  }, [isOpen]);

  // 2. Play initial greeting on open
  useEffect(() => {
    if (!isOpen) return;

    setCallStatus('speaking');
    speakVedicText(currentSpeechText, {
      lang: isHi ? 'hi' : 'en',
      onEnd: () => {
        if (!activeRef.current) return;
        startListening();
      }
    });
  }, [isOpen]);

  // 3. Start listening for devotee's voice
  const startListening = () => {
    if (!activeRef.current || isMuted) return;

    setCallStatus('listening');
    setDevoteeInput('');

    try {
      const rec = createSpeechRecognizer({
        lang: isHi ? 'hi-IN' : 'en-IN',
        onResult: ({ text, final }) => {
          if (!activeRef.current) return;
          setDevoteeInput(text);
          if (final && text.trim().length > 3) {
            handleDevoteeSpoke(text.trim());
          }
        },
        onError: () => {
          if (activeRef.current && callStatus === 'listening') {
            // Keep listening or retry
            setTimeout(() => {
              if (activeRef.current && callStatus === 'listening') startListening();
            }, 1000);
          }
        },
        onEnd: () => {
          if (activeRef.current && callStatus === 'listening' && !devoteeInput) {
            // Auto-restart listening if nothing heard yet
            startListening();
          }
        }
      });

      if (rec) {
        recognizerRef.current = rec;
        rec.start();
      }
    } catch {}
  };

  // 4. Handle when devotee finishes speaking a question
  const handleDevoteeSpoke = async (spokenText) => {
    if (!spokenText || !activeRef.current) return;

    if (recognizerRef.current) {
      try { recognizerRef.current.abort(); } catch {}
    }

    setCallStatus('thinking');
    setCurrentSpeechText(isHi ? 'आचार्य जी कुंडली का अध्ययन कर रहे हैं…' : 'Acharya Ji is analyzing your Kundli…');

    try {
      if (onSendMessage) {
        const reply = await onSendMessage(spokenText);
        if (!activeRef.current) return;

        const replyContent = reply?.content || reply?.text || (isHi ? 'ग्रह स्थिति शुभ है, कर्म में निष्ठा रखें।' : 'Planetary transits are favorable.');
        setCurrentSpeechText(replyContent);
        setCallStatus('speaking');

        speakVedicText(replyContent, {
          lang: isHi ? 'hi' : 'en',
          onEnd: () => {
            if (!activeRef.current) return;
            startListening();
          }
        });
      }
    } catch (e) {
      if (!activeRef.current) return;
      const fallbackMsg = isHi
        ? 'ईश्वर पर विश्वास रखें, सकारात्मक कर्म ही सबसे बड़ा उपाय है। और कोई प्रश्न हो तो पूछें।'
        : 'Keep faith and perform righteous action. Do you have any further questions?';
      setCurrentSpeechText(fallbackMsg);
      setCallStatus('speaking');
      speakVedicText(fallbackMsg, {
        lang: isHi ? 'hi' : 'en',
        onEnd: () => {
          if (!activeRef.current) return;
          startListening();
        }
      });
    }
  };

  const handleEndCall = () => {
    activeRef.current = false;
    stopVedicSpeech();
    if (recognizerRef.current) {
      try { recognizerRef.current.abort(); } catch {}
    }
    clearInterval(timerRef.current);
    if (onClose) onClose();
  };

  const formatSecs = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #24050D 0%, #150207 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
      padding: '32px 20px 48px', color: '#FFF9EF', fontFamily: 'Georgia, serif'
    }}>
      {/* Top Status Bar */}
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 12, height: 12, borderRadius: '50%',
            background: callStatus === 'speaking' ? '#F59E0B' : callStatus === 'listening' ? '#10B981' : '#D4AF37',
            boxShadow: '0 0 12px currentColor'
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: '#F8D882' }}>
            {callStatus === 'speaking'
              ? (isHi ? 'आचार्य जी बोल रहे हैं…' : 'Acharya Ji Speaking…')
              : callStatus === 'listening'
              ? (isHi ? 'सुन रहे हैं… कृपया पूछें 🎙️' : 'Listening… Speak Now 🎙️')
              : (isHi ? 'कुंडली अध्ययन…' : 'Analyzing…')}
          </span>
        </div>

        <div style={{
          padding: '6px 14px', borderRadius: 999,
          background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37',
          color: '#F8D882', fontSize: 13, fontWeight: 800, letterSpacing: '0.06em'
        }}>
          ⏱️ {formatSecs(callDuration)} · ₹{pricePerMin}/m
        </div>
      </div>

      {/* Center Deity / Acharya Pulsating Avatar */}
      <div style={{ textAlign: 'center', margin: 'auto 0' }}>
        <div style={{
          position: 'relative', width: 160, height: 160, margin: '0 auto 24px',
          display: 'grid', placeItems: 'center'
        }}>
          {/* Pulsating Golden Aura Rings */}
          <div style={{
            position: 'absolute', inset: -18, borderRadius: '50%',
            border: '2px solid rgba(212,175,55,0.4)',
            animation: callStatus === 'speaking' ? 'cr-breathe 2s infinite ease-in-out' : 'none'
          }} />
          <div style={{
            position: 'absolute', inset: -36, borderRadius: '50%',
            border: '1px dashed rgba(212,175,55,0.2)',
            animation: callStatus === 'speaking' ? 'cr-spin 20s linear infinite' : 'none'
          }} />

          <img
            src={astro?.avatar || '/assets/portraits/default-avatar.svg'}
            alt={astro?.name || 'Acharya'}
            style={{
              width: 140, height: 140, borderRadius: '50%',
              objectFit: 'cover', border: '3.5px solid #D4AF37',
              boxShadow: '0 0 40px rgba(212,175,55,0.45)', position: 'relative', zIndex: 2
            }}
            onError={(e) => { e.currentTarget.src = '/assets/portraits/default-avatar.svg'; }}
          />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#FFFDF9' }}>
          {astro?.name || 'आचार्य शास्त्री'}
        </h2>
        <p style={{ fontSize: 13, color: '#E8D7BA', margin: '0 0 24px', opacity: 0.9 }}>
          {astro?.specialties?.join(' · ') || (isHi ? 'वैदिक कुण्डली एवं गोचर परामर्श' : 'Vedic Astrologer')}
        </p>

        {/* Dynamic Spoken Guidance Bubble */}
        <div style={{
          maxWidth: 520, margin: '0 auto', padding: '16px 20px', borderRadius: 16,
          background: 'rgba(62, 11, 24, 0.75)', border: '1.5px solid rgba(212,175,55,0.4)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)', minHeight: 70, display: 'flex',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#FFFDF9' }}>
            {callStatus === 'listening' && devoteeInput ? (
              <span style={{ color: '#A7F3D0' }}>“{devoteeInput}…”</span>
            ) : (
              <span>“{currentSpeechText}”</span>
            )}
          </p>
        </div>

        {/* Audio Waveform Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          marginTop: 20, height: 28
        }}>
          {[12, 22, 16, 28, 18, 24, 14, 26, 12].map((h, i) => (
            <span
              key={i}
              style={{
                width: 4, borderRadius: 999,
                height: callStatus === 'speaking' || callStatus === 'listening' ? h : 4,
                background: callStatus === 'listening' ? '#10B981' : '#D4AF37',
                transition: 'height 0.2s ease',
                animation: callStatus === 'speaking' ? `wave 0.${4 + (i % 4)}s infinite alternate ease-in-out` : 'none'
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating Action Controls */}
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        {/* Mute Button */}
        <button
          type="button"
          onClick={() => {
            const next = !isMuted;
            setIsMuted(next);
            if (next && recognizerRef.current) {
              try { recognizerRef.current.abort(); } catch {}
            } else if (!next && callStatus === 'listening') {
              startListening();
            }
          }}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: isMuted ? '#EF4444' : 'rgba(255,255,255,0.1)',
            border: '1.5px solid #D4AF37', color: '#FFF', fontSize: 20,
            cursor: 'pointer', display: 'grid', placeItems: 'center'
          }}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? '🔇' : '🎙️'}
        </button>

        {/* End Call Button */}
        <button
          type="button"
          onClick={handleEndCall}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
            border: '2px solid #FCA5A5', color: '#FFF', fontSize: 28,
            cursor: 'pointer', display: 'grid', placeItems: 'center',
            boxShadow: '0 8px 24px rgba(239,68,68,0.45)'
          }}
          title={isHi ? 'कॉल समाप्त करें' : 'End Call'}
        >
          ☎
        </button>

        {/* Repeat Question Button */}
        <button
          type="button"
          onClick={() => {
            stopVedicSpeech();
            startListening();
          }}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1.5px solid #D4AF37', color: '#F8D882', fontSize: 20,
            cursor: 'pointer', display: 'grid', placeItems: 'center'
          }}
          title={isHi ? 'फिर से बोलें' : 'Speak Again'}
        >
          🔄
        </button>
      </div>

      <style>{`
        @keyframes cr-breathe {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.12); opacity: 0.8; }
        }
        @keyframes cr-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
