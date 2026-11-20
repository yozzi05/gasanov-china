# G17 · Заур Гасанов — сайт доставки из Китая

Одностраничный сайт на Next.js (статический экспорт), Tailwind CSS, GSAP + ScrollTrigger, Lenis и hanzi-writer.

## Команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Разработка, http://localhost:3000 |
| `npm run build` | Готовый сайт в папке `out/` — её и загружают на хостинг |
| `npm run serve` | Локальный просмотр `out/` со сжатием, http://localhost:3219 |
| `npm run images` | Пересобрать картинки из `assets/originals` в `public/images` (AVIF + WebP) |
| `npm run art` | Перерисовать дерево первого экрана (`public/art`) |
| `npm run hanzi` | Пересобрать контуры иероглифов (`src/content/hanzi-data.json`) |
| `npm run rate` | Запросить курс юаня ЦБ и сохранить в `src/content/rate.json` (запускается сам перед каждой сборкой) |
| `npm run og` | Пересобрать обложку для соцсетей (`public/og.jpg`) и иконку |

## Как вносить правки

Дизайн заморожен на теге `v1.0`. Правила - в [CLAUDE.md](CLAUDE.md), описание дизайн-системы - в [DESIGN.md](DESIGN.md).
В основную ветку `master` напрямую не коммитим: каждая правка идёт в своей ветке и попадает в `master` через pull request.

### 1. Создать ветку под правку

```bash
git checkout master
git pull
git checkout -b fix/nazvanie-pravki
```

### 2. Посмотреть локально

```bash
npm run build
npm run serve
```

Сайт откроется на http://localhost:3219. Проверьте изменённое место на ширине 390 и 1440 px
(в браузере: F12 → значок телефона → задать ширину).

### 3. Опубликовать

Сначала - на предпросмотр:

```bash
git add -A
git commit -m "Коротко, что изменено"
git push -u origin fix/nazvanie-pravki
gh pr create --fill
```

Через 2-3 минуты ветка сама появится по адресу предпросмотра - ссылка придёт комментарием в pull request:

```
https://yozzi05.github.io/gasanov-china/preview/nazvanie-pravki/
```

Адрес строится из названия ветки: всё, что после `fix/`. Откройте его на компьютере и на телефоне.
Каждый новый `git push` в ветку обновляет предпросмотр. Если всё хорошо - публикуем:

```bash
gh pr merge --squash --delete-branch
```

После слияния сайт обновится за 2-3 минуты, а предпросмотр ветки исчезнет.

### 4. Откатить

Отменить одну опубликованную правку (найдите её номер в `git log --oneline`):

```bash
git checkout master
git pull
git checkout -b fix/otkat
git revert <номер-коммита>
git push -u origin fix/otkat
gh pr create --fill
gh pr merge --squash --delete-branch
```

Вернуть сайт целиком к утверждённой версии `v1.0` (код, стили, картинки и контент; правила и документация остаются):

```bash
git checkout master
git pull
git checkout -b fix/vernut-v1
git restore --source v1.0 --staged --worktree -- src public assets scripts next.config.ts package.json package-lock.json
git commit -m "Вернуть сайт к версии v1.0"
git push -u origin fix/vernut-v1
gh pr create --fill
gh pr merge --squash --delete-branch
```

После слияния отката сайт обновится за 2-3 минуты. Ход публикации виден на GitHub во вкладке **Actions**.

## Где что править

- **Тексты, контакты, тарифы, ссылки** — `src/content/site.ts`. Места с пометкой «УТОЧНИТЬ» нужно подтвердить.
- **Фото** — положить исходник в `assets/originals`, запустить `npm run images`, указать имя файла в `site.ts`.
- **Цвета и шрифты** — блок `@theme` в начале `src/app/globals.css`.
- **Что осталось уточнить у клиента** — `TODO.md`.

## Как устроено

- `src/app/page.tsx` — порядок блоков на странице.
- `src/components/Hero.tsx`, `Route.tsx`, `Cases.tsx`, `Sections.tsx` — разметка блоков.
- `src/components/Preloader.tsx` — загрузочный экран (печать и пятно краски).
- `src/components/LateBundle.tsx` — все скролл-эффекты; подгружаются отдельным файлом после печати,
  чтобы не мешать первой отрисовке.
- При `prefers-reduced-motion` анимации отключены: всё показано сразу, «Маршрут» превращается в обычный список.

## Курс юаня

В страницу вшит курс на момент сборки, а браузер посетителя пробует подтянуть свежий. Чтобы вшитый курс не устаревал,
сайт нужно пересобирать раз в день: на GitHub Pages это делает расписание в `.github/workflows/pages.yml`,
на другом хостинге понадобится такая же ежедневная сборка.

## Предпросмотры и публикация

Всё живёт на GitHub Pages, сторонних сервисов нет. Этим управляет `.github/workflows/pages.yml`:

- основная ветка `master` публикуется по адресу https://yozzi05.github.io/gasanov-china/;
- каждая ветка `fix/<название>` и `experiment/<название>` - по адресу `.../gasanov-china/preview/<название>/`;
- при удалении ветки её предпросмотр исчезает;
- раз в день сайт пересобирается ради свежего курса юаня.

Сайт и предпросмотры лежат в подпапках, поэтому сборка получает переменную `NEXT_PUBLIC_BASE_PATH`.
Вручную её задавать не нужно - это делает `scripts/build-pages.sh`. На своём домене переменная не нужна.

Всё опубликованное на GitHub Pages закрыто от поисковиков: это демо-копия, а не боевой сайт.

## Размещение

Содержимое `out/` — обычные статические файлы, подойдёт любой хостинг. Желательны HTTPS, HTTP/2 и сжатие
(gzip или brotli); файлам из `/_next/static/` и `/images/` можно ставить долгий кэш.
