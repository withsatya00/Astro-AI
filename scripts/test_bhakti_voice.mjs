// Run: node --test scripts/test_bhakti_voice.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, countRepetitions, repetitionsFromResult, eventIdFor } from '../website/frontend/src/pages/BhaktiPage/jaapVoice.mjs';

const RADHE = ['radhe radhe', 'राधे राधे'];
const JSR = ['jai shri ram', 'जय श्री राम'];
const SR = ['shri ram', 'श्री राम'];
const result = (isFinal, ...alts) => Object.assign(alts.map(([transcript, confidence]) => ({ transcript, confidence })), { isFinal });

test('normalize strips punctuation, danda and case', () => {
  assert.equal(normalize('  Radhe,  RADHE! । '), 'radhe radhe');
});

test('counts repeated phrases in one final transcript', () => {
  assert.equal(countRepetitions('radhe radhe radhe radhe', RADHE), 2);
  assert.equal(countRepetitions('राधे राधे राधे राधे राधे राधे', RADHE), 3);
  assert.equal(countRepetitions('hello world', RADHE), 0);
  assert.equal(countRepetitions('', RADHE), 0);
});

test('longer phrase is not double counted as its shorter part', () => {
  assert.equal(countRepetitions('jai shri ram', [...JSR, ...SR]), 1);
});

test('interim results are never counted', () => {
  assert.equal(repetitionsFromResult(result(false, ['radhe radhe', 0.9]), RADHE), 0);
});

test('low confidence is rejected, unreported confidence (0) is accepted', () => {
  assert.equal(repetitionsFromResult(result(true, ['radhe radhe', 0.2]), RADHE), 0);
  assert.equal(repetitionsFromResult(result(true, ['radhe radhe', 0]), RADHE), 1);
  assert.equal(repetitionsFromResult(result(true, ['xyz', 0.9], ['radhe radhe', 0.8]), RADHE), 1);
});

test('a runaway transcript is capped', () => {
  assert.equal(countRepetitions('radhe radhe '.repeat(200), RADHE), 30);
});

test('event ids are stable for the same speech event and differ otherwise', () => {
  const a = eventIdFor('12345678-aaaa', 'r1', 3, 0);
  assert.equal(a, eventIdFor('12345678-aaaa', 'r1', 3, 0));
  assert.notEqual(a, eventIdFor('12345678-aaaa', 'r1', 3, 1));
  assert.notEqual(a, eventIdFor('12345678-aaaa', 'r2', 3, 0));
});
