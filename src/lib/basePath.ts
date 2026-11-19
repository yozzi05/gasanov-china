// Базовый путь сайта. На своём домене пустой; для GitHub Pages сборка
// получает NEXT_PUBLIC_BASE_PATH="/имя-репозитория" (см. .github/workflows/pages.yml).
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
