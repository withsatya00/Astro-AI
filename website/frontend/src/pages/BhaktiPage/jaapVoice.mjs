// Pure helpers for matching spoken mantras. Kept free of browser APIs so they can be unit tested in Node.

export const MAX_REPS_PER_RESULT = 30;

// Lowercase, drop punctuation / danda / zero-width marks and collapse whitespace.
export function normalize(text) {
  return String(text || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[​-‍﻿]/g, '')
    .replace(/[।॥.,!?;:'"()\-_–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Counts non-overlapping occurrences of the mantra in one *final* transcript. Longer phrases win,
// so "jai shri ram" is never also counted as "shri ram".
export function countRepetitions(transcript, phrases, limit = MAX_REPS_PER_RESULT) {
  const normal = normalize(transcript);
  let rest = ` ${normal} `;
  if (rest.trim() === '') return 0;
  const list = [...new Set((phrases || []).map(normalize).filter(Boolean))].sort((a, b) => b.length - a.length);
  let n = 0;
  for (const p of list) {
    const needle = ` ${p} `;
    let i;
    while ((i = rest.indexOf(needle)) !== -1) {
      n += 1;
      rest = rest.slice(0, i) + ' ' + rest.slice(i + needle.length);
    }
  }
  // Fast chanting is often transcribed without word boundaries ("radheradhe" / "राधेराधे").
  // Use the better of spaced and compact matching; adding both would count normal speech twice.
  const compact = normal.replace(/\s+/g, '');
  let compactCount = 0;
  for (const phrase of list) {
    const needle = phrase.replace(/\s+/g, '');
    if (needle.length < 4) continue;
    let from = 0, hits = 0, at;
    while ((at = compact.indexOf(needle, from)) !== -1) { hits += 1; from = at + needle.length; }
    compactCount = Math.max(compactCount, hits);
  }
  return Math.min(Math.max(n, compactCount), limit);
}

// Picks repetitions from a final SpeechRecognition result. Browser confidence values are deliberately not
// used as a gate: Chrome frequently reports a very low (or zero) score for correctly recognised Indian names
// and mantras. An exact accepted phrase is a much safer signal than that browser-specific score.
export function repetitionsFromResult(result, phrases) {
  if (!result || !result.isFinal) return 0;
  for (let a = 0; a < result.length; a += 1) {
    const alt = result[a];
    const n = countRepetitions(alt.transcript, phrases);
    if (n > 0) return n;
  }
  return 0;
}

// Stable per-speech-event id: the same recogniser run, result slot and repetition number always give the
// same id, so a retry or replay is recognised as a duplicate by the server.
export function eventIdFor(sessionId, runId, resultIndex, rep) {
  return `v-${sessionId.slice(0, 8)}-${runId}-${resultIndex}-${rep}`;
}

export const speechRecognitionCtor = () =>
  typeof window === 'undefined' ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null;
