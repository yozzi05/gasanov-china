#!/usr/bin/env bash
# Собирает всё, что публикуется на GitHub Pages, в папку site/:
#   site/                     - основная ветка (сам сайт)
#   site/preview/<название>/  - предпросмотр каждой ветки fix/<название>
# Запускается из .github/workflows/pages.yml. Удалённая ветка просто перестаёт
# попадать в сборку, поэтому её предпросмотр исчезает при следующей публикации.
set -uo pipefail

REPO_NAME="${GITHUB_REPOSITORY#*/}"
MAIN="${DEFAULT_BRANCH:-master}"
ROOT="$PWD"
SITE="$ROOT/site"
WORK="${RUNNER_TEMP:-/tmp}/pages-builds"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/null}"

rm -rf "$SITE" "$WORK"
mkdir -p "$SITE" "$WORK"

# build <ветка> <базовый путь> <куда положить>
build() {
  local ref="$1" base="$2" dest="$3"
  local dir="$WORK/$(echo "$ref" | tr '/' '_')"
  git worktree add --force --detach "$dir" "origin/$ref" >/dev/null || return 1
  (
    cd "$dir" || exit 1
    npm ci --no-audit --no-fund || exit 1
    NEXT_PUBLIC_BASE_PATH="$base" NEXT_PUBLIC_NOINDEX=1 npm run build || exit 1
  ) || return 1
  mkdir -p "$dest" && cp -a "$dir/out/." "$dest/"
}

echo "::group::Основной сайт ($MAIN)"
if ! build "$MAIN" "/$REPO_NAME" "$SITE"; then
  echo "::error::Не удалось собрать основную ветку $MAIN"
  exit 1
fi
echo "::endgroup::"
echo "### Опубликовано" >> "$SUMMARY"
echo "- Сайт: https://${GITHUB_REPOSITORY_OWNER}.github.io/${REPO_NAME}/" >> "$SUMMARY"

# Предпросмотры: ошибка в одной ветке не должна ронять публикацию сайта
git for-each-ref --format='%(refname:strip=3)' "refs/remotes/origin/fix/" | while read -r branch; do
  slug="$(echo "${branch#fix/}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')"
  [ -n "$slug" ] || continue
  echo "::group::Предпросмотр $branch"
  if build "$branch" "/$REPO_NAME/preview/$slug" "$SITE/preview/$slug"; then
    echo "- Предпросмотр \`$branch\`: https://${GITHUB_REPOSITORY_OWNER}.github.io/${REPO_NAME}/preview/${slug}/" >> "$SUMMARY"
  else
    rm -rf "$SITE/preview/$slug"
    echo "::warning::Ветка $branch не собралась - предпросмотра не будет"
    echo "- Предпросмотр \`$branch\`: **не собрался**, смотрите журнал" >> "$SUMMARY"
  fi
  echo "::endgroup::"
done

touch "$SITE/.nojekyll"
