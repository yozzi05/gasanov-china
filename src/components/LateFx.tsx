"use client";

import { useEffect, useState, type ComponentType } from "react";

// Подгружает все «тяжёлые» эффекты страницы (GSAP, плавный скролл, параллакс,
// маршрут, кейсы) отдельным файлом — после того как на загрузочном экране
// поставлена печать. Так они не мешают первой отрисовке.
export function LateFx() {
  const [Bundle, setBundle] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      import("./LateBundle").then((m) => {
        if (!cancelled) setBundle(() => m.LateBundle);
      });
    window.addEventListener("g17:intro", load, { once: true });
    // страховка: если событие уже было или не придёт
    const timer = window.setTimeout(load, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("g17:intro", load);
    };
  }, []);

  return Bundle ? <Bundle /> : null;
}
