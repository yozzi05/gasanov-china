// Расчёт доставки по тарифным сеткам (src/content/tariff-grids.ts).
// Чистые функции без React: их проверяют тесты (calcTariff.test.ts) и использует Calculator.
// Импорты относительные - чтобы тесты запускались обычным Node без сборщика.
import {
  CATEGORIES,
  INDIVIDUAL_FROM_KG,
  RATE_SPREAD,
  WEIGHT_TIERS,
  type Category,
  type CategoryId,
  type DensityRow,
  type WeightStep,
} from "../content/tariff-grids";

export type Tier = { from: number; to: number };

export type CalcResult =
  | { status: "empty"; message: string }
  | { status: "below-min"; message: string; density: number }
  | { status: "individual"; message: string; reason: string; density: number }
  | {
      status: "price";
      density: number;
      /** тариф, $/кг */
      rate: number;
      /** ≈ тариф × вес, округлено до целого */
      total: number;
      /** вилка: тариф ∓ 0,30 $/кг */
      min: number;
      max: number;
      tier: Tier;
      /** следующая ступень веса, если на ней тариф ниже.
       *  over: граница в неё не входит («Свыше 100 кг»), иначе «От 100 кг» */
      next: { from: number; rate: number; over?: boolean } | null;
    };

export const EMPTY_MESSAGE = "Введите вес и объём, чтобы увидеть цену";
export const INDIVIDUAL = "Индивидуальный расчёт";
export const DENSITY_LOW = "Плотность ниже 100 кг/м³ - лёгкий объёмный груз";
export const DENSITY_HIGH_SHOES = "Плотность выше 250 кг/м³ для обуви считаем отдельно";
export const HEAVY_DEFAULT = `Партии от ${INDIVIDUAL_FROM_KG} кг считаем индивидуально`;

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

/** Значение поля после потери фокуса: точку показываем запятой («0.2» → «0,2») */
export const commaDecimal = (s: string) => s.trim().replace(/\./g, ",");

