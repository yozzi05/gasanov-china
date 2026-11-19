"use client";

import { useEffect, useRef } from "react";

const CHARSET = "0123456789";

// Перекидное табло, как в порту или аэропорту: каждая ячейка «перелистывает»
// несколько случайных знаков и останавливается на нужном.
export function Flap({ value }: { value: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cells = [...el.querySelectorAll<HTMLElement>("[data-flap]")];
    let tl: { kill(): unknown } | undefined;
    let cancelled = false;

    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const { default: gsap } = await import("gsap");
        if (cancelled) return;
        const board = gsap.timeline();
        tl = board;
        cells.forEach((cell, ci) => {
          const top = cell.querySelector<HTMLElement>("[data-top]")!;
          const bot = cell.querySelector<HTMLElement>("[data-bot]")!;
          const glyphs = cell.querySelectorAll("i");
          const target = cell.dataset.flap!;
          const steps = 7 + ci * 3;
          const seq = Array.from({ length: steps }, () => CHARSET[(Math.random() * 10) | 0]).concat(target);
          const set = (ch: string) => glyphs.forEach((g) => (g.textContent = ch));

          const cellTl = gsap.timeline();
          set(seq[0]);
          for (let i = 1; i < seq.length; i++) {
            const d = 0.045 + (i / seq.length) * 0.05; // к концу замедляется
            cellTl
              .to(top, { scaleY: 0, duration: d, ease: "power1.in" })
              .add(() => set(seq[i]))
              .set(top, { scaleY: 1 })
              .fromTo(bot, { scaleY: 0 }, { scaleY: 1, duration: d, ease: "power1.out" });
          }
          board.add(cellTl, ci * 0.08);
        });
      },
      { threshold: 0.6 },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      tl?.kill();
    };
  }, [value]);

  return (
    <span ref={root} className="flapboard" aria-hidden>
      {[...value].map((ch, i) =>
        ch === " " ? (
          <span key={i} className="flap-gap" />
        ) : (
          <span key={i} className="flap" data-flap={ch}>
            <span className="flap__half flap__half--top" data-top>
              <i>{ch}</i>
            </span>
            <span className="flap__half flap__half--bot" data-bot>
              <i>{ch}</i>
            </span>
          </span>
        ),
      )}
    </span>
  );
}
