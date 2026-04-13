import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
        }}
      >
        {/* CPU icon — matches the header logo */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="15" y1="2" x2="15" y2="4" />
          <line x1="9" y1="2" x2="9" y2="4" />
          <line x1="15" y1="20" x2="15" y2="22" />
          <line x1="9" y1="20" x2="9" y2="22" />
          <line x1="2" y1="15" x2="4" y2="15" />
          <line x1="2" y1="9" x2="4" y2="9" />
          <line x1="20" y1="15" x2="22" y2="15" />
          <line x1="20" y1="9" x2="22" y2="9" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
