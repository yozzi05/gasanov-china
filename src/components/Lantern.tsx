import { TELEGRAM_PATH, WHATSAPP_PATH } from "./icons";

// Лаковый фонарик на золотой нити. Это ссылка на мессенджер.
// Качание задаёт HeroFx (ищет [data-lantern-swing]).
export function Lantern({
  kind,
  href,
  label,
}: {
  kind: "wa" | "tg";
  href: string;
  label: string;
}) {
  const id = `lantern-${kind}`;
  return (
    <div className={`lantern lantern--${kind}`} data-lantern>
      <div className="lantern__swing" data-lantern-swing>
        <div className="lantern__string" />
        <a
          className="lantern__link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
        >
          <svg viewBox="0 0 100 190">
            <defs>
              <radialGradient id={id} cx="38%" cy="34%" r="80%">
                <stop offset="0" stopColor="#F0364F" />
                <stop offset="0.55" stopColor="#B80E29" />
                <stop offset="1" stopColor="#7A081A" />
              </radialGradient>
              <clipPath id={`${id}-c`}>
                <ellipse cx="50" cy="66" rx="45" ry="52" />
              </clipPath>
            </defs>
            {/* верхняя крышка */}
            <rect x="34" y="4" width="32" height="12" rx="2" fill="#111010" />
            <path d="M34 15.500h32" stroke="#C9A227" strokeWidth="1.2" />
            {/* тело */}
            <ellipse cx="50" cy="66" rx="45" ry="52" fill={`url(#${id})`} />
            <g clipPath={`url(#${id}-c)`} fill="none" stroke="#C9A227" strokeWidth="0.9" opacity="0.8">
              <ellipse cx="50" cy="66" rx="14" ry="52" />
              <ellipse cx="50" cy="66" rx="30" ry="52" />
              <path d="M50 14v104" />
            </g>
            {/* красный круг-печать со значком */}
            <circle cx="50" cy="66" r="25" fill="#F4EFE6" />
            <g transform="translate(35 51) scale(1.25)" fill="#8E0B20">
              <path d={kind === "wa" ? WHATSAPP_PATH : TELEGRAM_PATH} />
            </g>
            {/* нижняя крышка и кисть */}
            <rect x="36" y="115" width="28" height="10" rx="2" fill="#111010" />
            <path d="M36 115.500h28" stroke="#C9A227" strokeWidth="1.2" />
            <path d="M50 125v14" stroke="#C9A227" strokeWidth="1" />
            <path d="M45 139h10l2 44-3.500-5-3.500 7-3.500-7-3.500 5z" fill="#111010" />
            <path d="M45 144h10" stroke="#C9A227" strokeWidth="1" />
          </svg>
        </a>
      </div>
    </div>
  );
}
