"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { site, whatsappLink } from "@/content/site";
import { FACT_LABELS, caseAnchor, caseMessage, cases, type CaseItem, type CaseMedia } from "@/content/cases";
import manifest from "@/content/images.json";
import { BASE_PATH } from "@/lib/basePath";
import { getLenis } from "@/lib/lenis";
import { InkButton } from "./InkButton";
import { Pic } from "./Pic";
import { Seal } from "./Seal";
import { WhatsAppIcon } from "./icons";

type ImageName = keyof typeof manifest;

export type CaseModalProps = {
  anchor: string;
  /** элемент, из которого разворачивается окно (карточка) */
  origin: Element | null;
  closing: boolean;
  onClose: () => void;
  onNavigate: (anchor: string) => void;
  onCalc: () => void;
  onExited: () => void;
};

// Кривые и длительности - из системы: --ease-ink и кривая печати накладной.
const EASE_INK = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_OUT = "cubic-bezier(0.5, 0, 0.9, 0.4)";
const FOCUSABLE = 'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Рамка карточки, из которой разворачивается окно, - если карточка видна на экране
function originFrom(el: Element | null, anchor: string) {
  const node =
    el && el.isConnected ? el : document.querySelector(`[data-case-card="${anchor}"]`)?.closest(".waybill") ?? null;
  if (!node) return null;
  const r = node.getBoundingClientRect();
  const visible = r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  return visible ? r : null;
}

