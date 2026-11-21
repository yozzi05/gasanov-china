"use client";

import { useId, useState } from "react";
import { site, whatsappLink } from "@/content/site";
import { CATEGORIES, RATE_SPREAD, type CategoryId } from "@/content/tariff-grids";
import {
  boxesVolume,
  buildRequestText,
  calcTariff,
  fmtInt,
  fmtNum,
  fmtRate,
  getCategory,
  parseNum,
} from "@/lib/calcTariff";
import { InkButton } from "./InkButton";
import { WhatsAppIcon } from "./icons";

const { tariffs, calc } = site;

// Шкала плотности: 0 … SCALE_MAX кг/м³, дальше метка стоит у правого края
const SCALE_MAX = 400;
const pct = (d: number) => `${(Math.min(Math.max(d, 0), SCALE_MAX) / SCALE_MAX) * 100}%`;

type Mode = "volume" | "boxes";

// Калькулятор: вес и объём (или коробки), категория → плотность, тариф по сетке, цена и срок.
// Сетки - src/content/tariff-grids.ts, расчёт - src/lib/calcTariff.ts.
export function Calculator() {
  const id = useId();
  const [mode, setMode] = useState<Mode>("volume");
  const [weight, setWeight] = useState("100");
  const [volume, setVolume] = useState("0,5");
  const [box, setBox] = useState({ count: "4", l: "60", w: "40", h: "50" });
  const [catId, setCatId] = useState<CategoryId>(CATEGORIES[0].id);

  const cat = getCategory(catId);
  const w = parseNum(weight);
  const boxes = { count: parseNum(box.count), l: parseNum(box.l), w: parseNum(box.w), h: parseNum(box.h) };
  const v = mode === "volume" ? parseNum(volume) : boxesVolume(boxes.count, boxes.l, boxes.w, boxes.h);
  const result = calcTariff({ category: catId, weight: w, volume: v });
  const density = result.status === "empty" ? null : result.density;
  const days = `${cat.days[0]}-${cat.days[1]} дней`;

  const message =
    result.status === "empty"
      ? site.messages.default
      : buildRequestText({
          categoryLabel: cat.label,
          weight: w,
          volume: v,
          boxes: mode === "boxes" ? boxes : null,
          result,
        });

  const notes: string[] = [];
  if (result.status === "empty" || result.status === "below-min") notes.push(result.message);
  if (result.status === "individual") notes.push(result.reason);

  const field = (key: string, label: string, value: string, onChange: (s: string) => void) => (
    <div className="calc__field" key={key}>
      <label htmlFor={`${id}-${key}`}>{label}</label>
      <input
        id={`${id}-${key}`}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
  const boxField = (k: keyof typeof box, label: string) =>
    field(`box-${k}`, label, box[k], (s) => setBox((b) => ({ ...b, [k]: s })));

  return (
    <div className="calc">
      <form className="calc__form" onSubmit={(e) => e.preventDefault()} noValidate>
        <div className="calc__modes" role="group" aria-label="Как указать объём">
          {(
            [
              ["volume", "Знаю объём"],
              ["boxes", "Посчитать по коробкам"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              className="calc__mode"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              {label}
            </button>
          ))}
        </div>

        {field("kg", "Вес, кг", weight, setWeight)}
        {mode === "volume" ? (
          field("m3", "Объём, м³", volume, setVolume)
        ) : (
          <>
            {boxField("count", "Коробок, шт")}
            <div className="calc__dims">
              {boxField("l", "Длина, см")}
              {boxField("w", "Ширина, см")}
              {boxField("h", "Высота, см")}
            </div>
          </>
        )}

        <div className="calc__scale">
          <p className="calc__scale-head">
            <span>Плотность</span>
            <span className="calc__scale-value">
              {density === null ? "-" : `${fmtInt(density)} кг/м³`}
              {mode === "boxes" && v > 0 && <i> · {fmtNum(v, 3)} м³</i>}
            </span>
          </p>
          <div className="calc__scale-bar" aria-hidden>
            <span
              className="calc__scale-zone"
              style={{
                left: pct(cat.density.min),
                right: cat.density.max === null ? 0 : `calc(100% - ${pct(cat.density.max)})`,
              }}
            />
            {density !== null && <span className="calc__scale-mark" style={{ left: pct(density) }} />}
          </div>
        </div>

        <fieldset className="calc__plans">
          <legend>Категория</legend>
          {CATEGORIES.map((c) => (
            <label key={c.id} className="calc__plan" data-checked={c.id === catId}>
              <input
                type="radio"
                name={`${id}-plan`}
                value={c.id}
                checked={c.id === catId}
                onChange={() => setCatId(c.id)}
              />
              <span>{c.label}</span>
            </label>
          ))}
          {cat.hint && <p className="calc__hint">{cat.hint}</p>}
        </fieldset>
      </form>

      <div className="calc__result" aria-live="polite">
        <dl className="calc__numbers">
          <div className="calc__price">
            <dt>Ориентировочная цена</dt>
            {result.status === "price" ? (
              <dd>
                ≈ {fmtInt(result.total)} $
                <span className="calc__range">
                  от {fmtInt(result.min)} до {fmtInt(result.max)} $
                </span>
              </dd>
            ) : result.status === "individual" ? (
              <dd className="calc__price-text">{result.message}</dd>
            ) : (
              <dd>-</dd>
            )}
          </div>
        </dl>
        {/* три показателя в ряд; подписи стоят в одной строке, значения - в другой */}
        <dl className="calc__numbers calc__stats">
          <div>
            <dt>Тариф</dt>
            <dd>
              {result.status === "price" ? `${fmtRate(result.rate)} $/кг` : "-"}
              {result.status === "price" && (
                <small>
                  ± {fmtRate(RATE_SPREAD.min)}-{fmtRate(RATE_SPREAD.max)}
                </small>
              )}
            </dd>
          </div>
          <div>
            <dt>Ступень веса</dt>
            <dd>{result.status === "price" ? `${result.tier.from}-${result.tier.to} кг` : "-"}</dd>
          </div>
          <div>
            <dt>Срок</dt>
            <dd>{days}</dd>
          </div>
        </dl>
        {result.status === "price" && result.next && (
          <p className="calc__next">
            От {result.next.from} кг тариф {fmtRate(result.next.rate)} $/кг
          </p>
        )}
        {notes.length > 0 && (
          <ul className="calc__notes">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <InkButton href={whatsappLink(message)} variant="red" external className="calc__cta">
          <WhatsAppIcon className="h-5 w-5" />
          {calc.cta}
        </InkButton>
        <p className="calc__disclaimer">{tariffs.disclaimer}</p>
      </div>
    </div>
  );
}
