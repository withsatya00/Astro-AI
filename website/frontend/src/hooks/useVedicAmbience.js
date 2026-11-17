import { useCallback, useEffect, useRef, useState } from 'react';

// Soft tanpura-like drone (108/216/432/648 Hz) generated with Web Audio, so no audio file is downloaded.
const FREQUENCIES = [108, 216, 432, 648];

export function useVedicAmbience() {
  const [isPlaying, setIsPlaying] = useState(false);
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    const nodes = nodesRef.current;
    if (ctx && nodes) {
      nodes.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
      setTimeout(() => nodes.oscillators.forEach((osc) => { try { osc.stop(); } catch (e) { /* already stopped */ } }), 900);
    }
    nodesRef.current = null;
    setIsPlaying(false);
  }, []);

  const start = useCallback(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctxRef.current) ctxRef.current = new AudioCtx();
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 1.2);
    gain.connect(ctx.destination);

    const oscillators = FREQUENCIES.map((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (idx > 0) osc.detune.setValueAtTime(idx % 2 === 0 ? 3 : -3, ctx.currentTime);
      osc.connect(gain);
      osc.start();
      return osc;
    });

    nodesRef.current = { gain, oscillators };
    setIsPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    if (nodesRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => () => {
    if (nodesRef.current) nodesRef.current.oscillators.forEach((osc) => { try { osc.stop(); } catch (e) { /* ignore */ } });
    if (ctxRef.current) ctxRef.current.close();
  }, []);

  return { isPlaying, toggle };
}
