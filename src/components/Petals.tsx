"use client";

import { useEffect, useRef } from "react";

type Petal = {
  x: number; y: number; vx: number; vy: number;
  size: number; rot: number; vr: number; flip: number; vf: number;
  sway: number; color: string;
};

const COLORS = ["#F7CFC9", "#FBE4DF", "#F2A7A4", "#F4EFE6"];

// Лепестки на Canvas 2D. Падают, покачиваются и отклоняются от курсора.
// На телефоне их меньше; вне экрана и в фоновой вкладке анимация стоит.
export function Petals() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, fine ? 2 : 1.5);
    let w = 0, h = 0;
    const mouse = { x: -9999, y: -9999 };
    let petals: Petal[] = [];

    const spawn = (anywhere: boolean): Petal => {
      const size = (fine ? 7 : 6) + Math.random() * 8;
      return {
        x: Math.random() * w * 1.2 - w * 0.1,
        y: anywhere ? Math.random() * h : -20 - Math.random() * h * 0.3,
        vx: -8 - Math.random() * 16,
        vy: 26 + Math.random() * 34,
        size,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 1.6,
        flip: Math.random() * Math.PI * 2,
        vf: 1 + Math.random() * 2,
        sway: Math.random() * Math.PI * 2,
        color: COLORS[(Math.random() * COLORS.length) | 0],
      };
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 768 ? 14 : 38;
      petals = Array.from({ length: count }, () => spawn(true));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let last = 0;
    let running = false;
    let inView = false;

    const frame = (t: number) => {
      const dt = Math.min((t - last) / 1000 || 0.016, 0.05);
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        // отталкивание от курсора
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 19600) {
          const d = Math.sqrt(d2) || 1;
          const force = (1 - d / 140) * 520;
          p.vx += (dx / d) * force * dt;
          p.vy += (dy / d) * force * dt;
          p.vr += (dx > 0 ? 1 : -1) * dt * 6;
        }
        // возвращение к спокойному падению
        p.vx += (-14 - p.vx) * dt * 1.2;
        p.vy += (42 - p.vy) * dt * 0.9;
        p.vr *= 1 - dt * 0.8;
        p.sway += dt * 1.4;
        p.x += (p.vx + Math.sin(p.sway) * 22) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.flip += p.vf * dt;
        if (p.y > h + 24 || p.x < -40) petals[i] = spawn(false);

        const sx = Math.cos(p.flip);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(sx, 1);
        ctx.globalAlpha = 0.55 + 0.4 * Math.abs(sx);
        ctx.fillStyle = p.color;
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.7, 0, s);
        ctx.bezierCurveTo(-s * 0.7, s * 0.7, -s * 0.9, -s * 0.6, 0, -s);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };

    const update = () => {
      const should = inView && !document.hidden;
      if (should && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      update();
    });
    document.addEventListener("visibilitychange", update);
    // стартуем после загрузочного экрана, чтобы не мешать первой отрисовке
    const begin = () => {
      io.observe(canvas);
      update();
    };
    let inited = false;
    const start = () => {
      if (inited) return;
      inited = true;
      begin();
    };
    if (window.__g17Loaded) start();
    else window.addEventListener("g17:loaded", start, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("g17:loaded", start);
    };
  }, []);

  return <canvas ref={ref} className="hero__petals" aria-hidden />;
}
