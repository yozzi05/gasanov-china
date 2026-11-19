// Обложка для соцсетей (Open Graph) 1200×630 и иконка для iOS.
// Запуск: npm run og
import sharp from "sharp";
import fs from "node:fs";

const W = 1200, H = 630;
const seal = fs.readFileSync("src/app/icon.svg", "utf8").replace(/<\/?svg[^>]*>/g, "");

const bg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#D21432"/><stop offset="1" stop-color="#8E0B20"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="44" y="372" font-family="Impact, 'Arial Narrow', Arial, sans-serif" font-size="270"
        fill="#F4EFE6" textLength="1112" lengthAdjust="spacingAndGlyphs">ГАСАНОВ</text>
</svg>`;

const fg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7D091C" stop-opacity="0"/><stop offset="1" stop-color="#7D091C" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <rect y="330" width="${W}" height="300" fill="url(#s)"/>
  <g transform="translate(44 40) scale(0.72)">${seal}</g>
  <text x="130" y="92" font-family="Impact, Arial, sans-serif" font-size="44" fill="#F4EFE6" letter-spacing="2">G17 · ДОСТАВКА ИЗ КИТАЯ</text>
  <text font-family="Impact, 'Arial Narrow', Arial, sans-serif" font-size="78" fill="#F4EFE6">
    <tspan x="44" y="492">ДОСТАВКА ИЗ КИТАЯ</tspan>
    <tspan x="44" y="572">ОТ 1 $/КГ ЗА 15 ДНЕЙ</tspan>
  </text>
  <rect x="44" y="594" width="560" height="3" fill="#C9A227"/>
</svg>`;

const person = await sharp("assets/originals/zaur-cutout.png").trim().resize({ height: 600 }).toBuffer();
const pm = await sharp(person).metadata();

await sharp(Buffer.from(bg))
  .composite([
    { input: person, left: W - pm.width - 90, top: H - 600 },
    { input: Buffer.from(fg), left: 0, top: 0 },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile("public/og.jpg");

await sharp(fs.readFileSync("src/app/icon.svg"), { density: 300 })
  .resize(180, 180)
  .flatten({ background: "#C8102E" })
  .png()
  .toFile("src/app/apple-icon.png");

console.log("og.jpg, apple-icon.png - ok");
