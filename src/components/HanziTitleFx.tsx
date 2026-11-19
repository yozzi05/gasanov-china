"use client";

import { useEffect, useRef } from "react";

type CharData = { strokes: string[]; medians: number[][][] };

// Оживляет ближайший заголовок [data-htitle]. Библиотека написания иероглифов
// и их контуры подгружаются только когда заголовок входит в экран.
export function HanziTitleFx() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = anchor.current?.closest<HTMLElement>("[data-htitle]");
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const strokeColor = el.dataset.stroke || "#C8102E";
    const cells = [...el.querySelectorAll<HTMLElement>("[data-char]")];
    const statics = el.querySelectorAll<HTMLElement>("[data-static]");
    const textLines = el.querySelectorAll<HTMLElement>("[data-tline]");
    statics.forEach((s) => (s.style.visibility = "hidden"));
    textLines.forEach((l) => (l.style.transform = "translateY(112%)"));

    let cancelled = false;
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const [{ default: HanziWriter }, { default: data }, { default: gsap }] = await Promise.all([
          import("hanzi-writer"),
          import("@/content/hanzi-data.json"),
          import("gsap"),
        ]);
        if (cancelled) return;
        const HANZI = data as Record<string, CharData>;

        const writers = cells.map((cell) => {
          const size = cell.clientWidth;
          const holder = document.createElement("div");
          holder.style.cssText = "position:absolute;inset:0";
          cell.appendChild(holder);
          return HanziWriter.create(holder, cell.dataset.char!, {
            width: size,
            height: size,
            padding: 0,
            strokeColor,
            showOutline: false,
            showCharacter: false,
            strokeAnimationSpeed: 2.4,
            delayBetweenStrokes: 40,
            charDataLoader: (char, onLoad) => onLoad(HANZI[char]),
          });
        });

        // текст выезжает, когда первый иероглиф почти дописан
        textLines.forEach((l) => (l.style.transform = ""));
        gsap.fromTo(
          textLines,
          { yPercent: 112 },
          { yPercent: 0, duration: 0.95, stagger: 0.1, ease: "power4.out", delay: 0.55 },
        );
        for (const w of writers) {
          if (cancelled) return;
          await w.animateCharacter();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, []);

  return <span ref={anchor} hidden />;
}
