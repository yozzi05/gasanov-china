"use client";

import { useId, useState } from "react";
import { site, whatsappLink } from "@/content/site";
import { InkButton } from "./InkButton";
import { WhatsAppIcon } from "./icons";

const { tariffs, calc } = site;
const fmt = (n: number, digits = 0) =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
const toNum = (s: string) => {
  const n = parseFloat(s.replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// Калькулятор: вес, объём, категория → плотность, ориентировочная цена и срок.
// Тарифы берутся из src/content/site.ts.
export function Calculator() {
  const id = useId();
  const [weight, setWeight] = useState("100");
  const [volume, setVolume] = useState("0,5");
  const [planId, setPlanId] = useState<string>(tariffs.plans[0].id);

  const plan = tariffs.plans.find((p) => p.id === planId) ?? tariffs.plans[0];
  const w = toNum(weight);
  const v = toNum(volume);
  const ready = w > 0 && v > 0;
  const density = ready ? w / v : 0;
  const [pMin, pMax] = plan.pricePerKg;
  const priceText = !ready
    ? "—"
    : pMin === pMax
      ? `≈ ${fmt(w * pMin)} $`
      : `${fmt(w * pMin)} – ${fmt(w * pMax)} $`;
  const daysText = `${plan.days[0]}–${plan.days[1]} дней`;

  const notes: string[] = [];
  if (ready && w < plan.minKg) notes.push(`Минимальная партия — ${plan.minKg} кг.`);
  if (ready && density < tariffs.minDensity)
    notes.push(
      `Плотность ниже ${tariffs.minDensity} кг/м³ — лёгкий объёмный груз считаем индивидуально, цена за кг будет выше.`,
    );
  if (ready && w >= tariffs.individualFromKg)
    notes.push(
      "discountFromKg" in plan
        ? `От ${plan.discountFromKg} кг на эту категорию действует скидка.`
        : `От ${tariffs.individualFromKg} кг — индивидуальный расчёт, цена обычно ниже.`,
    );

  const message = ready
    ? `Здравствуйте, Заур! Хочу получить точный расчёт доставки из Китая.\n` +
      `Категория: ${plan.label}\nВес: ${fmt(w, 2)} кг\nОбъём: ${fmt(v, 3)} м³\n` +
      `Плотность: ${fmt(density)} кг/м³\nОриентир с сайта: ${priceText}, ${daysText}`
    : site.messages.default;

  return (
    <div className="calc">
      <form className="calc__form" onSubmit={(e) => e.preventDefault()} noValidate>
        <div className="calc__field">
          <label htmlFor={`${id}-w`}>Вес, кг</label>
          <input
            id={`${id}-w`}
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="calc__field">
          <label htmlFor={`${id}-v`}>Объём, м³</label>
          <input
            id={`${id}-v`}
            inputMode="decimal"
            autoComplete="off"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
          />
        </div>
        <fieldset className="calc__plans">
          <legend>Категория</legend>
          {tariffs.plans.map((p) => (
            <label key={p.id} className="calc__plan" data-checked={p.id === planId}>
              <input
                type="radio"
                name={`${id}-plan`}
                value={p.id}
                checked={p.id === planId}
                onChange={() => setPlanId(p.id)}
              />
              <span>{p.label}</span>
            </label>
          ))}
        </fieldset>
      </form>

      <div className="calc__result" aria-live="polite">
        <dl className="calc__numbers">
          <div className="calc__price">
            <dt>Ориентировочная цена</dt>
            <dd>{priceText}</dd>
          </div>
          <div>
            <dt>Плотность</dt>
            <dd>{ready ? `${fmt(density)} кг/м³` : "—"}</dd>
          </div>
          <div>
            <dt>Срок</dt>
            <dd>{daysText}</dd>
          </div>
        </dl>
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
