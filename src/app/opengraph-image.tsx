import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'The Birdman of Chennai — Sudarson Sah\'s Parakeet Sanctuary';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a3a1a 0%, #2E7D32 40%, #FF8C00 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255,140,0,0.15)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        {/* Bird emoji row */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
          {['🦜', '🦜', '🦜'].map((emoji, i) => (
            <div key={i} style={{ fontSize: '64px' }}>{emoji}</div>
          ))}
        </div>

        {/* Main title */}
        <div
          style={{
            color: '#ffffff',
            fontSize: '64px',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.1,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            maxWidth: '900px',
            padding: '0 40px',
          }}
        >
          Birdman of Chennai
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: '#FFD54F',
            fontSize: '28px',
            marginTop: '16px',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Sudarson Sah · 6,000 Wild Parakeets · Daily at 4:30 PM
        </div>

        {/* Location tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '999px',
            padding: '8px 24px',
            marginTop: '28px',
            color: '#ffffff',
            fontSize: '20px',
          }}
        >
          📍 Chintadripet, Chennai — Free Entry
        </div>
      </div>
    ),
    { ...size }
  );
}
