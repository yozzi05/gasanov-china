// Нарезает исходники из assets/originals в public/images: AVIF + WebP нужных ширин.
// Запуск: npm run images
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = "assets/originals";
const OUT = "public/images";
const WIDTHS = [96, 200, 360, 640, 828, 1080, 1440, 1920];

// trim: обрезать прозрачные поля у вырезанных фото
const OPTIONS = {
  "zaur-cutout": { trim: true, max: 1080 },
  "zaur-portrait": { max: 828 },
  "zaur-about": { max: 1440 },
  // Сцена первого экрана (1672×941). Деревья и крышу не обрезаем: левое дерево прижато
  // к левому и нижнему краю сцены, правое - к правому и нижнему, крыша стоит на своём
  // месте поверх стены.
  // extend: поля стены, достроенные зеркальным отражением края. Они лежат за краем сцены
  // и нужны как запас, когда слой смещается за курсором. Те же числа - в src/app/hero-scene.css.
  "scene-wall": { extend: { left: 32, right: 32, top: 20, bottom: 20 } },
  // clearBelow: под карнизом в вырезке остались тёмные крошки тени - убираем всё ниже 294 px
  "scene-roof": { clearBelow: 294 },
  "scene-trees-left": {},
  "scene-trees-right": {},
  "scene-lantern": { trim: true, max: 200 },
  "scene-lantern-2": { trim: true, max: 200 },
  "zaur-walk": { trim: true, max: 640 },
  // у скриншота отзыва обрезаем жёлтую рамку старого сайта
  "review-1": { extract: { left: 58, top: 228, width: 584, height: 778 } },
};

fs.mkdirSync(OUT, { recursive: true });
const manifest = {};

for (const file of fs.readdirSync(SRC).sort()) {
  const name = path.parse(file).name;
  const opt = OPTIONS[name] ?? {};
  let img = sharp(path.join(SRC, file));
  if (opt.trim) img = sharp(await img.trim().toBuffer());
  if (opt.extract) img = sharp(await img.extract(opt.extract).toBuffer());
  if (opt.clearBelow) {
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = opt.clearBelow * info.width * 4 + 3; i < data.length; i += 4) data[i] = 0;
    img = sharp(await sharp(data, { raw: info }).png().toBuffer());
  }
  if (opt.extend) img = sharp(await img.extend({ ...opt.extend, extendWith: "mirror" }).png().toBuffer());
  const meta = await img.metadata();
  manifest[name] = { width: meta.width, height: meta.height };
  const maxW = Math.min(opt.max ?? 1920, meta.width);

  for (const w of WIDTHS) {
    const target = Math.min(w, maxW);
    const base = img.clone().resize({ width: target, withoutEnlargement: true });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 74, effort: 5 }).toFile(path.join(OUT, `${name}-${w}.webp`));
  }
  console.log(name, `${meta.width}x${meta.height}`);
}

// Кейсы: assets/cases/<id>/ → public/cases/<id>/.
// Фото и скриншоты (*.jpg) нарезаются в AVIF + WebP, в манифест попадают как «cases/<id>/<имя>».
// Видео (video.mp4, уже сжато в H.264) и субтитры (captions.vtt) копируются как есть.
// SKIP: файлы, которые на сайт не попадают (у G17-004 в переписке грубоватое слово -
// её текст дан цитатой в блоке отзывов).
{
  const CASES = "assets/cases";
  const SKIP = new Set(["g17-004/chat.jpg"]);
  for (const id of fs.existsSync(CASES) ? fs.readdirSync(CASES).sort() : []) {
    const dir = path.join(CASES, id);
    if (!fs.statSync(dir).isDirectory()) continue;
    const out = path.join("public/cases", id);
    fs.mkdirSync(out, { recursive: true });
    for (const file of fs.readdirSync(dir).sort()) {
      const { name, ext } = path.parse(file);
      if (SKIP.has(`${id}/${file}`)) continue;
      if (ext === ".mp4" || ext === ".vtt") {
        fs.copyFileSync(path.join(dir, file), path.join(out, file));
        continue;
      }
      if (ext !== ".jpg") continue;
      const img = sharp(path.join(dir, file)).rotate();
      const meta = await img.metadata();
      manifest[`cases/${id}/${name}`] = { width: meta.width, height: meta.height };
      for (const w of WIDTHS) {
        const base = img.clone().resize({ width: Math.min(w, meta.width), withoutEnlargement: true });
        await base.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(out, `${name}-${w}.avif`));
        await base.clone().webp({ quality: 74, effort: 5 }).toFile(path.join(out, `${name}-${w}.webp`));
      }
      console.log(`cases/${id}/${name}`, `${meta.width}x${meta.height}`);
    }
  }
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
