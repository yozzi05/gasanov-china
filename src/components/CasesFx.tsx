"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Горизонтальная лента кейсов по вертикальному скроллу — только на десктопе
// с мышью. На тач-устройствах остаётся обычная лента, которую листают пальцем.
export function CasesFx() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-cases]");
    const track = root?.querySelector<HTMLElement>("[data-track]");
    const viewport = root?.querySelector<HTMLElement>("[data-viewport]");
    if (!root || !track || !viewport) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (hover: hover) and (pointer: fine)", () => {
      root.dataset.pinned = "true";
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      const setHeight = () => (root.style.height = `${window.innerHeight + distance()}px`);
      setHeight();

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefreshInit: setHeight,
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        delete root.dataset.pinned;
        root.style.height = "";
        gsap.set(track, { clearProps: "transform" });
      };
    });

    return () => mm.revert();
  }, []);

  return null;
}
