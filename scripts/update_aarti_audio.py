with open('website/frontend/src/pages/BhaktiPage/AartiDetail.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      {(c.embeds || []).map((e) => (
        <div key={e.id} className="bh-panel" style={{ marginBottom: 16 }}>
          {/* YouTube's own player, kept visible as its embedding rules require; nothing is downloaded. */}
          <div className="bh-embed">
            <iframe src={`https://www.youtube-nocookie.com/embed/${e.youtube_id}?rel=0`} title={e.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          </div>
          <p className="bh-small" style={{ margin: '8px 0 0' }}>{e.title} · {e.channel}</p>
        </div>
      ))}"""

replacement = """      {(c.embeds || []).map((e) => (
        <DevotionalAudioEmbed key={e.id} embed={e} lang={lang} />
      ))}"""

embed_component = """function DevotionalAudioEmbed({ embed: e, lang }) {
  const [showVideo, setShowVideo] = useState(false);
  const isHi = lang === 'hi';
  return (
    <div className="bh-panel" style={{ marginBottom: 16, background: '#FFFDF9', border: '1px solid #E8D7BA', borderRadius: 16, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'radial-gradient(circle, #5a1222, #3E0B18)',
            border: '1.5px solid #D4AF37',
            display: 'grid', placeItems: 'center', fontSize: 20, color: '#F8D882',
            boxShadow: '0 4px 12px rgba(62,11,24,0.18)'
          }}>
            🪔
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 14, color: '#3E0B18', fontFamily: 'Georgia, serif' }}>{e.title}</strong>
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D'
              }}>
                🎧 {isHi ? 'भक्ति ऑडियो मोड' : 'Audio Mode'}
              </span>
            </div>
            <p className="bh-small" style={{ margin: '2px 0 0', color: '#8C4A28' }}>
              {e.channel} · {isHi ? 'पाठ के साथ शांतिपूर्वक पावन श्रवण करें' : 'Peaceful audio listening while reading text'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowVideo(!showVideo)}
          className="bh-btn bh-btn-ghost"
          style={{ minHeight: 36, padding: '0 12px', fontSize: 12, borderRadius: 999 }}
        >
          {showVideo ? (isHi ? '🎧 केवल ऑडियो मोड' : '🎧 Audio Only') : (isHi ? '🎬 वीडियो दिखाएं' : '🎬 Show Video')}
        </button>
      </div>

      <div style={showVideo ? { marginTop: 12 } : { height: 70, overflow: 'hidden', marginTop: 10, borderRadius: 10, border: '1px solid #E8D7BA' }}>
        <div className={showVideo ? 'bh-embed' : undefined} style={showVideo ? undefined : { height: '100%' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${e.youtube_id}?rel=0&playsinline=1`}
            title={e.title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={showVideo ? {} : { width: '100%', height: '100%', border: 'none' }}
            allowFullScreen={showVideo}
          />
        </div>
      </div>
    </div>
  );
}

"""

assert target in content, "target not found in AartiDetail.jsx"
content = content.replace(target, replacement)
# insert DevotionalAudioEmbed component before export default function AartiDetail
insert_point = "export default function AartiDetail()"
assert insert_point in content, "insert_point not found"
content = content.replace(insert_point, embed_component + insert_point)

with open('website/frontend/src/pages/BhaktiPage/AartiDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated AartiDetail.jsx with Audio-First mode successfully!")
