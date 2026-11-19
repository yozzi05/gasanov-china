import { site, whatsappLink } from "@/content/site";
import { Hanzi, HanziWord } from "./Hanzi";
import { InkTree } from "./InkTree";
import { Lantern } from "./Lantern";
import { Pic } from "./Pic";
import { InkButton } from "./InkButton";
import { Petals } from "./Petals";

// Первый экран. Разметка статичная (рендерится на сервере),
// всё движение подключает HeroFx.
export function Hero() {
  const { hero } = site;
  return (
    <section id="top" className="hero grain" data-hero>
      <div className="hero__bg" />

      <div className="hero__watermark" data-scroll="-10">
        <Hanzi char={hero.hanzi[1]} className="w-full" />
      </div>

      <div className="hero__tree" data-scroll="-14">
        <div data-mouse="14">
          <div data-tree>
            <InkTree />
          </div>
        </div>
      </div>

      <div className="hero__name" aria-hidden data-scroll="26">
        <div data-mouse="6">
          {[...site.name].map((ch, i) => (
            <span key={i} className="hero__letter-mask">
              <span className="hero__letter" data-letter>
                {ch}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="hero__tree hero__tree--front" data-scroll="-20">
        <div data-mouse="20">
          <div data-tree>
            <InkTree layer="front" />
          </div>
        </div>
      </div>

      <div className="hero__photo" data-scroll="9">
        <div data-mouse="-12">
          <div className="h-full" data-photo>
            <Pic
              name="zaur-cutout"
              alt="Заур Гасанов, основатель G17"
              sizes="(max-width: 767px) 86vw, 44vw"
              eager
            />
          </div>
        </div>
      </div>

      <div className="hero__shade" />
      <Petals />

      <Lantern kind="wa" href={whatsappLink()} label="Написать в WhatsApp" />
      <Lantern kind="tg" href={site.contacts.telegram} label="Написать в Telegram" />

      <div className="hero__side" aria-hidden data-fade>
        <HanziWord word={hero.hanzi} className="flex flex-col gap-1" charClassName="h-7 w-7" />
        <span className="hero__side-line" />
        <span className="hero__side-caption">{hero.hanziCaption}</span>
      </div>

      <div className="hero__content">
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
