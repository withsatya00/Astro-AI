import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import ArticleList from './ArticleList.jsx';
import { useLang, pick } from './lang.js';

// Divine Peetha Emblems with Sacred Glyphs & Directional Aura
function PeethaEmblem({ direction, glyph }) {
  const colorMap = {
    South: { grad: 'linear-gradient(135deg, #7A1C28, #164B32)', border: '#E9C36A', glow: 'rgba(233,195,106,0.3)' },
    East: { grad: 'linear-gradient(135deg, #1A365D, #0F213A)', border: '#63B3ED', glow: 'rgba(99,179,237,0.3)' },
    West: { grad: 'linear-gradient(135deg, #7B341E, #431407)', border: '#F6AD55', glow: 'rgba(246,173,85,0.3)' },
    North: { grad: 'linear-gradient(135deg, #234E52, #132A2C)', border: '#81E6D9', glow: 'rgba(129,230,217,0.3)' },
  };
  const theme = colorMap[direction] || colorMap.South;

  return (
    <div style={{
      width: 76,
      height: 76,
      borderRadius: '50%',
      background: theme.grad,
      border: `2px solid ${theme.border}`,
      boxShadow: `0 0 20px ${theme.glow}, inset 0 2px 4px rgba(255,255,255,0.25)`,
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
      position: 'relative'
    }}>
      <span style={{
        fontFamily: 'Georgia, serif',
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFDF5',
        textShadow: '0 2px 4px rgba(0,0,0,0.6)'
      }}>
        {glyph}
      </span>
      <span style={{
        position: 'absolute',
        bottom: -6,
        fontSize: 9,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        background: '#164B32',
        color: '#F8D882',
        border: '1px solid #C49A3A',
        borderRadius: 999,
        padding: '1px 6px'
      }}>
        {direction}
      </span>
    </div>
  );
}

