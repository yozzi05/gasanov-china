"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Общие эффекты страницы:
// • [data-reveal] — блок мягко выезжает, когда входит в экран;
// • [data-edge]   — клякса-переход между секциями растёт по скроллу.
export function PageFx() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    const ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>("[data-edge]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleY: 0.1 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "top 40%", scrub: true },
          },
        );
      });
    });

    // после загрузки шрифтов и картинок высоты секций меняются — пересчитываем один раз
    ScrollTrigger.config({ ignoreMobileResize: true });
    let timer = 0;
    const refresh = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    };
    document.fonts?.ready.then(refresh);
    if (document.readyState !== "complete") window.addEventListener("load", refresh);

    return () => {
      clearTimeout(timer);
      io.disconnect();
      ctx.revert();
      window.removeEventListener("load", refresh);
    };
  }, []);

  return null;
}
