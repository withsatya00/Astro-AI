/**
 * Voice AI Vedic Acharya Engine for Astro Jyotish.
 * Provides:
 * 1. Text-to-Speech (TTS) with serene Indian Vedic Guru cadence and pitch.
 * 2. Speech-to-Text (STT) for hands-free voice questioning in Hindi/Hinglish/English.
 * 3. Real-time audio waveform and speech status management.
 */

// Strips markdown, emojis, asterisks, and technical tags for pure spiritual audio synthesis
export function sanitizeForVoice(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove markdown bold
    .replace(/\*(.*?)\*/g, '$1')     // remove markdown italic
    .replace(/#{1,6}\s+/g, '')       // remove headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove links
    .replace(/[✨🔮🪔🕉️▶️⏱️👛☎️■]/gu, '') // remove emojis that synthesis might stumble on
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Speaks the text using the best available Indian English or Hindi synthesized voice.
 */
export function speakVedicText(text, { lang = 'hi', onStart, onEnd, onError } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('SpeechSynthesis not supported on this device'));
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleanText = sanitizeForVoice(text);
  if (!cleanText) {
    if (onEnd) onEnd();
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Configure serene, reverent Acharya cadence
  utterance.rate = 0.93;  // Calm, deliberate, peaceful pacing
  utterance.pitch = 0.95; // Warm, grounded, slightly deeper pitch

  const voices = window.speechSynthesis.getVoices() || [];
  
  // Prefer natural Indian voice (Hindi or Indian English)
  let bestVoice = null;
  if (lang === 'hi' || /[\u0900-\u097F]/.test(cleanText)) {
    bestVoice = voices.find((v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')) ||
                voices.find((v) => v.lang.includes('IN') || v.name.toLowerCase().includes('india'));
  } else {
    bestVoice = voices.find((v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india')) ||
                voices.find((v) => v.lang.startsWith('en'));
  }

  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    // Treat benign cancel as end
    if (e.error === 'canceled' || e.error === 'interrupted') {
      if (onEnd) onEnd();
    } else if (onError) {
      onError(e);
    }
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stops all currently playing audio synthesis.
 */
export function stopVedicSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Creates a SpeechRecognition instance for devotee voice questioning.
 */
export function createSpeechRecognizer({ lang = 'hi-IN', onResult, onError, onEnd }) {
  if (typeof window === 'undefined') return null;

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    if (onError) onError(new Error('SpeechRecognition not supported in this browser'));
    return null;
  }

  const recognizer = new SpeechRec();
  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.lang = lang;

  recognizer.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    if (onResult) {
      onResult({
        final: final.trim(),
        interim: interim.trim(),
        text: (final || interim).trim()
      });
    }
  };

  recognizer.onerror = (err) => {
    if (onError) onError(err);
  };

  recognizer.onend = () => {
    if (onEnd) onEnd();
  };

  return recognizer;
}
