// Нарезает исходники из assets/originals в public/images: AVIF + WebP нужных ширин.
// Запуск: npm run images
// Только часть картинок: npm run images -- zaur-smile   (по началу имени файла)
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = "assets/originals";
const OUT = "public/images";
const WIDTHS = [96, 200, 360, 640, 828, 1080, 1440, 1920];

// Вырезанный портрет для красного фона первого экрана (zaur-smile):
// 1) чуть сжимаем альфа-маску (около 1 px), чтобы по волосам и бороде не осталось светлой каймы;
// 2) добавляем тёплый красный отсвет по контуру - как будто на портрет светит красная стена;
// 3) рядом сохраняем мягкую тень силуэта (<имя>-shadow.webp) - она ложится на буквы.
// Нижний край (ровный срез по груди) и боковые срезы плеч не трогаем.
async function redWallPortrait(img, name) {
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const N = W * H;
  const gray = (buf) => sharp(buf, { raw: { width: W, height: H, channels: 1 } });

  // 1. сжатие маски: размываем альфу и сдвигаем порог
  const alpha0 = Buffer.alloc(N);
  for (let i = 0; i < N; i++) alpha0[i] = data[i * 4 + 3];
  const A = await gray(alpha0).blur(1.1).linear(1.5, -0.5 * 255).extractChannel(0).raw().toBuffer();
  for (let i = 0; i < N; i++) A[i] = Math.min(A[i], alpha0[i]);

  // 2. отсвет: чем ближе точка к краю силуэта, тем сильнее красный оттенок.
  //    У краёв кадра размытие продолжает картинку, поэтому срезы плеч и груди отсвета не получают.
  const inner = await gray(A).blur(W * 0.008).extractChannel(0).raw().toBuffer();
  const TINT = [226, 26, 58]; // чуть светлее лакового красного
  for (let i = 0; i < N; i++) {
    const edge = Math.min(1, Math.max(0, 1 - inner[i] / 255) * 2);
    const t = edge * 0.36 * (A[i] / 255);
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(data[i * 4 + c] + (TINT[c] - data[i * 4 + c]) * t);
    data[i * 4 + 3] = A[i];
  }

  // 3. тень силуэта: маленькая размытая картинка, растягивается стилями
  const soft = await gray(A).resize({ width: 300 }).blur(8).linear(0.5, 0).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const SN = soft.info.width * soft.info.height;
  const shadow = Buffer.alloc(SN * 4);
  for (let i = 0; i < SN; i++) {
    shadow[i * 4] = 40;
    shadow[i * 4 + 1] = 4;
    shadow[i * 4 + 2] = 10;
    shadow[i * 4 + 3] = soft.data[i];
  }
  await sharp(shadow, { raw: { width: soft.info.width, height: soft.info.height, channels: 4 } })
    .webp({ quality: 60, alphaQuality: 70 })
    .toFile(path.join(OUT, `${name}-shadow.webp`));

  return sharp(data, { raw: { width: W, height: H, channels: 4 } }).png();
}

// Обрезает прозрачные поля только сверху и по бокам; низ остаётся как есть.
async function trimTopAndSides(img) {
  const { data, info } = await img.clone().ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  let x0 = W, x1 = -1, y0 = H;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (data[y * W + x] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
      }
  return sharp(await img.clone().extract({ left: x0, top: y0, width: x1 - x0 + 1, height: H - y0 }).png().toBuffer());
}

// trim: обрезать прозрачные поля у вырезанных фото; trimTopAndSides: то же, но низ не трогать
// process: своя обработка перед нарезкой; avif / webp: качество (по умолчанию 52 и 74)
const OPTIONS = {
  "zaur-smile": { trimTopAndSides: true, max: 1440, avif: 48, process: redWallPortrait },
  "zaur-cutout": { trim: true, max: 1080 },
  "zaur-portrait": { max: 828 },
  "zaur-about": { max: 1440 },
  // у скриншота отзыва обрезаем жёлтую рамку старого сайта
  "review-1": { extract: { left: 58, top: 228, width: 584, height: 778 } },
};

fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.argv[2];
const MANIFEST = "src/content/images.json";
const manifest = ONLY && fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};

for (const file of fs.readdirSync(SRC).sort()) {
  const name = path.parse(file).name;
  if (ONLY && !name.startsWith(ONLY)) continue;
  const opt = OPTIONS[name] ?? {};
  let img = sharp(path.join(SRC, file));
  if (opt.trim) img = sharp(await img.trim().toBuffer());
  if (opt.trimTopAndSides) img = await trimTopAndSides(img);
  if (opt.extract) img = sharp(await img.extract(opt.extract).toBuffer());
  if (opt.process) {
    img = sharp(await (await opt.process(img, name)).toBuffer());
    // для сравнения «до и после»: DUMP_DIR=папка npm run images
    if (process.env.DUMP_DIR) await img.clone().toFile(path.join(process.env.DUMP_DIR, `${name}-processed.png`));
  }
  const meta = await img.metadata();
  manifest[name] = { width: meta.width, height: meta.height };
  const maxW = Math.min(opt.max ?? 1920, meta.width);

  for (const w of WIDTHS) {
    const target = Math.min(w, maxW);
    const base = img.clone().resize({ width: target, withoutEnlargement: true });
    await base.clone().avif({ quality: opt.avif ?? 52, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: opt.webp ?? 74, effort: 5 }).toFile(path.join(OUT, `${name}-${w}.webp`));
  }
  console.log(name, `${meta.width}x${meta.height}`);
}

// Бумажное зерно: маленькая бесшовная плитка шума
{
  const S = 96;
  const buf = Buffer.alloc(S * S * 4);
  let seed = 17;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < S * S; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    buf[i * 4] = buf[i * 4 + 1] = buf[i * 4 + 2] = v;
    buf[i * 4 + 3] = Math.floor(rnd() * 15);
  }
  fs.mkdirSync("public/textures", { recursive: true });
  await sharp(buf, { raw: { width: S, height: S, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile("public/textures/grain.png");
}

fs.writeFileSync("src/content/images.json", JSON.stringify(manifest, null, 2) + "\n");
console.log("ok");
