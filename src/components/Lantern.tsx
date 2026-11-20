import { Pic } from "./Pic";
import { TelegramIcon, WhatsAppIcon } from "./icons";

// Фонарь на золотой нити. Левый (wa) и правый (tg) - ссылки на мессенджеры
// со значком на бумажном круге, средний (mid) - декоративный.
// Качание задаёт HeroFx (ищет [data-lantern-swing]).
export function Lantern({
  kind,
  href,
  label,
}: {
  kind: "wa" | "tg" | "mid";
  href?: string;
  label?: string;
}) {
  const pic = (
    <Pic
      name={kind === "mid" ? "scene-lantern-2" : "scene-lantern"}
      alt=""
      sizes="(max-width: 767px) 58px, 96px"
    />
  );
  return (
    <div className={`lantern lantern--${kind}`} data-lantern aria-hidden={href ? undefined : true}>
      <div className="lantern__swing" data-lantern-swing>
        <div className="lantern__string" />
        {href ? (
          <a
            className="lantern__link"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
          >
            {pic}
            <span className="lantern__badge">
              {kind === "wa" ? <WhatsAppIcon /> : <TelegramIcon />}
            </span>
          </a>
        ) : (
          <div className="lantern__link">{pic}</div>
        )}
      </div>
    </div>
  );
}
