"use client";

import { useEffect, useRef, useState } from "react";
import { Seal } from "./Seal";

declare global {
  interface Window {
    __g17Loaded?: boolean;
    __g17FxReady?: boolean;
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Загрузка: печать G17 ставится штампом, затем из центра экрана расплывается
// пятно краски и «прорисовывает» первый экран.
// Сделано на встроенных анимациях браузера, без библиотек: пока идёт штамп,
// в фоне догружаются остальные эффекты страницы (LateFx).
//
// Два варианта раскрытия:
// • десктоп - в бумажном листе растёт «дыра»-пятно, сквозь неё виден сайт (SVG-маска);
// • телефон и планшет - красное пятно краски заливает экран и растворяется.
//   Это CSS-анимации только на transform и opacity: их ведёт видеокарта,
//   и они не подтормаживают, даже когда страница занята загрузкой скриптов.
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const announce = (name: string) => window.dispatchEvent(new Event(name));
    const loaded = () => {
      window.__g17Loaded = true;
      announce("g17:loaded");
    };

    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches || !el.animate) {
      announce("g17:intro");
      loaded();
      setDone(true);
      return;
    }

    const fxReady = () =>
      new Promise<void>((resolve) => {
        if (window.__g17FxReady) return resolve();
        window.addEventListener("g17:fxready", () => resolve(), { once: true });
        setTimeout(resolve, 2500); // не держим экран, если эффекты так и не загрузились
      });

    // Телефон и планшет. Штамп и пятно здесь - обычные CSS-анимации (см. globals.css):
    // браузер запускает их сам с первой отрисовки и ведёт на видеокарте, без участия
    // скриптов. Поэтому они идут ровно, даже когда страница занята загрузкой.
    // Скрипту остаётся дождаться конца и растворить экран.
    const light = matchMedia("(max-width: 1023px), (pointer: coarse)").matches;
    if (light) {
      const blot = el.querySelector<HTMLElement>("[data-blot]")!;
      (async () => {
        await wait(550);
        announce("g17:intro"); // догружаем эффекты страницы, пока идёт анимация
        const running = blot.getAnimations().map((anim) => anim.finished.catch(() => undefined));
        await Promise.all([...running, fxReady()]);
        if (cancelled) return;
        // экран залит краской - из неё проявляется сайт
        loaded();
        await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, easing: "ease-out", fill: "forwards" })
          .finished;
        if (!cancelled) setDone(true);
      })().catch(() => {
        loaded();
        setDone(true);
      });
      return () => {
        cancelled = true;
      };
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cover = (Math.hypot(w, h) / 2 / 38) * 1.08;
    const center = el.querySelector<SVGGElement>("[data-center]")!;
    const hole = el.querySelector<SVGGElement>("[data-hole]")!;
    const seal = el.querySelector<HTMLElement>("[data-seal]")!;
    const drops = [...el.querySelectorAll<SVGCircleElement>("[data-drop]")];

    // Пятно стоит строго в центре экрана и растёт из своей середины
    center.setAttribute("transform", `translate(${w / 2} ${h / 2})`);
    drops.forEach((d) => (d.style.transformOrigin = `${d.getAttribute("cx")}px ${d.getAttribute("cy")}px`));

    (async () => {
      // 1. штамп
      await seal.animate(
        [
          { opacity: 0, transform: "scale(2.6) rotate(-16deg)" },
          { opacity: 1, transform: "scale(1) rotate(-5deg)" },
        ],
        { duration: 360, delay: 120, easing: "cubic-bezier(0.9, 0, 1, 0.6)", fill: "forwards" },
      ).finished;
      el.animate([{ transform: "translateX(0)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }], {
        duration: 80,
        iterations: 2,
      });
      seal.animate(
        [
          { transform: "scale(0.93) rotate(-5deg)" },
          { transform: "scale(1.03) rotate(-5deg)" },
          { transform: "scale(1) rotate(-5deg)" },
        ],
        { duration: 320, easing: "ease-out" },
      );

      // 2. теперь можно догружать остальные эффекты страницы
      announce("g17:intro");
      await Promise.all([wait(480), fxReady()]);
      if (cancelled) return;

      // 3. пятно-«дыра» в бумажном листе
      drops.forEach((d, i) =>
        d.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], {
          duration: 700,
          delay: 50 + i * 60,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        }),
      );
      seal.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(0.8) rotate(-5deg)" }], {
        duration: 300,
        delay: 60,
        easing: "ease-in",
        fill: "forwards",
      });
      await hole.animate(
        [
          { transform: "rotate(-20deg) scale(0)" },
          { transform: `rotate(-8deg) scale(${cover * 0.14})` },
        ],
        { duration: 500, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
      ).finished;
      if (cancelled) return;

      // первый экран начинает оживать, пока пятно ещё раскрывается
      loaded();
      await hole.animate(
        [
          { transform: `rotate(-8deg) scale(${cover * 0.14})` },
          { transform: `rotate(12deg) scale(${cover})` },
        ],
        { duration: 1100, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" },
      ).finished;
      if (!cancelled) setDone(true);
    })().catch(() => {
      // на случай сбоя анимации - просто показываем сайт
      loaded();
      setDone(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (done) return null;

  return (
    <div ref={root} className="preloader" aria-hidden>
      <svg className="preloader__sheet">
        <defs>
          <mask id="preloader-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect width="100%" height="100%" fill="#fff" />
            <g data-center>
              <g data-hole fill="#000" style={{ transform: "scale(0)" }}>
                <path d="M2-41c14-3 25 4 33 13 9 10 13 22 8 34-4 11-3 21-14 28-12 8-26 9-39 4-11-4-22-9-27-21-5-13-6-27 2-38 8-12 23-17 37-20z" />
                {/* наплывы краски по краю - растут с задержкой, край получается живым */}
                <circle data-drop cx="34" cy="-26" r="19" />
                <circle data-drop cx="-36" cy="22" r="21" />
                <circle data-drop cx="30" cy="32" r="17" />
                <circle data-drop cx="-34" cy="-24" r="16" />
                <circle data-drop cx="44" cy="4" r="14" />
                <circle data-drop cx="-6" cy="-44" r="15" />
                <circle data-drop cx="-4" cy="44" r="16" />
                {/* брызги */}
                <circle data-drop cx="62" cy="-34" r="5" />
                <circle data-drop cx="-64" cy="38" r="6" />
                <circle data-drop cx="50" cy="52" r="4" />
                <circle data-drop cx="-66" cy="-28" r="3.5" />
                <circle data-drop cx="-14" cy="-70" r="4" />
                <circle data-drop cx="10" cy="72" r="3" />
              </g>
            </g>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="#F4EFE6" mask="url(#preloader-mask)" />
      </svg>
      <div className="preloader__blot" data-blot>
        <svg viewBox="-100 -100 200 200" fill="#C8102E">
          <path d="M2-41c14-3 25 4 33 13 9 10 13 22 8 34-4 11-3 21-14 28-12 8-26 9-39 4-11-4-22-9-27-21-5-13-6-27 2-38 8-12 23-17 37-20z" />
          <circle cx="34" cy="-26" r="19" />
          <circle cx="-36" cy="22" r="21" />
          <circle cx="30" cy="32" r="17" />
          <circle cx="-34" cy="-24" r="16" />
          <circle cx="44" cy="4" r="14" />
          <circle cx="-6" cy="-44" r="15" />
          <circle cx="-4" cy="44" r="16" />
          <circle cx="62" cy="-34" r="5" />
          <circle cx="-64" cy="38" r="6" />
          <circle cx="50" cy="52" r="4" />
          <circle cx="-66" cy="-28" r="3.5" />
          <circle cx="-14" cy="-70" r="4" />
          <circle cx="10" cy="72" r="3" />
        </svg>
      </div>
      <div className="preloader__seal" data-seal>
        <Seal className="h-full w-full" />
      </div>
    </div>
  );
}
