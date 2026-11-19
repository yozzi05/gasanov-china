"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import baked from "@/content/rate.json";

type Rate = { value: number; date: string }; // date: ГГГГ-ММ-ДД

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const formatDate = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};
const valid = (r: unknown): r is Rate =>
  !!r && typeof (r as Rate).value === "number" && (r as Rate).value > 0 && /^\d{4}-\d{2}-\d{2}/.test((r as Rate).date);

const CACHE_KEY = "g17-cny-rate";

// Курс юаня ЦБ РФ.
// Сервис с курсом отвечает нестабильно, поэтому цифра не зависит от него напрямую:
// 1) в страницу уже вшит курс на момент сборки сайта (src/content/rate.json);
// 2) браузер пробует получить свежий курс и подменяет цифру, если он новее;
// 3) удачный ответ запоминается на устройстве посетителя до следующего раза.
// Рядом всегда стоит дата, на которую действует показанный курс.
export function RateValue() {
  const [rate, setRate] = useState<Rate | null>(valid(baked) ? baked : null);

  useEffect(() => {
    const newer = (r: Rate) => setRate((cur) => (!cur || r.date >= cur.date ? r : cur));

    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (valid(cached)) newer(cached);
    } catch {
      /* хранилище недоступно - не страшно */
    }

    let cancelled = false;
    let ctrl: AbortController | null = null;

    const once = async () => {
      ctrl = new AbortController();
      const current = ctrl;
      const timer = window.setTimeout(() => current.abort(), 12000);
      try {
        const r = await fetch(site.rate.api, { signal: current.signal });
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        const cny = d?.Valute?.CNY;
        const fresh = { value: cny ? cny.Value / (cny.Nominal || 1) : NaN, date: String(d.Date).slice(0, 10) };
        if (!valid(fresh)) throw new Error("bad data");
        return fresh;
      } finally {
        clearTimeout(timer);
      }
    };

    const update = async () => {
      for (let attempt = 0; attempt < 2 && !cancelled; attempt++) {
        try {
          const fresh = await once();
          if (cancelled) return;
          newer(fresh);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
          } catch {
            /* не удалось запомнить - не страшно */
          }
          return;
        } catch {
          /* остаётся уже показанный курс */
        }
      }
    };
    // не мешаем загрузке страницы: обновляем курс чуть позже
    const start = window.setTimeout(update, 2500);

    return () => {
      cancelled = true;
      clearTimeout(start);
      ctrl?.abort();
    };
  }, []);

  if (!rate) return null;

  return (
    <div className="rate__value">
      <p className="rate__figure">
        <span className="rate__unit">1 ¥ =</span> {rate.value.toFixed(2).replace(".", ",")}
        <span className="rate__unit"> ₽</span>
      </p>
      <p className="rate__date">Курс ЦБ РФ на {formatDate(rate.date)}</p>
    </div>
  );
}
