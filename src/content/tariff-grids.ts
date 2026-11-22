// ─────────────────────────────────────────────────────────────────────────────
// ТАРИФНЫЕ СЕТКИ КАЛЬКУЛЯТОРА. Цены правятся здесь - код трогать не нужно.
// Расчёт по этим данным - src/lib/calcTariff.ts.
//
// Ступени веса (колонки сеток): 10-50, 50-100, 100-200 кг.
// Нижняя граница входит в ступень, верхняя нет: 50 кг считается по 50-100,
// 100 кг - по 100-200. С 200 кг расчёт индивидуальный.
// Строки - плотность груза в кг/м³, так же: 200 кг/м³ - строка 200-220.
// to: null - последняя строка открытая («350 и выше»).
// ─────────────────────────────────────────────────────────────────────────────

/** Тариф в $/кг для трёх ступеней веса: [10-50, 50-100, 100-200] */
export type Rates = readonly [number, number, number];

export type DensityRow = {
  from: number;
  /** null - строка без верхней границы */
  to: number | null;
  rates: Rates;
  /** верхняя граница входит в строку (последняя строка обуви: 250 ровно - ещё 240-250) */
  toInclusive?: boolean;
};

/**
 * Ступень веса со своим тарифом (сборный груз, без сетки плотности).
 * Нижняя граница входит в ступень; верхняя - только при toInclusive.
 */
export type WeightStep = { from: number; to: number; rate: number; toInclusive?: boolean };

export type CategoryId = "consolidated" | "clothes" | "shoes" | "household";

export type Category = {
  id: CategoryId;
  label: string;
  days: readonly [number, number];
  minKg: number;
  /** текст, если вес меньше минимума */
  minKgMessage: string;
  /** допустимая плотность, кг/м³: вне её - индивидуальный расчёт */
  density: { min: number; max: number | null };
  /** тариф по ступеням веса без сетки (сборный груз) */
  steps?: readonly WeightStep[];
  grid?: readonly DensityRow[];
  /** подсказка под кнопками категорий */
  hint?: string;
  /** строка про нижний тариф при индивидуальном расчёте от 200 кг */
  individualNote?: string;
};

/** Ступени веса, кг. Индексы совпадают с колонками сеток. */
export const WEIGHT_TIERS = [
  { from: 10, to: 50 },
  { from: 50, to: 100 },
  { from: 100, to: 200 },
] as const;

/** С этого веса цену не показываем - расчёт индивидуальный */
export const INDIVIDUAL_FROM_KG = 200;

/** Итоговый тариф может отличаться на 0,10-0,30 $/кг; вилка цены считается по 0,30 */
export const RATE_SPREAD = { min: 0.1, max: 0.3 } as const;

const r = (a: number, b: number, c: number): Rates => [a, b, c];

const CLOTHES: readonly DensityRow[] = [
  { from: 100, to: 190, rates: r(3.4, 3.4, 3.4) },
  { from: 190, to: 200, rates: r(3.4, 3.4, 3.2) },
  { from: 200, to: 220, rates: r(3.4, 3.4, 3.2) },
  { from: 220, to: 240, rates: r(3.4, 3.3, 3.1) },
  { from: 240, to: 260, rates: r(3.4, 3.2, 3.0) },
  { from: 260, to: 280, rates: r(3.3, 3.1, 2.9) },
  { from: 280, to: 300, rates: r(3.2, 3.0, 2.8) },
  { from: 300, to: 350, rates: r(3.1, 2.9, 2.7) },
  { from: 350, to: null, rates: r(3.0, 2.8, 2.7) },
];

const SHOES: readonly DensityRow[] = [
  { from: 100, to: 190, rates: r(3.6, 3.5, 3.3) },
  { from: 190, to: 200, rates: r(3.5, 3.4, 3.3) },
  { from: 200, to: 210, rates: r(3.4, 3.3, 3.2) },
  { from: 210, to: 220, rates: r(3.3, 3.2, 3.1) },
  { from: 220, to: 230, rates: r(3.3, 3.1, 3.0) },
  { from: 230, to: 240, rates: r(3.3, 3.0, 2.9) },
  { from: 240, to: 250, rates: r(3.3, 2.9, 2.8), toInclusive: true },
];

// Сетка «Монотовары» - для хозтоваров
const MONO: readonly DensityRow[] = [
  { from: 100, to: 110, rates: r(3.4, 3.3, 3.1) },
  { from: 110, to: 120, rates: r(3.2, 3.1, 2.9) },
  { from: 120, to: 130, rates: r(3.1, 3.0, 2.8) },
  { from: 130, to: 140, rates: r(3.0, 2.8, 2.8) },
  { from: 140, to: 150, rates: r(2.9, 2.8, 2.7) },
  { from: 150, to: 160, rates: r(2.8, 2.7, 2.7) },
  { from: 160, to: 170, rates: r(2.8, 2.7, 2.6) },
  { from: 170, to: 180, rates: r(2.7, 2.7, 2.6) },
  { from: 180, to: 190, rates: r(2.7, 2.6, 2.6) },
  // ПРОВЕРИТЬ: 2,70 в колонке 50-100 выше, чем в строке 180-190 (2,60) -
  // возможно, опечатка в исходной таблице. Пока оставлено как в таблице.
  { from: 190, to: 200, rates: r(2.7, 2.7, 2.6) },
  { from: 200, to: 250, rates: r(2.7, 2.6, 2.4) },
  { from: 250, to: 300, rates: r(2.6, 2.5, 2.3) },
  { from: 300, to: 400, rates: r(2.4, 2.3, 2.0) },
  { from: 400, to: 600, rates: r(2.3, 2.2, 2.0) },
  { from: 600, to: 800, rates: r(2.2, 2.1, 1.9) },
  { from: 800, to: 1000, rates: r(2.1, 2.0, 1.8) },
  { from: 1000, to: null, rates: r(2.0, 1.9, 1.8) },
];

/** Категории калькулятора - в порядке кнопок */
export const CATEGORIES: readonly Category[] = [
  {
    id: "consolidated",
    label: "Сборный груз",
    days: [15, 25],
    minKg: 10,
    minKgMessage: "Минимальный вес отправки - 10 кг",
    density: { min: 100, max: null },
    // от 10 до 100 кг включительно - 3,5 $/кг; свыше 100 и меньше 200 кг - 3,3 $/кг;
    // от 200 кг - индивидуальный расчёт (INDIVIDUAL_FROM_KG)
    steps: [
      { from: 10, to: 100, toInclusive: true, rate: 3.5 },
      { from: 100, to: 200, rate: 3.3 },
    ],
  },
  {
    id: "clothes",
    label: "Одежда",
    days: [15, 20],
    minKg: 10,
    minKgMessage: "Минимальный вес отправки - 10 кг",
    density: { min: 100, max: null },
    grid: CLOTHES,
    individualNote: "Возможен тариф от 1,90 $/кг",
  },
  {
    id: "shoes",
    label: "Обувь",
    days: [15, 20],
    minKg: 10,
    minKgMessage: "Минимальный вес отправки - 10 кг",
    density: { min: 100, max: 250 },
    grid: SHOES,
  },
  {
    id: "household",
    label: "Хозтовары",
    days: [15, 25],
    minKg: 15,
    minKgMessage: "Минимальный вес - 15 кг одного вида товара",
    density: { min: 100, max: null },
    grid: MONO,
    hint: "Хозтовары, автотовары, товары для дома и другие однотипные товары",
    individualNote: "Для партий от нескольких тонн - тариф от 1 $/кг",
  },
];
