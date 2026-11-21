// Тесты расчёта доставки. Запуск: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DENSITY_HIGH_SHOES,
  DENSITY_LOW,
  EMPTY_MESSAGE,
  HEAVY_DEFAULT,
  buildRequestText,
  calcTariff,
  commaDecimal,
  fmtVolume,
  parseNum,
  placesText,
  placesVolume,
  plural,
  type CalcResult,
} from "./calcTariff";
import type { CategoryId } from "../content/tariff-grids";

/** Расчёт по весу и плотности (объём подбирается под плотность) */
const at = (category: CategoryId, weight: number, density: number) =>
  calcTariff({ category, weight, volume: weight / density });

function price(r: CalcResult) {
  assert.equal(r.status, "price", `ожидалась цена, а получено: ${JSON.stringify(r)}`);
  return r as Extract<CalcResult, { status: "price" }>;
}
function individual(r: CalcResult) {
  assert.equal(r.status, "individual", `ожидался индивидуальный расчёт: ${JSON.stringify(r)}`);
  return r as Extract<CalcResult, { status: "individual" }>;
}

describe("порядок проверок", () => {
  it("нет веса или объёма - просим ввести", () => {
    assert.deepEqual(calcTariff({ category: "clothes", weight: 0, volume: 0.5 }), {
      status: "empty",
      message: EMPTY_MESSAGE,
    });
    assert.equal(calcTariff({ category: "clothes", weight: 100, volume: 0 }).status, "empty");
  });
  it("вес ниже минимума важнее плотности", () => {
    const r = at("clothes", 9.9, 50);
    assert.equal(r.status, "below-min");
  });
  it("от 200 кг индивидуально, даже при плохой плотности", () => {
    const r = individual(at("clothes", 250, 50));
    assert.equal(r.reason, "Возможен тариф от 1,90 $/кг");
  });
});

describe("границы веса (одежда, плотность 200 - строка 200-220)", () => {
  it("9,9 кг - ниже минимума", () => {
    const r = at("clothes", 9.9, 200);
    assert.deepEqual(r.status === "below-min" && r.message, "Минимальный вес отправки - 10 кг");
  });
  it("10 кг - ступень 10-50", () => {
    const r = price(at("clothes", 10, 200));
    assert.deepEqual(r.tier, { from: 10, to: 50 });
    assert.equal(r.rate, 3.4);
  });
  it("49,9 кг - ещё 10-50", () => assert.deepEqual(price(at("clothes", 49.9, 200)).tier, { from: 10, to: 50 }));
  it("50 кг - уже 50-100", () => {
    const r = price(at("clothes", 50, 200));
    assert.deepEqual(r.tier, { from: 50, to: 100 });
    assert.equal(r.rate, 3.4);
    // на ступени 100-200 тариф ниже - подсказываем
    assert.deepEqual(r.next, { from: 100, rate: 3.2 });
  });
  it("100 кг - 100-200", () => {
    const r = price(at("clothes", 100, 200));
    assert.deepEqual(r.tier, { from: 100, to: 200 });
    assert.equal(r.rate, 3.2);
    assert.equal(r.next, null);
  });
  it("199,9 кг - ещё 100-200", () => assert.deepEqual(price(at("clothes", 199.9, 200)).tier, { from: 100, to: 200 }));
  it("200 кг - индивидуально", () => assert.equal(at("clothes", 200, 200).status, "individual"));
});

describe("границы плотности (обувь, 100 кг - ступень 100-200)", () => {
  it("99 - ниже допустимой", () => assert.equal(individual(at("shoes", 100, 99)).reason, DENSITY_LOW));
  it("100 - строка 100-190", () => assert.equal(price(at("shoes", 100, 100)).rate, 3.3));
  it("200 - строка 200-210", () => assert.equal(price(at("shoes", 100, 200)).rate, 3.2));
  it("250 ровно - ещё строка 240-250", () => assert.equal(price(at("shoes", 100, 250)).rate, 2.8));
  it("251 - выше допустимой для обуви", () =>
    assert.equal(individual(at("shoes", 100, 251)).reason, DENSITY_HIGH_SHOES));
  it("одежда: 251 и 5000 - обычная цена, верхней границы нет", () => {
    assert.equal(price(at("clothes", 100, 251)).rate, 3.0);
    assert.equal(price(at("clothes", 100, 5000)).rate, 2.7);
  });
});

describe("хозтовары (сетка «Монотовары»)", () => {
  it("минимум 15 кг одного вида товара", () => {
    for (const w of [10, 14.9]) {
      const r = at("household", w, 200);
      assert.deepEqual(r.status === "below-min" && r.message, "Минимальный вес - 15 кг одного вида товара");
    }
    assert.equal(at("household", 15, 200).status, "price");
  });
  it("точки из сетки", () => {
    assert.equal(price(at("household", 120, 150)).rate, 2.7); // 150-160, 100-200
    assert.equal(price(at("household", 20, 105)).rate, 3.4); // 100-110, 10-50
    assert.equal(price(at("household", 60, 450)).rate, 2.2); // 400-600, 50-100
    assert.equal(price(at("household", 120, 1200)).rate, 1.8); // 1000+, 100-200
  });
  it("от 200 кг - строка про тариф от 1 $/кг", () =>
    assert.equal(individual(at("household", 300, 200)).reason, "Для партий от нескольких тонн - тариф от 1 $/кг"));
  it("лёгкий груз - индивидуально", () => assert.equal(individual(at("household", 50, 80)).reason, DENSITY_LOW));
});

