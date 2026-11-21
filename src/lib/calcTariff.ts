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
      /** следующая ступень веса, если на ней тариф ниже (для сетки; у сборного груза нет) */
      next: { from: number; rate: number } | null;
    };

export const EMPTY_MESSAGE = "Введите вес и объём, чтобы увидеть цену";
export const INDIVIDUAL = "Индивидуальный расчёт";
export const DENSITY_LOW = "Плотность ниже 100 кг/м³ - лёгкий объёмный груз";
export const DENSITY_HIGH_SHOES = "Плотность выше 250 кг/м³ для обуви считаем отдельно";
export const HEAVY_DEFAULT = `Партии от ${INDIVIDUAL_FROM_KG} кг считаем индивидуально`;

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

/** Число из поля ввода: принимает запятую и точку, пробелы между разрядами */
export function parseNum(s: string): number {
  const n = parseFloat(s.replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Объём по коробкам: количество × длина × ширина × высота (см) → м³ */
export function boxesVolume(count: number, l: number, w: number, h: number): number {
  return count > 0 && l > 0 && w > 0 && h > 0 ? (count * l * w * h) / 1_000_000 : 0;
}

/** Индекс ступени веса: нижняя граница входит, верхняя нет */
export function tierIndex(weight: number): number {
  return WEIGHT_TIERS.findIndex((t) => weight >= t.from && weight < t.to);
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

  const ti = tierIndex(weight);
  const tier = WEIGHT_TIERS[ti];
  let rate: number;
  let next: { from: number; rate: number } | null = null;

  if (cat.fixedRate !== undefined) {
    rate = cat.fixedRate;
  } else {
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

// ── Форматирование ──────────────────────────────────────────────────────────

const ru = (n: number, digits: number) =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

/** 3.2 → «3,20» */
export const fmtRate = (n: number) => n.toFixed(2).replace(".", ",");
/** Целое с разрядами: 1250 → «1 250» */
export const fmtInt = (n: number) => ru(Math.round(n), 0);
export const fmtNum = ru;

/** Текст заявки в WhatsApp */
export function buildRequestText(p: {
  categoryLabel: string;
  weight: number;
  volume: number;
  boxes?: { count: number; l: number; w: number; h: number } | null;
  result: CalcResult;
}): string {
  const { result } = p;
  const lines = [
    "Здравствуйте, Заур! Хочу получить точный расчёт доставки из Китая.",
    `Категория: ${p.categoryLabel}`,
  ];
  if (p.weight > 0) lines.push(`Вес: ${ru(p.weight, 2)} кг`);
  if (p.boxes)
    lines.push(
      `Коробки: ${ru(p.boxes.count, 0)} шт. по ${ru(p.boxes.l, 1)}×${ru(p.boxes.w, 1)}×${ru(p.boxes.h, 1)} см`,
    );
  if (p.volume > 0) lines.push(`Объём: ${ru(p.volume, 3)} м³`);
  if (result.status !== "empty") lines.push(`Плотность: ${fmtInt(result.density)} кг/м³`);

  if (result.status === "price")
    lines.push(
      `Ориентир с сайта: ≈ ${fmtInt(result.total)} $ (от ${fmtInt(result.min)} до ${fmtInt(result.max)} $), ` +
        `тариф ${fmtRate(result.rate)} $/кг`,
    );
  else if (result.status === "individual") lines.push(`Расчёт: индивидуальный - ${result.reason}`);
  else if (result.status === "below-min") lines.push(result.message);
  return lines.join("\n");
}