/** Число из поля ввода: принимает запятую и точку, пробелы между разрядами */
export function parseNum(s: string): number {
  const n = parseFloat(s.replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// ── Форматирование ──────────────────────────────────────────────────────────

const ru = (n: number, digits: number) =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

/** 3.2 → «3,20» */
export const fmtRate = (n: number) => n.toFixed(2).replace(".", ",");
/** Целое с разрядами: 1250 → «1 250» */
export const fmtInt = (n: number) => ru(Math.round(n), 0);
export const fmtNum = ru;

// ── Помощник расчёта объёма ─────────────────────────────────────────────────

export type Unit = "см" | "м" | "мм";
export const UNITS: readonly Unit[] = ["см", "м", "мм"];
const TO_M: Record<Unit, number> = { см: 0.01, м: 1, мм: 0.001 };

export type Shape = "box" | "cylinder";
/** Размер со своими единицами */
export type Dim = { value: number; unit: Unit };
export type Places =
  | { shape: "box"; count: number; l: Dim; w: Dim; h: Dim }
  | { shape: "cylinder"; count: number; d: Dim; h: Dim };

const m = (d: Dim) => d.value * TO_M[d.unit];

/**
 * Объём мест, м³, округлён до 3 знаков. 0 - если что-то не заполнено.
 * Коробка: Д × Ш × В × кол-во; цилиндр: π × (D/2)² × В × кол-во.
 */
export function placesVolume(p: Places): number {
  const dims = p.shape === "box" ? [p.l, p.w, p.h] : [p.d, p.h];
  if (!(p.count > 0) || dims.some((d) => !(d.value > 0))) return 0;
  const one = p.shape === "box" ? m(p.l) * m(p.w) * m(p.h) : Math.PI * (m(p.d) / 2) ** 2 * m(p.h);
  return Math.round(one * p.count * 1000) / 1000;
}

/** Объём для поля ввода: 0.48 → «0,480» */
export const fmtVolume = (v: number) => v.toFixed(3).replace(".", ",");

/** 1 коробка, 2 коробки, 5 коробок */
export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

/** Строка для заявки: «5 коробок 60×40×40 см», «3 цилиндра Ø40×100 см» */
export function placesText(p: Places): string {
  const dims = p.shape === "box" ? [p.l, p.w, p.h] : [p.d, p.h];
  const same = dims.every((d) => d.unit === dims[0].unit);
  const size = dims
    .map((d) => ru(d.value, 3) + (same ? "" : ` ${d.unit}`))
    .join("×");
  const sizeText = (p.shape === "cylinder" ? "Ø" : "") + size + (same ? ` ${dims[0].unit}` : "");
  const word =
    p.shape === "box"
      ? plural(p.count, "коробка", "коробки", "коробок")
      : plural(p.count, "цилиндр", "цилиндра", "цилиндров");
  return `${ru(p.count, 0)} ${word} ${sizeText}`;
}

/** Индекс ступени веса: нижняя граница входит, верхняя нет */
export function tierIndex(weight: number): number {
  return WEIGHT_TIERS.findIndex((t) => weight >= t.from && weight < t.to);
}

/** Ступень сборного груза: нижняя граница входит, верхняя - только при toInclusive */
export function stepIndex(steps: readonly WeightStep[], weight: number): number {
  return steps.findIndex((s) => weight >= s.from && (weight < s.to || (s.toInclusive === true && weight === s.to)));
}

/** Строка сетки по плотности: нижняя граница входит, верхняя нет (кроме toInclusive) */
export function findRow(grid: readonly DensityRow[], density: number): DensityRow | null {
  return (
    grid.find(
      (row) =>
        density >= row.from &&
        (row.to === null || density < row.to || (row.toInclusive === true && density === row.to)),
    ) ?? null
  );
}

/**
 * Расчёт для категории. Проверки идут по порядку, показываем первую сработавшую:
 * 1) нет веса или объёма; 2) вес ниже минимума; 3) вес от 200 кг;
 * 4) плотность вне диапазона категории; 5) цена.
 */
export function calcTariff(input: { category: CategoryId; weight: number; volume: number }): CalcResult {
  const cat = getCategory(input.category);
  const { weight, volume } = input;
  if (!(weight > 0) || !(volume > 0)) return { status: "empty", message: EMPTY_MESSAGE };

  const density = weight / volume;
  if (weight < cat.minKg) return { status: "below-min", message: cat.minKgMessage, density };

  if (weight >= INDIVIDUAL_FROM_KG)
    return { status: "individual", message: INDIVIDUAL, reason: cat.individualNote ?? HEAVY_DEFAULT, density };

  if (density < cat.density.min)
    return { status: "individual", message: INDIVIDUAL, reason: DENSITY_LOW, density };
  if (cat.density.max !== null && density > cat.density.max)
    return { status: "individual", message: INDIVIDUAL, reason: DENSITY_HIGH_SHOES, density };

  let tier: Tier;
  let rate: number;
  let next: { from: number; rate: number; over?: boolean } | null = null;

  if (cat.steps) {
    const si = stepIndex(cat.steps, weight);
    const step = cat.steps[si];
    tier = { from: step.from, to: step.to };
    rate = step.rate;
    const after = cat.steps[si + 1];
    if (after && after.rate < rate) next = { from: after.from, rate: after.rate, over: step.toInclusive === true };
  } else {
    const ti = tierIndex(weight);
    tier = WEIGHT_TIERS[ti];
    const row = cat.grid ? findRow(cat.grid, density) : null;
    // сюда не попадаем: плотность уже проверена по диапазону категории
    if (!row) return { status: "individual", message: INDIVIDUAL, reason: DENSITY_LOW, density };
    rate = row.rates[ti];
    if (ti < WEIGHT_TIERS.length - 1 && row.rates[ti + 1] < rate)
      next = { from: WEIGHT_TIERS[ti + 1].from, rate: row.rates[ti + 1] };
  }

  return {
    status: "price",
    density,
    rate,
    total: Math.round(rate * weight),
    min: Math.round((rate - RATE_SPREAD.max) * weight),
    max: Math.round((rate + RATE_SPREAD.max) * weight),
    tier: { from: tier.from, to: tier.to },
    next,
  };
}

/** Текст заявки в WhatsApp */
export function buildRequestText(p: {
  categoryLabel: string;
  weight: number;
  volume: number;
  /** места из помощника расчёта объёма; null - объём ввели руками */
  places?: Places | null;
  result: CalcResult;
}): string {
  const { result } = p;
  const lines = [
    "Здравствуйте, Заур! Хочу получить точный расчёт доставки из Китая.",
    `Категория: ${p.categoryLabel}`,
  ];
  if (p.weight > 0) lines.push(`Вес: ${ru(p.weight, 2)} кг`);
  if (p.places) lines.push(`Места: ${placesText(p.places)}`);
  if (p.volume > 0) lines.push(`Объём: ${ru(p.volume, 3)} м³`);
  if (result.status !== "empty") lines.push(`Плотность: ${fmtInt(result.density)} кг/м³`);

  if (result.status === "price")
    lines.push(
      `Ориентир с сайта: ≈ ${fmtInt(result.total)} $ (от ${fmtInt(result.min)} до ${fmtInt(result.max)} $), ` +
        `тариф ${fmtRate(result.rate)} $/кг`,
    );
  else if (result.status === "individual") lines.push(`Нужен индивидуальный расчёт: ${result.reason}`);
  else if (result.status === "below-min") lines.push(result.message);
  return lines.join("\n");
}
