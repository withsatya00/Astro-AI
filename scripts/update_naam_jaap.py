with open('website/frontend/src/pages/BhaktiPage/NaamJaap.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* unsupported */ } }"""

replacement = """function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* unsupported */ } }

function playDevotionalChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime); // 528Hz Solfeggio frequency
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.75);
  } catch (e) { /* audio playback prevented */ }
}"""

target_voice = """        for (let a = 0; a < res.length; a += 1) {
          const candidateTotal = countRepetitions(`${finalSpeech.current} ${res[a].transcript}`, mantra.match_phrases, 1000000);
          if (candidateTotal > total) { total = candidateTotal; chosen = res[a].transcript; }
        }
        finalSpeech.current = `${finalSpeech.current} ${chosen}`.trim();
        setHeard(chosen);
        const n = Math.max(0, total - countedSpeech.current);
        countedSpeech.current = Math.max(countedSpeech.current, total);
        for (let k = 0; k < n; k += 1) {
          const s = jaapRef.current.session;
          if (!s || !jaapRef.current.add(1, 'voice', eventIdFor(s.id, runId, i, k))) break;
        }
        if (n > 0) vibrate(8);"""

replacement_voice = """        const phrases = (mantra?.match_phrases && mantra.match_phrases.length)
          ? mantra.match_phrases
          : [mantra?.text_roman, mantra?.text_hi, mantra?.text_devanagari, mantra?.text].filter(Boolean);
        for (let a = 0; a < res.length; a += 1) {
          const candidateTotal = countRepetitions(`${finalSpeech.current} ${res[a].transcript}`, phrases, 1000000);
          if (candidateTotal > total) { total = candidateTotal; chosen = res[a].transcript; }
        }
        finalSpeech.current = `${finalSpeech.current} ${chosen}`.trim();
        setHeard(chosen);
        const n = Math.max(0, total - countedSpeech.current);
        countedSpeech.current = Math.max(countedSpeech.current, total);
        for (let k = 0; k < n; k += 1) {
          const s = jaapRef.current.session;
          if (!s || !jaapRef.current.add(1, 'voice', eventIdFor(s.id, runId, i, k))) break;
        }
        if (n > 0) {
          vibrate(15);
          playDevotionalChime();
        }"""

assert target in content, "target not found"
assert target_voice in content, "target_voice not found"

content = content.replace(target, replacement)
content = content.replace(target_voice, replacement_voice)

with open('website/frontend/src/pages/BhaktiPage/NaamJaap.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated NaamJaap.jsx successfully with chime sound and robust phrases!")
