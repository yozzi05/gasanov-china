import { site, whatsappLink } from "@/content/site";
import manifest from "@/content/images.json";
import { Hanzi, HanziWord } from "./Hanzi";
import { HanziTitle } from "./HanziTitle";
import { InkEdge } from "./InkEdge";
import { InkButton } from "./InkButton";
import { Flap } from "./Flap";
import { Pic } from "./Pic";
import { Seal } from "./Seal";
import { Calculator } from "./Calculator";
import { RateValue } from "./Rate";
import { TelegramIcon, WhatsAppIcon } from "./icons";

type ImageName = keyof typeof manifest;
const INK = "#111010";
const PAPER = "#F4EFE6";
const RED = "#C8102E";
const d = (i: number) => ({ "--d": i }) as React.CSSProperties;
const pad = (n: number) => String(n).padStart(2, "0");

// ── 3. Цифры ────────────────────────────────────────────────────────────────
export function Stats() {
  return (
    <section className="stats grain" aria-label="Цифры">
      <InkEdge color={INK} />
      <ul className="stats__grid">
        {site.stats.map((s, i) => (
          <li key={i} className="stat" data-reveal style={d(i)}>
            <p className="stat__value">
              <span className="sr-only">
                {s.value} {s.label}
              </span>
              <Flap value={s.value} />
            </p>
            <p className="stat__label" aria-hidden>
              {s.label}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── 4. Услуги ───────────────────────────────────────────────────────────────
export function Services() {
  const { services } = site;
  return (
    <section id="services" className="services grain" aria-label="Услуги">
      <InkEdge color={PAPER} variant={1} />
      <div className="wrap">
        <HanziTitle word={services.hanzi} lines={services.title} />
        <ul className="services__grid">
          {services.items.map((s, i) => (
            <li key={i} className="service" data-reveal style={d(i % 3)}>
              <div className="service__head">
                <span className="service__num">{pad(i + 1)}</span>
                <HanziWord word={s.hanzi} className="service__hanzi" charClassName="service__char" />
              </div>
              <h3 className="service__title">{s.title}</h3>
              <p className="service__text">{s.text}</p>
            </li>
          ))}
          <li className="service service--cta" data-reveal style={d(2)}>
            <p className="service__title">Не знаете, с чего начать?</p>
            <p className="service__text">Напишите, что хотите привезти, — подскажу, как лучше.</p>
            <InkButton href={whatsappLink()} variant="paper" external>
              <WhatsAppIcon className="h-5 w-5" />
              Написать Зауру
            </InkButton>
          </li>
        </ul>
      </div>
    </section>
  );
}

// ── 6. Почему мы ────────────────────────────────────────────────────────────
export function Why() {
  const { why } = site;
  return (
    <section className="why grain" aria-label="Почему нам доверяют">
      <InkEdge color={RED} />
      <div className="why__mark" aria-hidden>
        <Hanzi char={why.hanzi[0]} className="w-full" />
      </div>
      <div className="wrap">
        <HanziTitle word={why.hanzi} lines={why.title} strokeColor={PAPER} />
        <ol className="why__grid">
          {why.items.map((w, i) => (
            <li key={i} className="why__item" data-reveal style={d(i % 3)}>
              <span className="why__num">{pad(i + 1)}</span>
              <h3 className="why__title">{w.title}</h3>
              <p className="why__text">{w.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── 8. Калькулятор ──────────────────────────────────────────────────────────
export function CalcSection() {
  const { tariffs, calc } = site;
  const price = (p: readonly [number, number] | readonly number[]) =>
    p[0] === p[1] ? `${String(p[0]).replace(".", ",")} $/кг` : `${String(p[0]).replace(".", ",")}–${String(p[1]).replace(".", ",")} $/кг`;
  return (
    <section id="calc" className="calc-section grain" aria-label="Калькулятор доставки">
      <InkEdge color={PAPER} />
      <div className="wrap calc-section__grid">
        <div>
          <HanziTitle word={calc.hanzi} lines={calc.title} />
          <p className="calc-section__note" data-reveal>
            {tariffs.note}
          </p>
          <ul className="tariffs" data-reveal>
            {tariffs.plans.map((p) => (
              <li key={p.id}>
                <span className="tariffs__name">{p.label}</span>
                <span className="tariffs__days">
                  {p.days[0]}–{p.days[1]} дней
                </span>
                <span className="tariffs__price">{price(p.pricePerKg)}</span>
              </li>
            ))}
            <li>
              <span className="tariffs__name">От {tariffs.individualFromKg} кг</span>
              <span className="tariffs__days">любая категория</span>
              <span className="tariffs__price">индивидуально</span>
            </li>
          </ul>
        </div>
        <div data-reveal style={d(1)}>
          <Calculator />
        </div>
      </div>
    </section>
  );
}

// ── 9. Курс юаня ────────────────────────────────────────────────────────────
export function RateSection() {
  const { rate, contacts, messages } = site;
  return (
    <section className="rate grain" aria-label="Курс юаня">
      <InkEdge color={RED} variant={1} />
      <div className="wrap rate__grid">
        <div>
          <HanziTitle word={rate.hanzi} lines={rate.title} strokeColor={PAPER} />
          <p className="rate__text" data-reveal>
            {rate.text}
          </p>
        </div>
        <div className="rate__side">
          <RateValue />
          <div data-reveal style={d(1)}>
            <InkButton
              href={`${contacts.telegram}?text=${encodeURIComponent(messages.rate)}`}
              variant="paper"
              external
            >
              <TelegramIcon className="h-5 w-5" />
              {rate.cta}
            </InkButton>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 10. О Зауре ─────────────────────────────────────────────────────────────
export function About() {
  const { about, contacts } = site;
  return (
    <section id="about" className="about grain" aria-label="О Зауре">
      <InkEdge color={PAPER} />
      <div className="wrap about__grid">
        <div className="about__photo" data-reveal>
          <Pic name="zaur-about" alt="Заур Гасанов" sizes="(max-width: 1023px) 100vw, 40vw" />
          <Seal className="about__seal" />
        </div>
        <div>
          <h2 className="htitle__text" data-reveal>
            {about.title.join(" ")}
          </h2>
          <div className="about__text" data-reveal style={d(1)}>
            {about.text.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
          <ul className="about__facts" data-reveal style={d(2)}>
            {about.facts.map((f) => (
              <li key={f.label}>
                <b>{f.value}</b>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
          <div className="about__links" data-reveal style={d(3)}>
            <InkButton href={contacts.telegramChannel} variant="ink" external>
              <TelegramIcon className="h-5 w-5" />
              Telegram-канал
            </InkButton>
            <InkButton href={contacts.instagram} variant="ink-outline" external>
              Instagram
            </InkButton>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 11. Отзывы ──────────────────────────────────────────────────────────────
export function Reviews() {
  const { reviews } = site;
  return (
    <section className="reviews grain" aria-label="Отзывы">
      <InkEdge color={INK} variant={1} />
      <div className="wrap">
        <h2 className="htitle__text" data-reveal>
          {reviews.title.map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </h2>
      </div>
      <ul className="reviews__track" tabIndex={0} aria-label="Лента отзывов">
        {reviews.items.map((r, i) => (
          <li key={i} className="review" data-reveal style={d(i)}>
            <Pic name={r.image as ImageName} alt={r.alt} sizes="(max-width: 767px) 78vw, 340px" />
          </li>
        ))}
        {Array.from({ length: reviews.placeholders }, (_, i) => (
          <li key={`p${i}`} className="review review--empty" data-reveal style={d(i + 1)}>
            <Seal className="h-14 w-14 opacity-60" />
            <p>Скриншот переписки появится здесь</p>
          </li>
        ))}
        <li className="review review--more" data-reveal style={d(3)}>
          <p>Больше отзывов и свежих отправок — в Telegram-канале</p>
          <InkButton href={site.contacts.telegramChannel} variant="paper" external>
            <TelegramIcon className="h-5 w-5" />
            Открыть канал
          </InkButton>
        </li>
      </ul>
    </section>
  );
}

// ── 12. Финальный блок ──────────────────────────────────────────────────────
export function Final() {
  const { final, contacts } = site;
  return (
    <section className="final grain" aria-label="Связаться">
      <InkEdge color={RED} />
      <div className="wrap">
        <h2 className="final__title" data-reveal>
          {final.title.map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </h2>
        <p className="final__text" data-reveal style={d(1)}>
          {final.text}
        </p>
        <div className="final__cta" data-reveal style={d(2)}>
          <InkButton href={whatsappLink()} variant="paper" external className="final__btn">
            <WhatsAppIcon className="h-7 w-7" />
            WhatsApp
          </InkButton>
          <InkButton href={contacts.telegram} variant="outline" external className="final__btn">
            <TelegramIcon className="h-7 w-7" />
            Telegram
          </InkButton>
        </div>
      </div>
    </section>
  );
}

// ── 13. Подвал ──────────────────────────────────────────────────────────────
export function Footer() {
  const { contacts, footer } = site;
  return (
    <footer className="footer grain">
      <InkEdge color={INK} variant={1} />
      <div className="wrap">
        <div className="footer__top">
          <a href="#top" className="flex items-center gap-3" aria-label={`${site.name} — наверх`}>
            <Seal className="h-12 w-12" />
            <span className="font-display text-4xl leading-none font-black tracking-[0.04em]">{site.name}</span>
          </a>
          <HanziWord word="货运" className="footer__hanzi" charClassName="h-8 w-8" />
        </div>
        <div className="footer__grid">
          <div>
            <h3>Связаться</h3>
            <p>
              <a href={contacts.phoneHref}>{contacts.phone}</a>
            </p>
            <p>
              <a href={contacts.telegram} target="_blank" rel="noopener noreferrer">
                Telegram {contacts.telegramHandle}
              </a>
            </p>
            <p>
              <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
            </p>
          </div>
          <div>
            <h3>Где мы</h3>
            <p>Офис — {contacts.office}</p>
            <p>Склад — {contacts.warehouse}</p>
          </div>
          <nav aria-label="Разделы сайта">
            <h3>Разделы</h3>
            {site.nav.map((n) => (
              <p key={n.href}>
                <a href={n.href}>{n.label}</a>
              </p>
            ))}
          </nav>
        </div>
        <div className="footer__bottom">
          <p>
            © {new Date().getFullYear()} {site.person} · {site.brand}
          </p>
          <p>
            <a href={footer.policy.href}>{footer.policy.label}</a>
          </p>
          <p>{footer.cookies}</p>
        </div>
      </div>
    </footer>
  );
}
