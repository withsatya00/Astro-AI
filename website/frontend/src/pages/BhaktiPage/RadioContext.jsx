import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Bhajans play in YouTube's own embedded player (nothing is downloaded or re-hosted). The player stays visible while
// playing, as YouTube's embedding rules require, and lives in the Bhakti layout so it survives moving between Bhakti pages.
const RadioCtx = createContext(null);
export const useRadio = () => useContext(RadioCtx);

const RECENT_KEY = 'bhakti_radio_recent_v1';
const VOL_KEY = 'bhakti_radio_volume_v1';
const readJson = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch (e) { return d; } };
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };

let ytPromise = null;
function loadYouTube() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!ytPromise) {
    ytPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.onerror = () => { ytPromise = null; resolve(null); };
      document.head.appendChild(s);
    });
  }
  return ytPromise;
}

export function RadioProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState({ t: 0, d: 0 });
  const [volume, setVolumeState] = useState(() => readJson(VOL_KEY, 80));
  const [repeat, setRepeat] = useState('off'); // off | all | one
  const [shuffle, setShuffle] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState(() => readJson(RECENT_KEY, []));
  const [sleepAt, setSleepAt] = useState(0);
  const hostRef = useRef(null);
  const player = useRef(null);
  const ready = useRef(false);
  const live = useRef({});
  const current = index >= 0 ? queue[index] : null;
  live.current = { queue, index, repeat, shuffle, volume, current };

  const remember = useCallback((t) => {
    setRecent((cur) => {
      const next = [t, ...cur.filter((x) => x.youtube_id !== t.youtube_id)].slice(0, 10);
      writeJson(RECENT_KEY, next);
      return next;
    });
  }, []);

  const goTo = useCallback((i) => {
    const { queue: q } = live.current;
    if (!q.length) return;
    const n = ((i % q.length) + q.length) % q.length;
    setIndex(n);
    setError('');
    if (ready.current && player.current) player.current.loadVideoById(q[n].youtube_id);
  }, []);

  const next = useCallback((auto = false) => {
    const { queue: q, index: i, repeat: r, shuffle: sh } = live.current;
    if (!q.length) return;
    if (sh && q.length > 1) { let n = i; while (n === i) n = Math.floor(Math.random() * q.length); goTo(n); return; }
    if (i >= q.length - 1 && auto && r === 'off') { setPlaying(false); return; }
    goTo(i + 1);
  }, [goTo]);

  const prev = useCallback(() => {
    const p = player.current;
    if (p && ready.current && p.getCurrentTime && p.getCurrentTime() > 3) { p.seekTo(0, true); return; }
    goTo(live.current.index - 1);
  }, [goTo]);

  // Create the YouTube player the first time a track is chosen (the visible card exists by then).
  useEffect(() => {
    if (!current || player.current || !hostRef.current) return undefined;
    let dead = false;
    loadYouTube().then((YT) => {
      if (dead || !YT || !hostRef.current || player.current) { if (!YT) setError('Could not load the YouTube player. Check your connection or ad-blocker.'); return; }
      const el = document.createElement('div');
      hostRef.current.appendChild(el);
      player.current = new YT.Player(el, {
        width: '200', height: '113', videoId: live.current.current.youtube_id,
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
        events: {
          onReady: (e) => { ready.current = true; e.target.setVolume(live.current.volume); e.target.playVideo(); },
          onStateChange: (e) => {
            if (e.data === 1) { setPlaying(true); if (live.current.current) remember(live.current.current); }
            else if (e.data === 2) setPlaying(false);
            else if (e.data === 0) {
              if (live.current.repeat === 'one') { e.target.seekTo(0, true); e.target.playVideo(); } else next(true);
            }
          },
          onError: () => {
            setError('This video cannot be played (removed, private or embedding disabled). Skipping.');
            setTimeout(() => { if (live.current.queue.length > 1) next(); }, 1500);
          },
        },
      });
    });
    return () => { dead = true; };
  }, [current, next, remember]);

  // Progress ticker while playing.
  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => {
      const p = player.current;
      if (p && ready.current && p.getCurrentTime) setProgress({ t: p.getCurrentTime() || 0, d: p.getDuration() || 0 });
    }, 500);
    return () => clearInterval(t);
  }, [playing]);

  useEffect(() => () => { if (player.current && player.current.destroy) { try { player.current.destroy(); } catch (e) { /* already gone */ } } player.current = null; ready.current = false; }, []);
  useEffect(() => {
    if (!sleepAt) return undefined;
    const ms = sleepAt - Date.now();
    if (ms <= 0) { if (player.current && ready.current) player.current.pauseVideo(); setSleepAt(0); return undefined; }
    const t = setTimeout(() => { if (player.current && ready.current) player.current.pauseVideo(); setSleepAt(0); }, ms);
    return () => clearTimeout(t);
  }, [sleepAt]);

  const play = useCallback((list, i) => {
    setQueue(list);
    live.current = { ...live.current, queue: list };
    setIndex(i);
    setError('');
    setProgress({ t: 0, d: 0 });
    if (ready.current && player.current) player.current.loadVideoById(list[i].youtube_id);
  }, []);

  const toggle = useCallback(() => {
    const p = player.current;
    if (!p || !ready.current) return;
    if (p.getPlayerState() === 1) p.pauseVideo(); else p.playVideo();
  }, []);

  const seek = useCallback((sec) => { if (player.current && ready.current) { player.current.seekTo(sec, true); setProgress((x) => ({ ...x, t: sec })); } }, []);
  const setVolume = useCallback((v) => { setVolumeState(v); writeJson(VOL_KEY, v); if (player.current && ready.current) player.current.setVolume(v); }, []);
  const close = useCallback(() => {
    if (player.current && player.current.destroy) { try { player.current.destroy(); } catch (e) { /* already gone */ } }
    player.current = null; ready.current = false;
    setPlaying(false); setIndex(-1); setQueue([]); setError('');
  }, []);

  const value = { queue, index, current, playing, progress, volume, repeat, shuffle, error, recent, sleepAt, hostRef, play, toggle, next, prev, seek, setVolume, close,
    setSleep: (mins) => setSleepAt(mins ? Date.now() + mins * 60000 : 0),
    setRepeat: () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')), setShuffle: () => setShuffle((s) => !s) };
  return <RadioCtx.Provider value={value}>{children}</RadioCtx.Provider>;
}