describe("сборный груз", () => {
  it("фикс 3,5 $/кг, вилка ±0,30, без подсказки про следующую ступень", () => {
    const r = price(calcTariff({ category: "consolidated", weight: 100, volume: 0.5 }));
    assert.equal(r.rate, 3.5);
    assert.equal(r.total, 350);
    assert.equal(r.min, 320);
    assert.equal(r.max, 380);
    assert.equal(r.next, null);
  });
  it("плотность ниже 100 - индивидуально", () => assert.equal(individual(at("consolidated", 100, 60)).reason, DENSITY_LOW));
  it("от 200 кг - индивидуально, общая строка", () =>
    assert.equal(individual(at("consolidated", 200, 200)).reason, HEAVY_DEFAULT));
  it("минимум 10 кг", () => assert.equal(at("consolidated", 9.9, 200).status, "below-min"));
});

describe("одежда: точки сетки", () => {
  it("220-240, ступень 50-100", () => assert.equal(price(at("clothes", 60, 230)).rate, 3.3));
  it("350 и выше, ступень 10-50", () => assert.equal(price(at("clothes", 20, 400)).rate, 3.0));
});

describe("ввод", () => {
  it("запятая и точка", () => {
    assert.equal(parseNum("0,5"), 0.5);
    assert.equal(parseNum("0.5"), 0.5);
    assert.equal(parseNum("1 000"), 1000);
    assert.equal(parseNum(""), 0);
    assert.equal(parseNum("-3"), 0);
    assert.equal(commaDecimal("0.2"), "0,2");
    assert.equal(commaDecimal(" 1.25 "), "1,25");
    assert.equal(commaDecimal("0,480"), "0,480");
  });
});

describe("помощник расчёта объёма", () => {
  const cm = (value: number) => ({ value, unit: "см" as const });
  it("коробка: Д×Ш×В×кол-во, 3 знака", () => {
    assert.equal(placesVolume({ shape: "box", count: 5, l: cm(60), w: cm(40), h: cm(40) }), 0.48);
    assert.equal(fmtVolume(0.48), "0,480");
  });
  it("единицы см / м / мм в одной коробке", () => {
    const v = placesVolume({
      shape: "box",
      count: 2,
      l: { value: 0.6, unit: "м" },
      w: cm(40),
      h: { value: 400, unit: "мм" },
    });
    assert.equal(v, 0.192);
  });
  it("цилиндр: π×(D/2)²×В×кол-во", () => {
    // π × 0,2² × 1 × 3 = 0,37699 → 0,377
    assert.equal(placesVolume({ shape: "cylinder", count: 3, d: cm(40), h: cm(100) }), 0.377);
  });
  it("незаполненный размер или 0 мест - объём 0", () => {
    assert.equal(placesVolume({ shape: "box", count: 1, l: cm(60), w: cm(0), h: cm(40) }), 0);
    assert.equal(placesVolume({ shape: "cylinder", count: 0, d: cm(40), h: cm(100) }), 0);
  });
  it("склонение мест", () => {
    assert.deepEqual(
      [1, 2, 5, 11, 21, 22, 112].map((n) => plural(n, "коробка", "коробки", "коробок")),
      ["коробка", "коробки", "коробок", "коробок", "коробка", "коробки", "коробок"],
    );
  });
  it("строка для заявки", () => {
    assert.equal(placesText({ shape: "box", count: 5, l: cm(60), w: cm(40), h: cm(40) }), "5 коробок 60×40×40 см");
    assert.equal(placesText({ shape: "cylinder", count: 3, d: cm(40), h: cm(100) }), "3 цилиндра Ø40×100 см");
    assert.equal(
      placesText({ shape: "box", count: 1, l: { value: 1.2, unit: "м" }, w: cm(80), h: cm(60) }),
      "1 коробка 1,2 м×80 см×60 см",
    );
  });
});

describe("заявка в WhatsApp", () => {
  it("цена с вилкой и местами из помощника", () => {
    const result = calcTariff({ category: "clothes", weight: 100, volume: 0.48 });
    const cm = (value: number) => ({ value, unit: "см" as const });
    const text = buildRequestText({
      categoryLabel: "Одежда",
      weight: 100,
      volume: 0.48,
      places: { shape: "box", count: 5, l: cm(60), w: cm(40), h: cm(40) },
      result,
    });
    assert.match(text, /Категория: Одежда/);
    assert.match(text, /Места: 5 коробок 60×40×40 см/);
    assert.match(text, /Объём: 0,48 м³/);
    assert.match(text, /Плотность: 208 кг\/м³/);
    assert.match(text, /≈ 320 \$ \(от 290 до 350 \$\), тариф 3,20 \$\/кг/);
  });
  it("индивидуальный расчёт с причиной", () => {
    const text = buildRequestText({
      categoryLabel: "Обувь",
      weight: 100,
      volume: 0.3,
      result: calcTariff({ category: "shoes", weight: 100, volume: 0.3 }),
    });
    assert.match(text, /Расчёт: индивидуальный - Плотность выше 250/);
    assert.doesNotMatch(text, /Места:/);
  });
});
