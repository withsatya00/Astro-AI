// Pure helpers for matching spoken mantras. Kept free of browser APIs so they can be unit tested in Node.

export const MIN_CONFIDENCE = 0.5;
export const MAX_REPS_PER_RESULT = 30;

// Lowercase, drop punctuation / danda / zero-width marks and collapse whitespace.
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[​-‍﻿]/g, '')
    .replace(/[।॥.,!?;:'"()\-_–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Counts non-overlapping occurrences of the mantra in one *final* transcript. Longer phrases win,
// so "jai shri ram" is never also counted as "shri ram".
export function countRepetitions(transcript, phrases) {
  let rest = ` ${normalize(transcript)} `;
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
  return Math.min(n, MAX_REPS_PER_RESULT);
}

// Picks the usable repetitions from a SpeechRecognitionResult-like object: the final flag is required, and
// the first alternative that matches and clears the confidence bar is used. Confidence 0 means "not reported".
export function repetitionsFromResult(result, phrases) {
  if (!result || !result.isFinal) return 0;
  for (let a = 0; a < result.length; a += 1) {
    const alt = result[a];
    const conf = alt.confidence;
    if (conf > 0 && conf < MIN_CONFIDENCE) continue;
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
