import { site, whatsappLink } from "@/content/site";
import { Lantern } from "./Lantern";
import { Pic } from "./Pic";
import { InkButton } from "./InkButton";
import { Petals } from "./Petals";

// Ширина сцены на экране: она закрывает первый экран целиком (cover)
const SCENE_W = "max(100vw, 178vh)";

// Первый экран - сцена из слоёв (эксперимент hero-scene).
// Разметка статичная (рендерится на сервере), всё движение подключает HeroFx:
// data-mouse - амплитуда смещения слоя в px, data-tree / data-photo / data-lantern - появление.
export function Hero() {
  const { hero } = site;
  return (
    <section id="top" className="hero hero--scene grain" data-hero>
      {/* Дальние слои: стена, фигура, деревья */}
      <div className="scene">
        <div className="scene__wall">
          <div data-mouse="6">
            <Pic name="scene-wall" alt="" sizes={SCENE_W} eager />
          </div>
        </div>

        <div className="scene__zaur">
          <div data-mouse="12">
            <div data-photo>
              <span className="scene__shadow" />
              <Pic
                name="zaur-walk"
                alt="Заур Гасанов, основатель G17"
                sizes={`calc(${SCENE_W} * 0.12)`}
                eager
              />
            </div>
          </div>
        </div>

        <div className="scene__tree scene__tree--left">
          <div data-mouse="24">
            <div data-tree="0% 100%">
              <Pic name="scene-trees-left" alt="" sizes={`calc(${SCENE_W} * 0.54)`} />
            </div>
          </div>
        </div>
        <div className="scene__tree scene__tree--right">
          <div data-mouse="28">
            <div data-tree="100% 100%">
              <Pic name="scene-trees-right" alt="" sizes={`calc(${SCENE_W} * 0.53)`} />
            </div>
          </div>
        </div>
      </div>

      <div className="hero__shade" />
      <div className="hero__topshade" />

      {/* Фонари: левый и правый - ссылки на мессенджеры, средний декоративный */}
      <div className="scene scene--front">
        <div className="scene__lanterns" data-mouse="32">
          <Lantern kind="wa" href={whatsappLink()} label="Написать в WhatsApp" />
          <Lantern kind="mid" />
          <Lantern kind="tg" href={site.contacts.telegram} label="Написать в Telegram" />
        </div>
      </div>

      <div className="hero__petals-layer" data-mouse="40">
        <Petals />
      </div>

      <div className="hero__content">
        <p className="hero__surname" aria-label={site.name}>
          {[...site.name].map((ch, i) => (
            <span key={i} className="hero__letter-mask" aria-hidden>
              <span className="hero__letter" data-letter>
                {ch}
              </span>
            </span>
          ))}
        </p>
        <h1 className="hero__offer">
          {hero.offer.map((line, i) => (
            <span key={i} className="hero__line-mask">
              <span className="hero__line" data-line>
                {i === 0 ? line : <span className="hero__accent">{line}</span>}
              </span>
            </span>
          ))}
        </h1>
        <div className="hero__right grid gap-[18px]">
          <p className="hero__sub" data-fade>
            {hero.sub}
          </p>
          <div className="hero__cta" data-fade>
            <InkButton href={hero.ctaPrimary.href} variant="paper">
              {hero.ctaPrimary.label}
            </InkButton>
            <InkButton href={hero.ctaSecondary.href} variant="outline">
              {hero.ctaSecondary.label}
            </InkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
