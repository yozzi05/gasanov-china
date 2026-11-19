import { HanziGlyph } from "./Hanzi";

// Стилизованная карта Фошань → Москва: сетка координат, «горизонтали» тушью
// и линия маршрута. Точки этапов и контейнер расставляет RouteFx по длине линии.

export const ROUTE_PATH =
  "M655 708C640 678 614 656 586 640C540 614 498 588 455 540C395 472 402 382 332 322C292 288 252 248 216 216C176 180 118 196 100 250C94 269 93 288 95 306";

// Замкнутая «горизонталь»: неровное кольцо вокруг центра
function contour(cx: number, cy: number, r: number, seed: number) {
  const pts: string[] = [];
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k = 1 + 0.16 * Math.sin(a * 3 + seed) + 0.09 * Math.sin(a * 5 + seed * 2.3);
    const x = cx + Math.cos(a) * r * k * 1.25;
    const y = cy + Math.sin(a) * r * k * 0.85;
    pts.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join("") + "Z";
}

const CONTOURS = [
  ...[40, 78, 120, 166, 216].map((r, i) => contour(610, 520, r, 1 + i * 0.35)),
  ...[34, 70, 110, 154].map((r, i) => contour(250, 330, r, 4 + i * 0.4)),
  ...[30, 62, 98].map((r, i) => contour(640, 150, r, 7 + i * 0.5)),
].join("");

// Куда ставить номер этапа относительно точки, чтобы он не ложился на линию
const NUM_POS: [number, number][] = [
  [-20, 34],
  [-20, 34],
  [-20, 34],
  [-20, 34],
  [-8, -24],
  [-30, 10],
];

export function RouteMap({ steps }: { steps: number }) {
  return (
    <svg viewBox="0 0 800 800" className="route-map" aria-hidden>
      <defs>
        <filter id="route-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        </filter>
      </defs>

      {/* сетка координат */}
      <g stroke="#111010" strokeOpacity="0.07" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${i * 100} 0V800M0 ${i * 100}H800`} />
        ))}
      </g>
      <path d={CONTOURS} fill="none" stroke="#111010" strokeOpacity="0.1" strokeWidth="1" />
      <rect x="0.5" y="0.5" width="799" height="799" fill="none" stroke="#111010" strokeOpacity="0.25" />

      {/* города */}
      <g fill="#111010">
        <g className="route-map__city">
          <text x="640" y="606">ФОШАНЬ</text>
          <text x="640" y="626" className="route-map__coord">23°01′ с. ш. · 113°07′ в. д.</text>
          <HanziGlyph char="佛" x={640} y={540} size={34} />
          <HanziGlyph char="山" x={676} y={540} size={34} />
        </g>
        <g className="route-map__city">
          <text x="262" y="182">МОСКВА</text>
          <text x="262" y="202" className="route-map__coord">55°45′ с. ш. · 37°37′ в. д.</text>
          <HanziGlyph char="莫" x={262} y={116} size={34} />
          <HanziGlyph char="斯" x={298} y={116} size={34} />
          <HanziGlyph char="科" x={334} y={116} size={34} />
        </g>
      </g>

      {/* компас */}
      <g transform="translate(86 700)" fill="none" stroke="#111010" strokeOpacity="0.55">
        <circle r="30" />
        <path d="M0-40V40M-40 0H40" strokeOpacity="0.5" />
        <path d="M0-30 7 0 0 30-7 0Z" fill="#C8102E" stroke="none" />
        <text y="-48" textAnchor="middle" className="route-map__coord" fill="#111010" stroke="none">
          С
        </text>
      </g>

      {/* маршрут: пунктир-подсказка и линия тушью */}
      <path d={ROUTE_PATH} fill="none" stroke="#111010" strokeOpacity="0.28" strokeWidth="1.5" strokeDasharray="2 9" strokeLinecap="round" />
      <g className="route-map__ink" fill="none" stroke="#111010" strokeLinecap="round">
        <path data-ink d={ROUTE_PATH} strokeWidth="7" />
      </g>

      {/* точки этапов */}
      {Array.from({ length: steps }, (_, i) => (
        <g key={i} data-node className="route-map__node">
          <circle r="13" fill="#F4EFE6" stroke="#111010" strokeWidth="2" />
          <circle r="7.5" fill="#C8102E" className="route-map__dot" />
          <circle r="22" fill="none" stroke="#C8102E" strokeWidth="1.5" className="route-map__ring" />
          <text x={NUM_POS[i]?.[0] ?? -20} y={NUM_POS[i]?.[1] ?? 32} textAnchor="end" className="route-map__num">
            {String(i + 1).padStart(2, "0")}
          </text>
        </g>
      ))}

      {/* контейнер */}
      <g data-box className="route-map__box">
        <g transform="translate(-23 -34)">
          <rect width="46" height="22" rx="2" fill="#C8102E" stroke="#111010" strokeWidth="2" />
          <path d="M8 3v16M15.500 3v16M23 3v16M30.500 3v16M38 3v16" stroke="#111010" strokeOpacity="0.45" strokeWidth="1.5" />
          <path d="M23 22v6" stroke="#111010" strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}
