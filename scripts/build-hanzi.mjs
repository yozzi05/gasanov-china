// Собирает контуры штрихов нужных иероглифов в src/content/hanzi-data.json,
// чтобы не грузить их с CDN и не подключать китайский шрифт.
// Запуск: npm run hanzi
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const CHARS = "货运物流质量工厂汇率信任佛山莫斯科";
const out = {};
for (const ch of CHARS) {
  const d = require(`hanzi-writer-data/${ch}.json`);
  out[ch] = { strokes: d.strokes, medians: d.medians };
}
fs.writeFileSync("src/content/hanzi-data.json", JSON.stringify(out));
console.log("hanzi:", Object.keys(out).join(""));
