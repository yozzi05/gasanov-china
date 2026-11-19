"use client";

import { useEffect, useRef } from "react";

// Перекидное табло, как в порту или аэропорту.
// Когда блок входит в экран, число считает от 1 до своего значения
// (например 1, 2, 3 ... 40), и каждая смена цифры - это «перелистывание» таблички.
// Знак после числа («+») перелистывается в самом конце, когда счёт дошёл.
// Без JS и при reduced-motion сразу показано итоговое значение.
export function Flap({ value }: { value: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = parseInt(value, 10);
    if (!Number.isFinite(target)) return;
    const digits = String(target).length;

    const cells = [...el.querySelectorAll<HTMLElement>("[data-flap]")];
    const digitCells = cells.slice(0, digits);
    // знак сразу после числа («+»); то, что стоит через пробел («$»), не трогаем
    const sign = value.charAt(digits).trim() ? cells[digits] : undefined;

    let cancelled = false;
    let tween: { kill(): unknown } | undefined;

    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const { default: gsap } = await import("gsap");
        if (cancelled) return;

        // одна табличка перелистывается на новый знак
        const flip = (cell: HTMLElement, ch: string) => {
          const top = cell.querySelector<HTMLElement>("[data-top]")!;
          const bot = cell.querySelector<HTMLElement>("[data-bot]")!;
          cell.querySelectorAll("i").forEach((g) => (g.textContent = ch));
          gsap.fromTo(top, { scaleY: 0.15 }, { scaleY: 1, duration: 0.12, ease: "power2.out", overwrite: true });
          gsap.fromTo(bot, { scaleY: 0 }, { scaleY: 1, duration: 0.16, ease: "power2.out", overwrite: true });
        };
        const show = (n: number) => {
          const text = String(n).padStart(digits, " ");
          digitCells.forEach((cell, i) => {
            const ch = text[i] === " " ? "" : text[i];
            if (cell.dataset.now !== ch) {
              cell.dataset.now = ch;
              flip(cell, ch);
            }
          });
        };

        // старт: единица, знак спрятан
        digitCells.forEach((c) => delete c.dataset.now);
        if (sign) sign.querySelectorAll("i").forEach((g) => (g.textContent = ""));
        show(1);
        const finish = () => sign && flip(sign, sign.dataset.flap!);
        if (target <= 1) {
          finish();
          return;
        }

        // считаем с замедлением к концу; чем больше число, тем дольше (но не дольше 2 с)
        const state = { n: 1 };
        tween = gsap.to(state, {
          n: target,
          duration: Math.min(2, 0.5 + target * 0.04),
          delay: 0.25,
          ease: "power1.out",
          onUpdate: () => show(Math.round(state.n)),
          onComplete: () => {
            show(target);
            finish();
          },
        });
      },
      { threshold: 0.6 },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      tween?.kill();
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
