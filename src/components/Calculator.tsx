"use client";

import { useId, useState } from "react";
import { site, whatsappLink } from "@/content/site";
import {
  CATEGORIES,
  RATE_SPREAD,
  type CategoryId,
} from "@/content/tariff-grids";
import {
  buildRequestText,
  calcTariff,
  commaDecimal,
  fmtInt,
  fmtRate,
  getCategory,
  parseNum,
  type Places,
} from "@/lib/calcTariff";
import { InkButton } from "./InkButton";
import {
  VolumeHelper,
  VOLUME_HELPER_EMPTY,
  type VolumeHelperState,
} from "./VolumeHelper";
import { WhatsAppIcon } from "./icons";

const { tariffs, calc } = site;

// Шкала плотности: 0 … SCALE_MAX кг/м³, дальше метка стоит у правого края
const SCALE_MAX = 400;
const pct = (d: number) =>
  `${(Math.min(Math.max(d, 0), SCALE_MAX) / SCALE_MAX) * 100}%`;

// Калькулятор: вес и объём (объём можно посчитать помощником по местам), категория →
// плотность, тариф по сетке, цена и срок.
// Сетки - src/content/tariff-grids.ts, расчёт - src/lib/calcTariff.ts.
export function Calculator() {
  const id = useId();
  const [weight, setWeight] = useState("100");
  const [volume, setVolume] = useState("0,5");
  const [catId, setCatId] = useState<CategoryId>(CATEGORIES[0].id);
  // значения помощника; places не null, пока объём в поле посчитан помощником
  const [helper, setHelper] = useState<VolumeHelperState>(VOLUME_HELPER_EMPTY);
  const [places, setPlaces] = useState<Places | null>(null);

  const cat = getCategory(catId);
  const w = parseNum(weight);
  const v = parseNum(volume);
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
          places,
          result,
        });

  const notes: string[] = [];
  if (result.status === "empty" || result.status === "below-min")
    notes.push(result.message);
  if (result.status === "individual") notes.push(result.reason);

  return (
    <div className="calc">
      <form
        className="calc__form"
        onSubmit={(e) => e.preventDefault()}
        noValidate
      >
        <fieldset className="calc__plans">
          <legend>Категория</legend>
          {CATEGORIES.map((c) => (
            <label
              key={c.id}
              className="calc__plan"
              data-checked={c.id === catId}
            >
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
        <div className="calc__field">
          <label htmlFor={`${id}-kg`}>Вес, кг</label>
          <input
            id={`${id}-kg`}
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={() => setWeight(commaDecimal(weight))}
          />
        </div>

        <VolumeHelper
          inputId={`${id}-m3`}
          volume={volume}
          state={helper}
          onManualVolume={(s) => {
            // объём исправили руками - помощник забывает свои значения
            setVolume(s);
            setHelper(VOLUME_HELPER_EMPTY);
            setPlaces(null);
          }}
          onHelperChange={(next, vol, p) => {
            setHelper(next);
            setVolume(vol);
            setPlaces(p);
          }}
        />

        <div className="calc__scale">
          <p className="calc__scale-head">
            <span>Плотность</span>
            <span className="calc__scale-value">
              {density === null ? "-" : `${fmtInt(density)} кг/м³`}
            </span>
          </p>
          <div className="calc__scale-track" aria-hidden>
            <span
              className="calc__scale-label"
              style={{ left: pct(cat.density.min) }}
            >
              зона тарифа
            </span>
            <div className="calc__scale-bar">
              <span
                className="calc__scale-zone"
                style={{
                  left: pct(cat.density.min),
                  right:
                    cat.density.max === null
                      ? 0
                      : `calc(100% - ${pct(cat.density.max)})`,
                }}
              />
              {density !== null && (
                <span
                  className="calc__scale-mark"
                  style={{ left: pct(density) }}
                />
              )}
            </div>
            <p className="calc__scale-ticks">
              {[cat.density.min, cat.density.max].map(
                (b) =>
                  b !== null && (
                    <span key={b} style={{ left: pct(b) }}>
                      {b}
                    </span>
                  ),
              )}
              <span className="calc__scale-unit">кг/м³</span>
            </p>
          </div>
        </div>
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
        {/* тариф, ступень веса и срок в ряд; без цены - только срок.
            Подписи стоят в одной строке, значения - в другой */}
        <dl className="calc__numbers calc__stats">
          {result.status === "price" && (
            <>
              <div>
                <dt>Тариф</dt>
                <dd>
                  {fmtRate(result.rate)} $/кг
                  <small>
                    ± {fmtRate(RATE_SPREAD.min)}-{fmtRate(RATE_SPREAD.max)}
                  </small>
                </dd>
              </div>
              <div>
                <dt>Ступень веса</dt>
                <dd>
                  {result.tier.from}-{result.tier.to} кг
                </dd>
              </div>
            </>
          )}
          <div>
            <dt>Срок</dt>
            <dd>{days}</dd>
          </div>
        </dl>
        {result.status === "price" && result.next && (
          <p className="calc__next">
            {result.next.over ? "Свыше" : "От"} {result.next.from} кг тариф {fmtRate(result.next.rate)} $/кг
          </p>
        )}
        {notes.length > 0 && (
          <ul className="calc__notes">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <InkButton
          href={whatsappLink(message)}
          variant="red"
          external
          className="calc__cta"
        >
          <WhatsAppIcon className="h-5 w-5" />
          {calc.cta}
        </InkButton>
        <p className="calc__disclaimer">{tariffs.disclaimer}</p>
      </div>
    </div>
  );
}
