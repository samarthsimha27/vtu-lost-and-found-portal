import React, { useState } from 'react';
import { IllustrationType } from '../types';

interface ItemIllustrationProps {
  type: IllustrationType;
  imageUrl?: string;
  alt: string;
  className?: string;
}

export const ItemIllustration: React.FC<ItemIllustrationProps> = ({
  type,
  imageUrl,
  alt,
  className = 'h-48 w-full'
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (imageUrl && !imgFailed) {
    return (
      <div className={`relative overflow-hidden bg-[#F3EFE9] ${className}`}>
        <img
          src={imageUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#F5F1EA] flex items-center justify-center ${className}`}
      role="img"
      aria-label={alt}
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.35]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`grid-${type}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#E2DBD0" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${type})`} />
      </svg>

      {type === 'id_card' && (
        <svg viewBox="0 0 180 120" className="relative z-10 w-36 h-28 drop-shadow-xs">
          <path
            d="M72 0 L84 28 M108 0 L96 28"
            stroke="#146B32"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect x="82" y="24" width="16" height="8" rx="2" fill="#9E9589" />
          <rect
            x="38"
            y="30"
            width="104"
            height="72"
            rx="6"
            fill="#FFFFFF"
            stroke="#D6CFC3"
            strokeWidth="1.5"
          />
          <path d="M39 36 a5 5 0 0 1 5 -5 h92 a5 5 0 0 1 5 5 v10 h-102 z" fill="#DF6A18" />
          <rect x="48" y="54" width="24" height="28" rx="3" fill="#EDF6F0" stroke="#146B32" strokeWidth="1.2" />
          <circle cx="60" cy="64" r="5" fill="#146B32" opacity="0.75" />
          <path d="M52 78 c2-5 14-5 16 0" fill="#146B32" opacity="0.75" />
          <rect x="80" y="56" width="48" height="5" rx="2" fill="#191816" opacity="0.8" />
          <rect x="80" y="66" width="36" height="4" rx="2" fill="#DF6A18" opacity="0.85" />
          <rect x="80" y="75" width="42" height="3.5" rx="1.5" fill="#9E9589" />
          <rect x="48" y="90" width="84" height="3" rx="1.5" fill="#146B32" opacity="0.35" />
        </svg>
      )}

      {type === 'calculator' && (
        <svg viewBox="0 0 160 130" className="relative z-10 w-32 h-28 drop-shadow-xs">
          <rect
            x="46"
            y="14"
            width="68"
            height="102"
            rx="8"
            fill="#262523"
            stroke="#191816"
            strokeWidth="1.5"
          />
          <rect x="54" y="24" width="52" height="22" rx="3" fill="#DCE8DF" />
          <text x="99" y="39" textAnchor="end" fontSize="9" fontFamily="monospace" fill="#146B32" fontWeight="bold">
            ∫dx=991
          </text>
          <rect x="84" y="17" width="18" height="4" rx="1" fill="#5C4433" />
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => {
              const isAccent = row === 0 && col === 3;
              return (
                <rect
                  key={`${row}-${col}`}
                  x={54 + col * 13.5}
                  y={55 + row * 13}
                  width="10.5"
                  height="8.5"
                  rx="2"
                  fill={isAccent ? '#DF6A18' : row === 0 ? '#464440' : '#F5F2EB'}
                />
              );
            })
          )}
        </svg>
      )}

      {type === 'notebook' && (
        <svg viewBox="0 0 170 125" className="relative z-10 w-36 h-28 drop-shadow-xs">
          <rect
            x="46"
            y="16"
            width="82"
            height="94"
            rx="4"
            fill="#FFFFFF"
            stroke="#CFC7B8"
            strokeWidth="1.5"
          />
          <rect x="46" y="16" width="12" height="94" fill="#146B32" />
          {[26, 38, 50, 62, 74, 86, 98].map((y) => (
            <path
              key={y}
              d={`M41 ${y} h9`}
              stroke="#DF6A18"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
          <path
            d="M68 44 h44 M68 54 h32"
            stroke="#191816"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M68 82 Q 84 82, 92 72 T 114 68"
            fill="none"
            stroke="#DF6A18"
            strokeWidth="2"
          />
          <path d="M68 64 v26 h46" fill="none" stroke="#9E9589" strokeWidth="1.2" />
        </svg>
      )}

      {type === 'keys' && (
        <svg viewBox="0 0 170 120" className="relative z-10 w-36 h-28 drop-shadow-xs">
          <circle cx="74" cy="46" r="16" fill="none" stroke="#DF6A18" strokeWidth="3.5" />
          <rect
            x="40"
            y="54"
            width="24"
            height="36"
            rx="6"
            transform="rotate(-14 52 72)"
            fill="#B8520D"
          />
          <circle cx="52" cy="72" r="5" fill="#FDF3EB" opacity="0.7" />
          <g transform="rotate(24 84 54)">
            <circle cx="92" cy="54" r="9" fill="#FFFFFF" stroke="#625D55" strokeWidth="2.5" />
            <path
              d="M101 54 h34 v7 h-5 v-4 h-5 v5 h-6 v-5 h-18"
              fill="#8E877D"
              stroke="#625D55"
              strokeWidth="1.2"
            />
          </g>
          <g transform="rotate(52 80 58)">
            <circle cx="88" cy="60" r="7" fill="#FFFFFF" stroke="#146B32" strokeWidth="2.2" />
            <path d="M95 60 h26 v5 h-5 v-3 h-5 v4 h-16" fill="#146B32" opacity="0.8" />
          </g>
        </svg>
      )}

      {type === 'electronics' && (
        <svg viewBox="0 0 170 120" className="relative z-10 w-36 h-28 drop-shadow-xs">
          <rect
            x="48"
            y="28"
            width="74"
            height="64"
            rx="24"
            fill="#232220"
            stroke="#191816"
            strokeWidth="1.5"
          />
          <path d="M49 56 h72" stroke="#3F3D39" strokeWidth="1.5" />
          <circle cx="85" cy="68" r="2.5" fill="#146B32" />
          <circle cx="73" cy="42" r="8" fill="#DF6A18" opacity="0.9" />
          <rect x="70" y="46" width="6" height="10" rx="3" fill="#DF6A18" />
        </svg>
      )}

      {type === 'drafter' && (
        <svg viewBox="0 0 170 120" className="relative z-10 w-36 h-28 drop-shadow-xs">
          <rect x="38" y="24" width="22" height="18" rx="3" fill="#146B32" />
          <line x1="56" y1="30" x2="104" y2="62" stroke="#625D55" strokeWidth="3" />
          <line x1="50" y1="38" x2="98" y2="70" stroke="#625D55" strokeWidth="3" />
          <circle cx="102" cy="66" r="11" fill="#DF6A18" />
          <circle cx="102" cy="66" r="4" fill="#FFFFFF" />
          <rect x="102" y="62" width="44" height="9" rx="1.5" fill="#FFFFFF" stroke="#9E9589" strokeWidth="1.2" />
          <rect x="97" y="66" width="9" height="38" rx="1.5" fill="#FFFFFF" stroke="#9E9589" strokeWidth="1.2" />
        </svg>
      )}

      {type === 'watch' && (
        <svg viewBox="0 0 170 120" className="relative z-10 w-36 h-28 drop-shadow-xs">
          <rect x="74" y="14" width="22" height="92" rx="4" fill="#8C4A1C" />
          <circle cx="85" cy="60" r="24" fill="#FFFFFF" stroke="#CFC7B8" strokeWidth="3" />
          <circle cx="85" cy="60" r="20" fill="#FAF8F5" stroke="#DF6A18" strokeWidth="1" />
          <line x1="85" y1="60" x2="85" y2="46" stroke="#191816" strokeWidth="2" strokeLinecap="round" />
          <line x1="85" y1="60" x2="96" y2="64" stroke="#146B32" strokeWidth="2" strokeLinecap="round" />
          <circle cx="85" cy="60" r="2.2" fill="#DF6A18" />
        </svg>
      )}
    </div>
  );
};
