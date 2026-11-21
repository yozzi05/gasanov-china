"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Где на линии стоят этапы (доля длины пути):
// поставщик → склад в Фошане → проверка → отправка → Москва → дверь клиента
const STOPS = [0, 0.11, 0.2, 0.33, 0.84, 1];

export function RouteFx({ days }: { days: number }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-route]");
    if (!root) return;

    const ink = [...root.querySelectorAll<SVGPathElement>("[data-ink]")];
    const nodes = [...root.querySelectorAll<SVGGElement>("[data-node]")];
    const steps = [...root.querySelectorAll<HTMLElement>("[data-step]")];
    const ticks = [...root.querySelectorAll<HTMLElement>("[data-tick]")];
    const box = root.querySelector<SVGGElement>("[data-box]");
    const tens = root.querySelector<HTMLElement>('[data-digit="tens"]');
    const ones = root.querySelector<HTMLElement>('[data-digit="ones"]');
    const main = ink[0];
    if (!main || !box) return;

    const L = main.getTotalLength();
    nodes.forEach((n, i) => {
      const p = main.getPointAtLength(L * STOPS[i]);
      n.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    });
    root.dataset.ready = "true";

    // Без движения: карта и список этапов остаются статичными
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    root.dataset.animated = "true";
    const lens = ink.map((p) => p.getTotalLength());
    ink.forEach((p, i) => (p.style.strokeDasharray = `${lens[i]}`));

    const state = { p: 0 };
    let active = -1;
    let day = -1;
    let arrived = false;

    const render = () => {
      const p = state.p;
      ink.forEach((path, i) => (path.style.strokeDashoffset = `${lens[i] * (1 - p)}`));

      // контейнер едет по линии и поворачивается по касательной
      const a = main.getPointAtLength(L * p);
      const b = main.getPointAtLength(Math.min(L, L * p + 2));
      const c = main.getPointAtLength(Math.max(0, L * p - 2));
      let deg = (Math.atan2(b.y - c.y, b.x - c.x) * 180) / Math.PI;
      if (deg > 90 || deg < -90) deg += 180; // не переворачивать вверх дном
      box.setAttribute("transform", `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${deg.toFixed(1)})`);

      let idx = 0;
      nodes.forEach((n, i) => {
        const on = p >= STOPS[i] - 0.004;
        if (on) idx = i;
        n.toggleAttribute("data-on", on);
      });
      if (idx !== active) {
        active = idx;
        steps.forEach((s, i) => s.toggleAttribute("data-active", i === idx));
        ticks.forEach((t, i) => t.toggleAttribute("data-on", i <= idx));
        nodes.forEach((n, i) => n.toggleAttribute("data-current", i === idx));
      }

      // груз доехал до двери клиента - вместо счётчика показываем срок доставки
      const end = p >= 0.995;
      if (end !== arrived) {
        arrived = end;
        root.toggleAttribute("data-arrived", end);
      }

      const d = 1 + Math.round((days - 1) * p);
      if (d !== day) {
        day = d;
        if (tens) tens.style.transform = `translateY(${-Math.floor(d / 10) * 10}%)`;
        if (ones) ones.style.transform = `translateY(${-(d % 10) * 10}%)`;
      }
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onUpdate: render,
        scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.7 },
      });
      // каждый этап занимает равную долю скролла, с короткой остановкой на точке
      tl.to({}, { duration: 0.3 });
      for (let i = 1; i < STOPS.length; i++) {
        tl.to(state, { p: STOPS[i], duration: 1, ease: "power1.inOut" }).to({}, { duration: 0.4 });
      }
    }, root);
    render();

    return () => {
      ctx.revert();
      delete root.dataset.animated;
      root.removeAttribute("data-arrived");
    };
  }, [days]);

  return null;
}
