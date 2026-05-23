import { Sparkles } from "lucide-react";

function KkumdoriCharacter() {
  return (
    <svg
      viewBox="0 0 200 240"
      xmlns="http://www.w3.org/2000/svg"
      className="h-48 w-48 drop-shadow-md"
      aria-hidden
    >
      <defs>
        <radialGradient id="kkBody" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff3a3" />
          <stop offset="55%" stopColor="#ffd84d" />
          <stop offset="100%" stopColor="#f5b400" />
        </radialGradient>
        <linearGradient id="kkBasket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c97f3a" />
          <stop offset="100%" stopColor="#8a4a16" />
        </linearGradient>
      </defs>

      {/* 안테나 + 별 */}
      <line x1="100" y1="48" x2="100" y2="18" stroke="#3a78d6" strokeWidth="3" strokeLinecap="round" />
      <g className="animate-star-twinkle" style={{ transformBox: "fill-box", transformOrigin: "100px 10px" }}>
        <polygon
          points="100,2 104,12 115,13 106,20 109,31 100,25 91,31 94,20 85,13 96,12"
          fill="#3a78d6"
        />
      </g>

      {/* 토성 고리 (몸 뒤) */}
      <ellipse
        cx="100"
        cy="115"
        rx="78"
        ry="14"
        fill="none"
        stroke="#3a78d6"
        strokeWidth="3.5"
        strokeLinecap="round"
        transform="rotate(-14 100 115)"
        opacity="0.9"
      />

      {/* 몸 */}
      <ellipse cx="100" cy="115" rx="58" ry="62" fill="url(#kkBody)" stroke="#d99700" strokeWidth="2" />

      {/* 토성 고리 (몸 앞 — 가려진 느낌) */}
      <path
        d="M 30 122 Q 65 152 100 150 Q 135 148 170 108"
        fill="none"
        stroke="#3a78d6"
        strokeWidth="3.5"
        strokeLinecap="round"
        transform="rotate(-14 100 115)"
        opacity="0.9"
      />

      {/* 볼터치 */}
      <ellipse cx="68" cy="125" rx="9" ry="6" fill="#ff8d8d" opacity="0.55" />
      <ellipse cx="132" cy="125" rx="9" ry="6" fill="#ff8d8d" opacity="0.55" />

      {/* 눈 */}
      <ellipse cx="83" cy="105" rx="4.5" ry="6.5" fill="#1f1408" />
      <ellipse cx="117" cy="105" rx="4.5" ry="6.5" fill="#1f1408" />
      <circle cx="84.5" cy="103" r="1.3" fill="#fff" />
      <circle cx="118.5" cy="103" r="1.3" fill="#fff" />

      {/* 입 (반달 미소) */}
      <path
        d="M 84 128 Q 100 144 116 128"
        stroke="#1f1408"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* 다리 */}
      <ellipse cx="82" cy="185" rx="13" ry="9" fill="#f5b400" stroke="#d99700" strokeWidth="1.5" />
      <ellipse cx="118" cy="185" rx="13" ry="9" fill="#f5b400" stroke="#d99700" strokeWidth="1.5" />

      {/* 오른팔 — 바구니 잡음 */}
      <path
        d="M 148 130 Q 162 138 168 158"
        stroke="#d99700"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="168" cy="160" rx="9" ry="9" fill="#f5b400" stroke="#d99700" strokeWidth="1.5" />

      {/* 장바구니 */}
      <g transform="translate(138 158)">
        <path d="M 0 8 L 60 8 L 54 38 L 6 38 Z" fill="url(#kkBasket)" stroke="#5a2e0a" strokeWidth="2" />
        {/* 손잡이 */}
        <path
          d="M 8 8 Q 30 -12 52 8"
          stroke="#5a2e0a"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* 가로 짜임 */}
        <line x1="3" y1="18" x2="57" y2="18" stroke="#5a2e0a" strokeWidth="0.8" opacity="0.5" />
        <line x1="4" y1="28" x2="56" y2="28" stroke="#5a2e0a" strokeWidth="0.8" opacity="0.5" />

        {/* 바구니 안 아이템들 — 순차로 깜빡 */}
        <g className="animate-basket-pop" style={{ animationDelay: "0s" }}>
          <circle cx="15" cy="5" r="6" fill="#e3604f" stroke="#8a2a1c" strokeWidth="1" />
        </g>
        <g className="animate-basket-pop" style={{ animationDelay: "0.45s" }}>
          <ellipse cx="30" cy="3" rx="7" ry="5" fill="#7cb342" stroke="#3b6914" strokeWidth="1" />
          <path d="M 30 -2 L 30 -7" stroke="#3b6914" strokeWidth="1.5" strokeLinecap="round" />
        </g>
        <g className="animate-basket-pop" style={{ animationDelay: "0.9s" }}>
          <rect x="40" y="-2" width="12" height="10" rx="1.5" fill="#f0d68a" stroke="#a07a2a" strokeWidth="1" />
          <line x1="40" y1="2" x2="52" y2="2" stroke="#a07a2a" strokeWidth="0.7" />
        </g>
      </g>
    </svg>
  );
}

function MarketStall({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="flex h-12 w-20 items-end justify-center rounded-t-lg border border-b-0 border-bark/20 bg-cream text-2xl shadow-sm">
        {emoji}
      </div>
      <div className="h-1 w-24 rounded-full bg-bark/30" />
      <span className="text-[10px] font-medium text-bark/55">{label}</span>
    </div>
  );
}

export default function RecommendLoader() {
  const stalls = [
    { emoji: "🍯", label: "꿀 가게" },
    { emoji: "🍵", label: "차 가게" },
    { emoji: "🥬", label: "나물전" },
    { emoji: "🍡", label: "떡집" },
    { emoji: "🐟", label: "젓갈집" },
    { emoji: "🍶", label: "장류집" },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-maple/15 bg-cream/40 px-6 py-10">
      {/* 상단 뱃지 */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-bold text-maple shadow-sm">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          꿈돌이가 시장에서 장보는 중…
        </span>
      </div>

      {/* 시장 무대 */}
      <div className="relative mx-auto mt-6 h-56 max-w-3xl">
        {/* 좌판 — 좌우로 흘러감 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 overflow-hidden">
          <div className="flex w-[200%] gap-8 opacity-70 animate-market-scroll">
            {[...stalls, ...stalls].map((s, i) => (
              <MarketStall key={i} emoji={s.emoji} label={s.label} />
            ))}
          </div>
        </div>

        {/* 바닥 라인 */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-bark/15" />

        {/* 꿈돌이 — 좌우로 걸어다님 + 위아래 통통 */}
        <div className="absolute inset-x-0 bottom-2 flex justify-center">
          <div className="animate-kkumdori-walk">
            <div className="animate-kkumdori-bob">
              <KkumdoriCharacter />
            </div>
          </div>
        </div>
      </div>

      {/* 캡션 */}
      <p className="mt-4 text-center text-sm text-bark/70">
        한 상에 어울리는 가게를 들르고 있어요. 잠시만 기다려 주세요.
      </p>

      {/* 진행 표시 — 3가지 한 상 */}
      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-bark/60">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-dot-breath inline-flex h-2.5 w-2.5 rounded-full bg-maple"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}
        <span className="ml-2">3가지 한 상 차리는 중</span>
      </div>
    </div>
  );
}
