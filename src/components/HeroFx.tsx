"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Движение первого экрана: выезд букв, смещение слоёв сцены за курсором (на телефоне - за скроллом),
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
      tl.from(
          "[data-tree]",
          {
            autoAlpha: 0,
            scale: 1.08,
            transformOrigin: (_i: number, el: HTMLElement) => el.dataset.tree || "50% 100%",
            duration: 1.8,
            ease: "power2.out",
          },
          0.05,
        )
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

      // ── Смещение слоёв сцены ──
      // data-mouse - амплитуда слоя в px. На десктопе слои идут за курсором,
      // на телефоне - за скроллом, амплитуды вдвое меньше. Слой догоняет цель
      // с запаздыванием (lerp); когда курсор уходит с первого экрана или из окна,
      // цель - исходное положение.
      const LERP = 0.08;
      const layers = [...root.querySelectorAll<HTMLElement>("[data-mouse]")].map((el) => ({
        amp: Number(el.dataset.mouse),
        x: 0,
        y: 0,
        setX: gsap.quickSetter(el, "x", "px"),
        setY: gsap.quickSetter(el, "y", "px"),
      }));
      // цель в долях амплитуды: -1..1
      const aim = { x: 0, y: 0 };
      if (fine) {
        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          if (e.clientY > r.bottom || e.clientY < r.top) {
            aim.x = aim.y = 0;
            return;
          }
          aim.x = (e.clientX / window.innerWidth - 0.5) * 2;
          aim.y = e.clientY / window.innerHeight - 0.5;
        };
        const onOut = () => (aim.x = aim.y = 0);
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onOut);
        window.addEventListener("blur", onOut);
        cleanups.push(() => {
          window.removeEventListener("pointermove", onMove);
          document.documentElement.removeEventListener("pointerleave", onOut);
          window.removeEventListener("blur", onOut);
        });
      } else {
        const onScroll = () => {
          const p = Math.min(1, Math.max(0, window.scrollY / (root.offsetHeight || 1)));
          aim.y = -p / 2;
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", onScroll));
      }
      const follow = (dt: number) => {
        const k = 1 - Math.pow(1 - LERP, dt * 60);
        for (const l of layers) {
          const tx = aim.x * l.amp;
          const ty = aim.y * l.amp;
          if (Math.abs(tx - l.x) < 0.01 && Math.abs(ty - l.y) < 0.01) continue;
          l.x += (tx - l.x) * k;
          l.y += (ty - l.y) * k;
          l.setX(l.x);
          l.setY(l.y);
        }
      };

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
        follow(dt);
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
