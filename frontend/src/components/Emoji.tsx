// components/Emoji.tsx
interface EmojiProps {
  type?:
    | 'smile'
    | 'wink'
    | 'surprised'
    | 'tongue'
    | 'star'
    | 'heart'
    | 'crying_smile'
    | 'crying'
    | 'unamused'
    | 'face_in_clouds'
    | 'slight_smile'
    | 'persevere'
    | 'thinking'
    | 'cool'
    | 'star_struck';
  size?: number;
}

export default function Emoji({ type = 'smile', size = 100 }: EmojiProps) {
  switch (type) {
    case 'smile':
      return <Smiley size={size} />;
    case 'wink':
      return <Wink size={size} />;
    case 'surprised':
      return <Surprised size={size} />;
    case 'tongue':
      return <Tongue size={size} />;
    case 'star':
      return <Star size={size} />;
    case 'heart':
      return <Heart size={size} />;
    case 'crying_smile':
      return <CryingSmile size={size} />;
    case 'crying':
      return <Crying size={size} />;
    case 'unamused':
      return <Unamused size={size} />;
    case 'face_in_clouds':
      return <FaceInClouds size={size} />;
    case 'slight_smile':
      return <SlightSmile size={size} />;
    case 'persevere':
      return <Persevere size={size} />;
    case 'thinking':
      return <Thinking size={size} />;
    case 'cool':
      return <Cool size={size} />;
    default:
      return <Smiley size={size} />;
  }
}

