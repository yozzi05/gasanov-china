import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Статический экспорт: после `npm run build` готовый сайт лежит в папке out/
  output: "export",
  trailingSlash: true,
  images: {
    // Картинки заранее нарезаны скриптом scripts/optimize-images.mjs,
    // загрузчик только подставляет нужный файл по ширине.
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
    deviceSizes: [360, 640, 828, 1080, 1440, 1920],
    imageSizes: [96, 200],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
