"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

type RateState = { value: number; date: string } | null;

// Курс юаня ЦБ РФ. Если запрос не удался - цифра просто не показывается.
export function RateValue() {
  const [rate, setRate] = useState<RateState>(null);
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let timer = 0;

    const load = () => {
      // не ждём дольше 12 секунд: без ответа блок остаётся без цифры
      timer = window.setTimeout(() => ctrl.abort(), 12000);
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

    // Курс запрашиваем, когда посетитель подходит к блоку, а не при загрузке страницы.
    // Запрос уходит один раз: по наблюдателю, а если тот не сработал (так бывает
    // в Safari на iPhone) - по первому скроллу или через несколько секунд.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      cleanup();
      load();
    };
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([e]) => e.isIntersecting && start(), { rootMargin: "1500px 0px" })
        : null;
    if (io && anchor.current) io.observe(anchor.current);
    const fallback = window.setTimeout(start, 4000);
    window.addEventListener("scroll", start, { passive: true, once: true });
    function cleanup() {
      io?.disconnect();
      clearTimeout(fallback);
      window.removeEventListener("scroll", start);
    }

    return () => {
      cleanup();
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  // у «якоря» есть размер: пустой строчный элемент Safari не считает видимым
  if (!rate) return <div ref={anchor} style={{ width: "100%", height: 1 }} aria-hidden />;

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
