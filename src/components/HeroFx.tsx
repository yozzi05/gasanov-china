"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Движение первого экрана: выезд букв, параллакс по скроллу и курсору,
// качание фонариков. Анимируются только transform и opacity.
export function HeroFx() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-hero]");
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups: (() => void)[] = [];

    const ctx = gsap.context(() => {
      // ── Появление ──
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });
      tl.from("[data-letter]", { yPercent: 112, duration: 1.15, stagger: 0.07 }, 0)
        .from("[data-tree]", { autoAlpha: 0, scale: 1.08, transformOrigin: "70% 100%", duration: 1.8, ease: "power2.out" }, 0.05)
        // фото не прячем через opacity: оно должно отрисоваться сразу (под загрузочным экраном),
        // иначе браузер считает главный элемент страницы «поздним»
        .from("[data-photo]", { yPercent: 9, scale: 1.04, transformOrigin: "50% 100%", duration: 1.4 }, 0.2)
        .from("[data-lantern]", { yPercent: -120, duration: 1.4, stagger: 0.16, ease: "back.out(1.1)" }, 0.55)
        .from("[data-line]", { yPercent: 112, duration: 0.95, stagger: 0.09 }, 0.75)
        .from("[data-fade]", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 1.05);

      const start = () => tl.play();
      if (window.__g17Loaded) start();
      else {
        window.addEventListener("g17:loaded", start, { once: true });
        cleanups.push(() => window.removeEventListener("g17:loaded", start));
      }

      // ── Параллакс по скроллу: у каждого слоя своя скорость ──
      root.querySelectorAll<HTMLElement>("[data-scroll]").forEach((el) => {
        gsap.to(el, {
          yPercent: Number(el.dataset.scroll),
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
      });

      // ── Параллакс по курсору (только десктоп) ──
      if (fine) {
        const layers = [...root.querySelectorAll<HTMLElement>("[data-mouse]")].map((el) => ({
          depth: Number(el.dataset.mouse),
          x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
        }));
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          for (const l of layers) {
            l.x(nx * l.depth * 2);
            l.y(ny * l.depth);
          }
        };
        root.addEventListener("pointermove", onMove);
        cleanups.push(() => root.removeEventListener("pointermove", onMove));
      }

      // ── Фонарики-маятники ──
      const IDLE = 3.2;
      const lanterns = [...root.querySelectorAll<HTMLElement>("[data-lantern-swing]")].map((el, i) => {
        const s = {
          amp: IDLE,
          target: IDLE,
          speed: 1.25 - i * 0.22,
          phase: i * 1.7,
          set: gsap.quickSetter(el, "rotation", "deg"),
        };
        const kick = () => (s.target = 15);
        el.addEventListener("pointerenter", kick);
        el.addEventListener("focusin", kick);
        cleanups.push(() => {
          el.removeEventListener("pointerenter", kick);
          el.removeEventListener("focusin", kick);
        });
        return s;
      });

      let visible = true;
      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (visible = self.isActive),
      });
      const tick = (time: number, deltaMs: number) => {
        if (!visible) return;
        const dt = Math.min(deltaMs, 50) / 1000;
        for (const s of lanterns) {
          s.amp += (s.target - s.amp) * Math.min(1, dt * 5);
          s.target = IDLE + (s.target - IDLE) * Math.exp(-dt * 0.55);
          s.set(s.amp * Math.sin(time * s.speed + s.phase));
        }
      };
      gsap.ticker.add(tick);
      cleanups.push(() => gsap.ticker.remove(tick));
    }, root);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return null;
}
