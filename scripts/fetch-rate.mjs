// Запрашивает курс юаня ЦБ РФ и сохраняет в src/content/rate.json.
// Запускается автоматически перед каждой сборкой (npm run build).
// Сервис с курсом отвечает нестабильно, поэтому делаем несколько попыток;
// если ни одна не удалась - остаётся прошлое сохранённое значение.
import fs from "node:fs";

const API = "https://www.cbr-xml-daily.ru/daily_json.js";
const FILE = "src/content/rate.json";
const TRIES = 4;

async function once() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(API, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const cny = d?.Valute?.CNY;
    const value = cny ? cny.Value / (cny.Nominal || 1) : NaN;
    if (!Number.isFinite(value) || value <= 0) throw new Error("нет курса CNY в ответе");
    return { value: Math.round(value * 10000) / 10000, date: String(d.Date).slice(0, 10) };
  } finally {
    clearTimeout(timer);
  }
}

let saved = null;
for (let i = 1; i <= TRIES && !saved; i++) {
  try {
    saved = await once();
  } catch (e) {
    console.log(`курс: попытка ${i} из ${TRIES} не удалась (${e.name === "AbortError" ? "таймаут" : e.message})`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

if (saved) {
  fs.writeFileSync(FILE, JSON.stringify(saved, null, 2) + "\n");
  console.log(`курс: 1 CNY = ${saved.value} RUB на ${saved.date}`);
} else if (fs.existsSync(FILE)) {
  console.log("курс: сервис не ответил, оставляю прошлое значение", fs.readFileSync(FILE, "utf8").trim());
} else {
  fs.writeFileSync(FILE, JSON.stringify({ value: 0, date: "" }, null, 2) + "\n");
  console.log("курс: сервис не ответил и сохранённого значения нет - блок будет без цифры");
}
