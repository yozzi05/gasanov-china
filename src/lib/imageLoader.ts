// Загрузчик для next/image при статическом экспорте.
// src вида "/images/zaur.webp" → "/images/zaur-828.webp".
// Файлы нужных ширин создаёт scripts/optimize-images.mjs.
export const IMAGE_WIDTHS = [96, 200, 360, 640, 828, 1080, 1440, 1920];

export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const w = IMAGE_WIDTHS.find((x) => x >= width) ?? 1920;
  return src.replace(/\.(avif|webp)$/, `-${w}.$1`);
}
