"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const TRAIL = 7;

// Курсор на десктопе: точка с коротким чернильным следом.
// На тач-устройствах и при reduced-motion не включается.
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dots = [...el.children] as HTMLElement[];
    const movers = dots.map((d, i) => ({
      x: gsap.quickTo(d, "x", { duration: 0.1 + i * 0.055, ease: "power3.out" }),
      y: gsap.quickTo(d, "y", { duration: 0.1 + i * 0.055, ease: "power3.out" }),
    }));
    gsap.set(dots, { xPercent: -50, yPercent: -50 });

    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!shown) {
        shown = true;
        document.documentElement.classList.add("has-cursor");
        gsap.set(dots, { x: e.clientX, y: e.clientY });
        gsap.to(dots, { opacity: (i) => 1 - i * 0.11, duration: 0.3 });
      }
      for (const m of movers) {
        m.x(e.clientX);
        m.y(e.clientY);
      }
    };
    const onOver = (e: PointerEvent) => {
      const hit = (e.target as Element).closest?.("a, button, [role=button], input, select, label");
      gsap.to(dots[0], { scale: hit ? 3.2 : 1, duration: 0.35, ease: "power3.out" });
    };
    const onLeave = () => {
      shown = false;
      gsap.to(dots, { opacity: 0, duration: 0.2 });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div ref={root} aria-hidden>
      {Array.from({ length: TRAIL }, (_, i) => {
        const size = Math.max(3, 11 - i * 1.4);
        return <span key={i} className="cursor-dot" style={{ width: size, height: size }} />;
      })}
    </div>
  );
}