const mmss = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function MiniPlayer() {
  const r = useRadio();
  if (!r.current) return null;
  const { current: c } = r;
  return (
    <section className="bh-mini" aria-label="Bhajan player">
      <div className="bh-mini-video" ref={r.hostRef} />
      <div className="bh-mini-ctl">
        <div className="bh-mini-title" title={c.title}><b>{c.title}</b><span>{c.channel}</span></div>
        <div className="bh-mini-btns">
          <button type="button" aria-label="Previous" onClick={r.prev}>⏮</button>
          <button type="button" className="main" aria-label={r.playing ? 'Pause' : 'Play'} onClick={r.toggle}>{r.playing ? '⏸' : '▶'}</button>
          <button type="button" aria-label="Next" onClick={() => r.next()}>⏭</button>
          <button type="button" aria-label="Shuffle" aria-pressed={r.shuffle} className={r.shuffle ? 'on' : ''} onClick={r.setShuffle}>🔀</button>
          <button type="button" aria-label={`Repeat ${r.repeat}`} className={r.repeat !== 'off' ? 'on' : ''} onClick={r.setRepeat}>{r.repeat === 'one' ? '🔂' : '🔁'}</button>
          <button type="button" aria-label="Close player" onClick={r.close}>✕</button>
        </div>
        <div className="bh-mini-seek">
          <span>{mmss(r.progress.t)}</span>
          <input type="range" min="0" max={Math.max(1, Math.floor(r.progress.d))} value={Math.floor(r.progress.t)} onChange={(e) => r.seek(Number(e.target.value))} aria-label="Seek" />
          <span>{mmss(r.progress.d)}</span>
        </div>
        <label className="bh-mini-vol">🔈<input type="range" min="0" max="100" value={r.volume} onChange={(e) => r.setVolume(Number(e.target.value))} aria-label="Volume" /></label>
        <label className="bh-mini-sleep">Sleep <select value={r.sleepAt ? 'on' : ''} onChange={(e) => r.setSleep(Number(e.target.value))}><option value="">Off</option>{r.sleepAt && <option value="on">Timer on</option>}<option value="10">10 min</option><option value="20">20 min</option><option value="30">30 min</option><option value="60">60 min</option></select></label>
        {r.error && <div className="bh-mini-err" role="alert">{r.error}</div>}
      </div>
    </section>
  );
}
