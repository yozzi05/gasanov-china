import data from "@/content/hanzi-data.json";

type HanziData = Record<string, { strokes: string[]; medians: number[][][] }>;
const HANZI = data as HanziData;
const id = (char: string) => `hz-${char.codePointAt(0)!.toString(16)}`;

// Все иероглифы сайта лежат в одном скрытом «спрайте» (HanziSprite, один раз на страницу),
// а в нужных местах на них ссылается <use>. Так контуры не повторяются в HTML десятки раз.
export function HanziSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        {Object.entries(HANZI).map(([char, d]) => (
          <symbol key={char} id={id(char)} viewBox="0 0 1024 1024">
            <path transform="scale(1,-1) translate(0,-900)" d={d.strokes.join("")} />
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

// Статичный иероглиф как графика (контуры штрихов, без китайского шрифта).
export function Hanzi({ char, className }: { char: string; className?: string }) {
  if (!HANZI[char]) return null;
  return (
    <svg viewBox="0 0 1024 1024" className={className} aria-hidden fill="currentColor">
      <use href={`#${id(char)}`} />
    </svg>
  );
}

/** Несколько иероглифов столбцом или строкой */
export function HanziWord({
  word,
  className,
  charClassName,
}: {
  word: string;
  className?: string;
  charClassName?: string;
}) {
  return (
    <span className={className} aria-hidden>
      {[...word].map((c, i) => (
        <Hanzi key={i} char={c} className={charClassName} />
      ))}
    </span>
  );
}

/** Иероглиф внутри другого SVG: размер size, левый верхний угол в (x, y) */
export function HanziGlyph({ char, x, y, size }: { char: string; x: number; y: number; size: number }) {
  if (!HANZI[char]) return null;
  return <use href={`#${id(char)}`} x={x} y={y} width={size} height={size} />;
}