// «Откуда» для анимации: из рамки карточки в рамку окна
function fromRect(sheet: HTMLElement, o: DOMRect | null) {
  if (!o) return "translateY(24px) scale(0.97)";
  const f = sheet.getBoundingClientRect();
  const dx = o.left + o.width / 2 - (f.left + f.width / 2);
  const dy = o.top + o.height / 2 - (f.top + f.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${o.width / f.width}, ${o.height / f.height})`;
}

// Всплывающее окно кейса: развёрнутая грузовая накладная.
// Десктоп (от 1024 px) - две колонки: медиа слева, текст справа. Телефон и планшет - на весь экран.
export function CaseModal({ anchor, origin, closing, onClose, onNavigate, onCalc, onExited }: CaseModalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const index = cases.findIndex((c) => caseAnchor(c.id) === anchor);
  const c = cases[index];

  // Под окном: прокрутка заблокирована, остальная страница недоступна (inert)
  useEffect(() => {
    const root = rootRef.current!;
    const html = document.documentElement;
    const others = [...document.body.children].filter((el) => el !== root && !el.hasAttribute("inert"));
    others.forEach((el) => el.setAttribute("inert", ""));
    const prev = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter };
    html.style.scrollbarGutter = "stable";
    html.style.overflow = "hidden";
    getLenis()?.stop();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      others.forEach((el) => el.removeAttribute("inert"));
      html.style.overflow = prev.overflow;
      html.style.scrollbarGutter = prev.gutter;
      getLenis()?.start();
    };
  }, []);

  // Открытие: накладная разворачивается из карточки
  useLayoutEffect(() => {
    const root = rootRef.current!;
    const sheet = sheetRef.current!;
    const backdrop = root.querySelector<HTMLElement>(".cmodal__backdrop")!;
    if (reduced()) {
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
      return;
    }
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
    sheet.animate(
      [
        { transform: fromRect(sheet, originFrom(origin, anchor)), opacity: 0.3 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 400, easing: EASE_INK },
    );
    // только при первом показе
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Закрытие: пауза видео, накладная складывается обратно в карточку
  useEffect(() => {
    if (!closing) return;
    const root = rootRef.current!;
    const sheet = sheetRef.current!;
    root.querySelectorAll("video").forEach((v) => v.pause());
    let anims: Animation[];
    if (reduced()) {
      anims = [root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" })];
    } else {
      anims = [
        sheet.animate([{ transform: "none", opacity: 1 }, { transform: fromRect(sheet, originFrom(null, anchor)), opacity: 0 }], {
          duration: 280,
          easing: EASE_OUT,
          fill: "forwards",
        }),
        root.querySelector(".cmodal__backdrop")!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, fill: "forwards" }),
      ];
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onExited();
    };
    Promise.all(anims.map((a) => a.finished)).then(finish, finish);
  }, [closing, anchor, onExited]);

  // Клавиатура: Esc закрывает (сначала крупное фото), Tab не выходит из окна
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (zoom) setZoom(null);
        else onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const box = rootRef.current!;
      const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!box.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [zoom, onClose]);

  // Смена кейса: наверх
  useEffect(() => {
    sheetRef.current?.scrollTo({ top: 0 });
    sheetRef.current?.querySelector(".cmodal__text")?.scrollTo({ top: 0 });
  }, [anchor]);

  useEffect(() => {
    if (!c) onClose();
  }, [c, onClose]);
  if (!c) return null;

  const n = cases.length;
  const prev = cases[(index - 1 + n) % n];
  const next = cases[(index + 1) % n];
  const titleId = `${anchor}-title`;

  return createPortal(
    <div ref={rootRef} className="cmodal" data-lenis-prevent>
      <div className="cmodal__backdrop" onClick={onClose} aria-hidden />
      <div ref={sheetRef} className="cmodal__sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="cmodal__top">
          <span>
            Грузовая накладная <span className="cmodal__no">№ {c.id}</span>
          </span>
          <button ref={closeRef} type="button" className="cmodal__close" onClick={onClose} aria-label="Закрыть">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
        <CaseBody key={anchor} c={c} titleId={titleId} onZoom={setZoom} onCalc={onCalc} />
        <nav className="cmodal__cases" aria-label="Другие кейсы">
          <button type="button" onClick={() => onNavigate(caseAnchor(prev.id))} aria-label={`Предыдущий кейс: ${prev.id} ${prev.title}`}>
            <span aria-hidden>←</span> {prev.id}
          </button>
          <span className="cmodal__count" aria-hidden>
            {index + 1} / {n}
          </span>
          <button type="button" onClick={() => onNavigate(caseAnchor(next.id))} aria-label={`Следующий кейс: ${next.id} ${next.title}`}>
            {next.id} <span aria-hidden>→</span>
          </button>
        </nav>
      </div>
      {zoom && (
        <div className="cmodal__zoom" onClick={() => setZoom(null)}>
          <button type="button" className="cmodal__close cmodal__close--zoom" onClick={() => setZoom(null)} aria-label="Закрыть фото">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
          <Pic name={zoom as ImageName} alt="" sizes="(min-width: 1024px) 900px, 100vw" eager />
        </div>
      )}
    </div>,
    document.body,
  );
}

function CaseBody({
  c,
  titleId,
  onZoom,
  onCalc,
}: {
  c: CaseItem;
  titleId: string;
  onZoom: (src: string) => void;
  onCalc: () => void;
}) {
  const [full, setFull] = useState(false);
  const facts = FACT_LABELS.filter(([k]) => c.facts[k]);
  const blocks = [
    ["Задача", c.task],
    [c.doneTitle ?? "Что сделали", c.done],
    ["Результат", c.result],
  ].filter(([, t]) => t);
  const tid = `${titleId}-transcript`;

  return (
    <div className="cmodal__body">
      {c.media.length > 0 && <Gallery media={c.media} title={c.title} onZoom={onZoom} />}
      <div className="cmodal__text">
        <div className="cmodal__head">
          {c.tags.length > 0 && <p className="cmodal__tags">{c.tags.join(" · ")}</p>}
          <span className="cmodal__stamp" aria-hidden>
            <Seal className="h-6 w-6" />
            {site.cases.stamp}
          </span>
        </div>
        <h2 id={titleId} className="cmodal__title">
          {c.title}
        </h2>
        {facts.length > 0 && (
          <dl className="cmodal__facts">
            {facts.map(([k, label]) => (
              <div key={k}>
                <dt>{label}</dt>
                <dd>{c.facts[k]}</dd>
              </div>
            ))}
          </dl>
        )}
        {blocks.map(([h, t]) => (
          <section key={h} className="cmodal__block">
            <h3>{h}</h3>
            <p>{t}</p>
          </section>
        ))}
        {c.quote && (
          <blockquote className="cmodal__quote">
            <p>«{c.quote}»</p>
          </blockquote>
        )}
        {c.transcript && (
          <div className="cmodal__transcript">
            <button type="button" aria-expanded={full} aria-controls={tid} onClick={() => setFull((v) => !v)}>
              Полная расшифровка <span aria-hidden>{full ? "−" : "+"}</span>
            </button>
            <p id={tid} hidden={!full}>
              {c.transcript}
            </p>
          </div>
        )}
        <div className="cmodal__cta">
          <InkButton href={whatsappLink(caseMessage(c))} variant="ink" external>
            <WhatsAppIcon className="h-6 w-6" />
            Хочу так же
          </InkButton>
          <InkButton
            href="#calc"
            variant="ink-outline"
            onClick={(e) => {
              e.preventDefault();
              onCalc();
            }}
          >
            Рассчитать доставку
          </InkButton>
        </div>
      </div>
    </div>
  );
}

// Медиа кейса: кадры листаются стрелками и свайпом, под ними подпись и миниатюры.
// Видео - без автозапуска, файл грузится только по нажатию «play» (preload="none").
function Gallery({ media, title, onZoom }: { media: CaseMedia[]; title: string; onZoom: (src: string) => void }) {
  const stage = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const many = media.length > 1;

  const go = (i: number) => {
    const el = stage.current;
    if (!el) return;
    const to = Math.max(0, Math.min(media.length - 1, i));
    el.scrollTo({ left: to * el.clientWidth, behavior: reduced() ? "auto" : "smooth" });
  };

  const onScroll = () => {
    const el = stage.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i === active) return;
    setActive(i);
    // перелистнули - видео на паузу
    el.querySelectorAll("video").forEach((v) => v.pause());
  };

  const current = media[active];
  return (
    <div className="cmodal__media">
      <div className="cmodal__stage-wrap">
        <ul ref={stage} className="cmodal__stage" onScroll={onScroll} aria-label="Медиа кейса">
          {media.map((m, i) => (
            <li key={m.src} className="cmodal__slide" aria-hidden={i !== active || undefined}>
              {m.type === "video" ? (
                <video
                  controls
                  playsInline
                  preload="none"
                  poster={m.poster ? `${BASE_PATH}/${m.poster}-828.webp` : undefined}
                  src={BASE_PATH + m.src}
                  tabIndex={i === active ? undefined : -1}
                  aria-label={m.caption ?? `Видео: ${title}`}
                >
                  {m.captions && <track kind="captions" src={BASE_PATH + m.captions} srcLang="ru" label="Русские субтитры" default />}
                </video>
              ) : (
                <button
                  type="button"
                  className="cmodal__zoom-btn"
                  onClick={() => onZoom(m.src)}
                  tabIndex={i === active ? undefined : -1}
                  aria-label={`Открыть крупно: ${m.caption ?? title}`}
                >
                  <Pic name={m.src as ImageName} alt={m.caption ?? title} sizes="(min-width: 1024px) 460px, 100vw" />
                </button>
              )}
            </li>
          ))}
        </ul>
        {many && (
          <>
            <button
              type="button"
              className="cmodal__arrow cmodal__arrow--prev"
              onClick={() => go(active - 1)}
              disabled={active === 0}
              aria-label="Предыдущий кадр"
            >
              ←
            </button>
            <button
              type="button"
              className="cmodal__arrow cmodal__arrow--next"
              onClick={() => go(active + 1)}
              disabled={active === media.length - 1}
              aria-label="Следующий кадр"
            >
              →
            </button>
          </>
        )}
      </div>
      {(current?.caption || many) && (
        <p className="cmodal__caption" aria-live="polite">
          {many && (
            <span className="cmodal__frame">
              {active + 1} / {media.length}
            </span>
          )}
          {current?.caption}
        </p>
      )}
      {many && (
        <div className="cmodal__thumbs">
          {media.map((m, i) => (
            <button
              key={m.src}
              type="button"
              className="cmodal__thumb"
              aria-current={i === active || undefined}
              aria-label={`Кадр ${i + 1}: ${m.caption ?? title}`}
              onClick={() => go(i)}
            >
              <Pic name={(m.type === "video" ? m.poster : m.src) as ImageName} alt="" sizes="64px" />
              {m.type === "video" && <span className="cmodal__play" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
