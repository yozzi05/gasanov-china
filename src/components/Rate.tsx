"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

type RateState = { value: number; date: string } | null;

// Курс юаня ЦБ РФ. Если запрос не удался — цифра просто не показывается.
export function RateValue() {
  const [rate, setRate] = useState<RateState>(null);
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let timer = 0;

    const load = () => {
      // не ждём дольше 7 секунд: без ответа блок остаётся без цифры
      timer = window.setTimeout(() => ctrl.abort(), 7000);
      fetch(site.rate.api, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d) => {
          const cny = d?.Valute?.CNY;
          const value = cny ? cny.Value / (cny.Nominal || 1) : NaN;
          if (!Number.isFinite(value) || value <= 0) return;
          const date = new Date(d.Date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
          setRate({ value, date });
        })
        .catch(() => {
          /* блок остаётся без цифры */
        })
        .finally(() => clearTimeout(timer));
    };

    // курс запрашиваем, когда посетитель подходит к блоку, а не при загрузке страницы
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        load();
      },
      { rootMargin: "1200px 0px" },
    );
    if (anchor.current) io.observe(anchor.current);

    return () => {
      io.disconnect();
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  if (!rate) return <span ref={anchor} />;

  return (
    <div className="rate__value">
      <p className="rate__figure">
        <span className="rate__unit">1 ¥ =</span>{" "}
        {rate.value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span className="rate__unit"> ₽</span>
      </p>
      <p className="rate__date">Курс ЦБ РФ на {rate.date}</p>
    </div>
  );
}