export default function ShankaracharyaPage() {
  const lang = useLang();
  const isHi = lang === 'hi';
  const [data, setData] = useState(null);
  const [expandedPeetha, setExpandedPeetha] = useState(null);

  useEffect(() => {
    api('/vedanta/peethas').then(setData).catch(() => {});
  }, []);

  const glyphMap = {
    South: 'शार',
    East: 'गो',
    West: 'द्वा',
    North: 'ज्यो',
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      {/* Page Title & Breadcrumb */}
      <div className="bh-sec-title" style={{ marginBottom: 12 }}>
        <h1 className="bh-title">
          {isHi ? 'जगद्गुरु आदि शंकराचार्य एवं चतुराम्नाय पीठ' : 'Adi Shankaracharya & The Four Amnaya Peethas'}
        </h1>
      </div>

      {/* Hero Historical Introduction Card */}
      <div className="bh-panel" style={{
        background: 'linear-gradient(135deg, #FFFDF8, #F9F2E3)',
        border: '1.5px solid #C49A3A',
        borderRadius: 20,
        padding: '24px 28px',
        marginBottom: 24,
        boxShadow: '0 8px 24px -12px rgba(62,11,24,0.15)'
      }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #5a1222, #164B32)',
            border: '2px solid #C49A3A',
            display: 'grid',
            placeItems: 'center',
            fontSize: 34,
            color: '#F8D882',
            boxShadow: '0 6px 18px rgba(62,11,24,0.25)',
            flexShrink: 0
          }}>
            🕉️
          </div>
          <div style={{ flex: '1 1 320px' }}>
            <h2 style={{
              margin: '0 0 6px',
              fontSize: 20,
              fontFamily: 'Georgia, serif',
              color: '#164B32'
            }}>
              {isHi ? 'सनातन धर्म के पुनरुद्धारक जगद्गुरु' : 'Jagadguru Adi Shankaracharya (आदि शंकराचार्य)'}
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, color: '#4A2A2F', lineHeight: 1.6 }}>
              {isHi
                ? 'आदि शंकराचार्य जी ने भारतवर्ष की चारों दिशाओं में सनातन धर्म, वैदिक संस्कृति और अद्वैत दर्शन के अक्षुण्ण संरक्षण हेतु 4 आम्नाय पीठों की स्थापना की। प्रत्येक पीठ को एक वेद, एक महावाक्य और अपने एक प्रमुख शिष्य का दायित्व सौंपा।'
                : 'Jagadguru Adi Shankaracharya revived Sanatana Dharma across the Indian subcontinent by establishing Four Amnaya Peethas in the four cardinal directions. Each math is custodian to one Veda, one Mahavakya, and was headed by one of his four foremost enlightened disciples.'}
            </p>
          </div>
        </div>
      </div>

      {/* The 4 Amnaya Peethas Grand Grid */}
      <div className="bh-sec-title">
        <h2 style={{ fontSize: 20, fontFamily: 'Georgia, serif', color: '#164B32' }}>
          {isHi ? 'चतुराम्नाय पीठ — चारों दिशाओं के पावन मठ' : 'The Four Amnaya Peethas'}
        </h2>
      </div>

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
          {data.peethas.map((p) => {
            const isExp = expandedPeetha === p.name || expandedPeetha === p.id;
            const glyph = glyphMap[p.direction] || 'ॐ';

            return (
              <div
                key={p.name}
                className="bh-panel"
                style={{
                  margin: 0,
                  borderRadius: 18,
                  border: isExp ? '2px solid #C49A3A' : '1px solid #DDEBD5',
                  background: '#FFFDF5',
                  padding: 22,
                  boxShadow: isExp ? '0 12px 30px rgba(62,11,24,0.14)' : '0 4px 14px rgba(62,11,24,0.04)',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Peetha Header with Emblem */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
                    <PeethaEmblem direction={p.direction} glyph={glyph} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#B3832B',
                        letterSpacing: '0.06em'
                      }}>
                        {isHi ? (p.direction_hi || p.direction) : `${p.direction} Peetha`}
                      </span>
                      <h3 style={{
                        margin: '2px 0 2px',
                        fontSize: 17,
                        fontFamily: 'Georgia, serif',
                        color: '#164B32',
                        lineHeight: 1.3
                      }}>
                        {isHi ? (p.name_hi || p.name) : p.name}
                      </h3>
                      <p className="bh-small" style={{ margin: 0, color: '#7C6758' }}>
                        📍 {isHi ? (p.place_hi || p.place) : p.place}, {isHi ? (p.state_hi || p.state) : p.state}
                      </p>
                    </div>
                  </div>

                  {/* Sacred Mahavakya Banner */}
                  <div style={{
                    background: '#F2F5EA',
                    border: '1px solid #E6D2B5',
                    borderRadius: 12,
                    padding: '10px 14px',
                    margin: '12px 0',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: 11, color: '#7C6758', display: 'block', marginBottom: 2 }}>
                      {isHi ? 'पावन महावाक्य' : 'Sacred Mahavakya'} · ({p.veda})
                    </span>
                    <strong style={{
                      fontSize: 16,
                      color: '#164B32',
                      fontFamily: "'Noto Serif Devanagari', Georgia, serif",
                      display: 'block'
                    }}>
                      "{isHi ? (p.mahavakya_hi || p.mahavakya) : p.mahavakya}"
                    </strong>
                    <span className="bh-small" style={{ color: '#8C5800', fontSize: 11.5, marginTop: 2, display: 'block' }}>
                      {p.mahavakya_source}
                    </span>
                  </div>

                  {/* Core Details List */}
                  <div style={{ fontSize: 13, color: '#4A2A2F', lineHeight: 1.55, marginTop: 10 }}>
                    <div style={{ marginBottom: 6 }}>
                      <b>{isHi ? 'प्रथम आचार्य:' : 'First Acharya:'}</b>{' '}
                      <span style={{ color: '#164B32', fontWeight: 600 }}>
                        {isHi ? (p.first_acharya_hi || p.first_acharya) : p.first_acharya}
                      </span>
                    </div>
                    {p.deities && (
                      <div style={{ marginBottom: 6 }}>
                        <b>{isHi ? 'अधिष्ठाता देव/देवी:' : 'Presiding Deities:'}</b>{' '}
                        <span>{isHi ? (p.deities_hi || p.deities) : p.deities}</span>
                      </div>
                    )}
                    {p.tirtha && (
                      <div style={{ marginBottom: 6 }}>
                        <b>{isHi ? 'पवित्र तीर्थ:' : 'Holy Tirtha:'}</b>{' '}
                        <span>{p.tirtha}</span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Full Biography & Significance */}
                  {isExp && (
                    <div style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: '1px dashed #E2D2B8',
                      fontSize: 12.5,
                      color: '#4A2A2F',
                      lineHeight: 1.65,
                      animation: 'fadeIn 0.2s ease-in'
                    }}>
                      <div style={{ marginBottom: 10 }}>
                        <strong style={{ color: '#164B32', display: 'block', marginBottom: 3 }}>
                          {isHi ? 'प्रथम आचार्य का परिचय:' : 'First Acharya History:'}
                        </strong>
                        <p style={{ margin: 0 }}>
                          {isHi ? (p.first_acharya_desc_hi || p.first_acharya_desc) : p.first_acharya_desc}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#164B32', display: 'block', marginBottom: 3 }}>
                          {isHi ? 'पीठ का महत्व एवं इतिहास:' : 'Peetha Significance & Heritage:'}
                        </strong>
                        <p style={{ margin: 0 }}>
                          {isHi ? (p.significance_hi || p.significance) : p.significance}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Learn More Toggle Button */}
                <button
                  type="button"
                  onClick={() => setExpandedPeetha(isExp ? null : (p.id || p.name))}
                  className="bh-btn bh-btn-ghost"
                  style={{
                    width: '100%',
                    marginTop: 14,
                    minHeight: 38,
                    fontSize: 12,
                    borderRadius: 10,
                    border: '1px solid #C49A3A',
                    background: isExp ? '#F2F5EA' : '#FFFDF5',
                    color: '#164B32',
                    fontWeight: 700
                  }}
                >
                  {isExp
                    ? (isHi ? '▲ संक्षिप्त करें' : '▲ Show Less')
                    : (isHi ? '▼ संपूर्ण इतिहास व परिचय पढ़ें' : '▼ Read Full Biography & History')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {data && (
        <p className="bh-small" style={{ color: '#7C6758', marginTop: -12, marginBottom: 28 }}>
          {data.note}
        </p>
      )}

      {/* Articles & Q&A */}
      <div className="bh-sec-title">
        <h2 style={{ fontSize: 18, fontFamily: 'Georgia, serif', color: '#164B32' }}>
          {isHi ? 'जीवन वृत्त एवं वैदिक परम्परा' : 'Life and Tradition'}
        </h2>
      </div>
      <ArticleList section="shankaracharya" kind="article" />

      <div className="bh-sec-title" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontFamily: 'Georgia, serif', color: '#164B32' }}>
          {isHi ? 'जिज्ञासा एवं प्रश्नोत्तर' : 'Questions & Answers'}
        </h2>
      </div>
      <ArticleList section="shankaracharya" kind="qa" />

      {/* Navigation link to Advaita Vedanta */}
      <div className="bh-row" style={{ marginTop: 28, justifyContent: 'center' }}>
        <Link className="bh-btn bh-btn-gold" to="/bhakti/vedanta" style={{ minWidth: 240 }}>
          {isHi ? 'अद्वैत वेदांत दर्शन समझें →' : 'Learn Advaita Vedanta Philosophy →'}
        </Link>
      </div>
    </div>
  );
}
