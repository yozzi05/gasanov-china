// Рисует дерево первого экрана в два SVG-файла (public/art/tree-back.svg и tree-front.svg).
// Дерево процедурное, но с фиксированным зерном — каждый запуск даёт тот же рисунок.
// В отдельных файлах оно не раздувает HTML страницы и кэшируется браузером.
// Запуск: npm run art
import fs from "node:fs";

const SEED = 23;
// Поле с запасом вокруг базового квадрата 1000×1000: ветви выходят за его края.
// Эти же числа использует src/components/InkTree.tsx.
const VIEW = { x: -400, y: -250, w: 1800, h: 1300 };

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const f = (n) => String(Math.round(n));
const f1 = (n) => String(Math.round(n * 10) / 10);

const rnd = rng(SEED);
const tiers = [];
const blossoms = [[], [], []];
const box = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
const grow = (x, y, r = 0) => {
  box.x0 = Math.min(box.x0, x - r); box.y0 = Math.min(box.y0, y - r);
  box.x1 = Math.max(box.x1, x + r); box.y1 = Math.max(box.y1, y + r);
};
const dot = (x, y, r) => {
  grow(x, y, r);
  return `M${f(x - r)} ${f(y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(r * 2)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-r * 2)} 0`;
};

const MAX = 7;
function branch(x, y, a, len, depth) {
  const ex = x + Math.cos(a) * len;
  const ey = y + Math.sin(a) * len;
  const bend = (rnd() - 0.5) * len * 0.5;
  const cx = (x + ex) / 2 + Math.cos(a + Math.PI / 2) * bend;
  const cy = (y + ey) / 2 + Math.sin(a + Math.PI / 2) * bend;
  (tiers[depth] ??= []).push(`M${f(x)} ${f(y)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`);
  grow(ex, ey);

  if (depth >= 4) {
    const n = 1 + Math.floor(rnd() * 2.4);
    for (let i = 0; i < n; i++) {
      const R = 30 + depth * 8;
      const bx = ex + (rnd() - 0.5) * R * 2.2;
      const by = ey + (rnd() - 0.5) * R * 1.3 - 8;
      if (rnd() > 0.35) blossoms[0].push(dot(bx, by, 22 + rnd() * 34));
      if (rnd() > 0.25) blossoms[1].push(dot(bx + (rnd() - 0.5) * 36, by + (rnd() - 0.5) * 26, 4 + rnd() * 11));
      const k = Math.floor(rnd() * 3);
      for (let j = 0; j < k; j++)
        blossoms[2].push(dot(bx + (rnd() - 0.5) * 70, by + (rnd() - 0.5) * 50, 1.4 + rnd() * 3));
    }
  }
  if (depth >= MAX) return;
  const kids = depth < 2 ? 2 : rnd() > 0.72 ? 3 : 2;
  for (let i = 0; i < kids; i++) {
    const spread = (i - (kids - 1) / 2) * (0.62 + rnd() * 0.34);
    const na = a + spread + (rnd() - 0.5) * 0.3 + (a < -Math.PI / 2 ? -0.06 : 0.06);
    branch(ex, ey, na, len * (0.7 + rnd() * 0.14), depth + 1);
  }
}
branch(560, 1000, -Math.PI / 2 - 0.22, 250, 0);

const WIDTHS = [34, 22, 14, 9, 5.5, 3.4, 2.2, 1.4];
const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}">`;

const back =
  head +
  `<path d="${blossoms[0].join("")}" fill="#8E0B20" opacity=".42"/>` +
  `<g fill="none" stroke="#1B0C0C" stroke-linecap="round">` +
  tiers.map((t, i) => `<path d="${t.join("")}" stroke-width="${WIDTHS[i] ?? 1.2}"/>`).join("") +
  `</g><path d="${blossoms[1].join("")}" fill="#E8475B" opacity=".7"/></svg>`;
const front = head + `<path d="${blossoms[2].join("")}" fill="#F7CFC9"/></svg>`;

fs.mkdirSync("public/art", { recursive: true });
fs.writeFileSync("public/art/tree-back.svg", back);
fs.writeFileSync("public/art/tree-front.svg", front);

const fits =
  box.x0 >= VIEW.x && box.y0 >= VIEW.y && box.x1 <= VIEW.x + VIEW.w && box.y1 <= VIEW.y + VIEW.h;
console.log(
  `tree: back ${(back.length / 1024).toFixed(1)} KB, front ${(front.length / 1024).toFixed(1)} KB;`,
  `bbox ${f(box.x0)},${f(box.y0)} … ${f(box.x1)},${f(box.y1)}`,
  fits ? "— в поле помещается" : "— ВНИМАНИЕ: выходит за поле VIEW, увеличьте его",
);
