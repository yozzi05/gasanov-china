// Тесты расчёта доставки. Запуск: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DENSITY_HIGH_SHOES,
  DENSITY_LOW,
  EMPTY_MESSAGE,
  HEAVY_DEFAULT,
  boxesVolume,
  buildRequestText,
  calcTariff,
  parseNum,
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
  });
  it("объём по коробкам", () => {
    assert.equal(boxesVolume(4, 60, 40, 50), 0.48);
    assert.equal(boxesVolume(0, 60, 40, 50), 0);
  });
});

describe("заявка в WhatsApp", () => {
  it("цена с вилкой и коробками", () => {
    const result = calcTariff({ category: "clothes", weight: 100, volume: 0.48 });
    const text = buildRequestText({
      categoryLabel: "Одежда",
      weight: 100,
      volume: 0.48,
      boxes: { count: 4, l: 60, w: 40, h: 50 },
      result,
    });
    assert.match(text, /Категория: Одежда/);
    assert.match(text, /Коробки: 4 шт\. по 60×40×50 см/);
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
  });
});