/* ---------- Emojis existants (conservés) ---------- */
function Smiley({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      <circle cx="40" cy="48" r="8" fill="#1e1e1e" />
      <circle cx="80" cy="48" r="8" fill="#1e1e1e" />
      <circle cx="43" cy="45" r="3" fill="#ffffff" />
      <circle cx="83" cy="45" r="3" fill="#ffffff" />
      <path d="M35 75 Q60 100 85 75" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Wink({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      <circle cx="40" cy="48" r="8" fill="#1e1e1e" />
      <circle cx="43" cy="45" r="3" fill="#ffffff" />
      <path d="M72 48 Q80 40 88 48" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
      <path d="M35 75 Q60 100 85 75" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Surprised({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      <circle cx="40" cy="45" r="10" fill="#1e1e1e" />
      <circle cx="80" cy="45" r="10" fill="#1e1e1e" />
      <circle cx="43" cy="42" r="3" fill="#ffffff" />
      <circle cx="83" cy="42" r="3" fill="#ffffff" />
      <ellipse cx="60" cy="78" rx="12" ry="15" fill="#1e1e1e" />
      <ellipse cx="60" cy="85" rx="6" ry="5" fill="#ff6b6b" />
    </svg>
  );
}

function Tongue({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      <path d="M32 40 Q40 32 48 40" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
      <path d="M72 40 Q80 32 88 40" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
      <path d="M35 75 Q60 100 85 75" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="60" cy="85" rx="10" ry="7" fill="#ff6b6b" />
    </svg>
  );
}

function Star({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#f9ca24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 17.77 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function Heart({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#ff6b6b" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

/* ---------- Nouveaux emojis ---------- */
function CryingSmile({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      {/* Yeux normaux */}
      <circle cx="38" cy="48" r="7" fill="#1e1e1e" />
      <circle cx="82" cy="48" r="7" fill="#1e1e1e" />
      <circle cx="41" cy="45" r="2.5" fill="#ffffff" />
      <circle cx="85" cy="45" r="2.5" fill="#ffffff" />
      {/* Sourire */}
      <path d="M35 75 Q60 100 85 75" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
      {/* Larme (œil gauche) */}
      <path d="M28 58 Q25 68 30 70 Q33 70 32 62" fill="#4fc3f7" stroke="#0288d1" strokeWidth="2" />
    </svg>
  );
}

function Crying({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      {/* Yeux fermés en arc */}
      <path d="M32 48 Q38 40 44 48" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
      <path d="M76 48 Q82 40 88 48" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
      {/* Bouche ouverte en pleurs */}
      <path d="M40 78 Q60 95 80 78" fill="#1e1e1e" />
      <ellipse cx="60" cy="83" rx="6" ry="4" fill="#ff6b6b" />
      {/* Larmes */}
      <path d="M34 60 Q30 70 36 74 Q39 74 38 66" fill="#4fc3f7" stroke="#0288d1" strokeWidth="2" />
      <path d="M86 60 Q82 70 88 74 Q91 74 90 66" fill="#4fc3f7" stroke="#0288d1" strokeWidth="2" />
    </svg>
  );
}

function Unamused({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      {/* Yeux grands ouverts avec pupilles centrées */}
      <circle cx="40" cy="48" r="8" fill="#1e1e1e" />
      <circle cx="80" cy="48" r="8" fill="#1e1e1e" />
      <circle cx="40" cy="48" r="3" fill="#ffffff" />
      <circle cx="80" cy="48" r="3" fill="#ffffff" />
      {/* Bouche droite légèrement mécontente */}
      <path d="M38 80 L82 80" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function FaceInClouds({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      {/* Visage neutre */}
      <circle cx="60" cy="60" r="50" fill="#f9ca24" stroke="#e2a800" strokeWidth="3" />

      {/* Yeux ronds sans pupille (neutres) */}
      <circle cx="42" cy="52" r="5" fill="#1e1e1e" />
      <circle cx="78" cy="52" r="5" fill="#1e1e1e" />

      {/* Bouche : un simple trait horizontal discret */}
      <line x1="48" y1="72" x2="72" y2="72" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" />

      {/* Nuages légers autour (opacité réduite) */}
      <g opacity="0.8">
        {/* Nuage en haut à gauche */}
        <path
          d="M15 30 Q25 10 45 15 Q60 5 75 18 Q95 10 105 25 Q115 35 100 40 L20 40 Q10 35 15 30 Z"
          fill="#ffffff"
          stroke="#b0bec5"
          strokeWidth="1.5"
        />
        {/* Nuage à droite (cachant un peu le visage) */}
        <path
          d="M80 75 Q90 60 105 62 Q115 55 120 70 Q125 80 115 82 Q105 85 95 80 Q85 82 80 75 Z"
          fill="#ffffff"
          stroke="#b0bec5"
          strokeWidth="1.5"
        />
        {/* Petit nuage en bas à gauche */}
        <path
          d="M10 70 Q20 60 35 65 Q45 58 50 70 Q45 78 35 75 Q25 80 15 72 Z"
          fill="#ffffff"
          stroke="#b0bec5"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}

function SlightSmile({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      <circle cx="40" cy="48" r="7" fill="#1e1e1e" />
      <circle cx="80" cy="48" r="7" fill="#1e1e1e" />
      <circle cx="43" cy="45" r="2.5" fill="#ffffff" />
      <circle cx="83" cy="45" r="2.5" fill="#ffffff" />
      {/* Léger sourire */}
      <path d="M38 78 Q60 90 82 78" fill="none" stroke="#1e1e1e" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Persevere({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      {/* Sourcils froncés */}
      <path d="M30 40 L50 44" fill="none" stroke="#1e1e1e" strokeWidth="4" strokeLinecap="round" />
      <path d="M70 44 L90 40" fill="none" stroke="#1e1e1e" strokeWidth="4" strokeLinecap="round" />
      {/* Yeux serrés */}
      <path d="M34 52 Q40 48 46 52" fill="none" stroke="#1e1e1e" strokeWidth="4" strokeLinecap="round" />
      <path d="M74 52 Q80 48 86 52" fill="none" stroke="#1e1e1e" strokeWidth="4" strokeLinecap="round" />
      {/* Bouche grimaçante */}
      <path d="M40 80 L80 80" fill="none" stroke="#1e1e1e" strokeWidth="4" strokeLinecap="round" />
      <path d="M44 80 L38 86 M76 80 L82 86" fill="none" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Thinking({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      {/* Un œil normal, l'autre plus petit */}
      <circle cx="40" cy="50" r="7" fill="#1e1e1e" />
      <circle cx="43" cy="47" r="2.5" fill="#ffffff" />
      <circle cx="80" cy="50" r="5" fill="#1e1e1e" />
      <circle cx="82" cy="48" r="2" fill="#ffffff" />
      {/* Bouche pensive */}
      <path d="M42 80 Q60 85 78 80" fill="none" stroke="#1e1e1e" strokeWidth="4" strokeLinecap="round" />
      {/* Main sur le menton */}
      <path d="M78 70 Q90 60 95 65 Q98 70 90 78" fill="none" stroke="#1e1e1e" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Cool({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="#f9ca24" stroke="#e2a800" strokeWidth="4" />
      {/* Lunettes de soleil */}
      <rect x="28" y="44" width="24" height="16" rx="4" fill="#1e1e1e" />
      <rect x="68" y="44" width="24" height="16" rx="4" fill="#1e1e1e" />
      <rect x="52" y="46" width="16" height="4" fill="#1e1e1e" />
      {/* Sourire assuré */}
      <path d="M35 78 Q60 96 85 78" fill="none" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

