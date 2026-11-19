import { Hanzi } from "./Hanzi";
import { HanziTitleFx } from "./HanziTitleFx";

// Заголовок раздела: иероглиф пишется по штрихам, когда секция входит в экран,
// затем русский заголовок выезжает построчно (движение - в HanziTitleFx).
// Без JS и при reduced-motion иероглиф и текст просто показаны.
export function HanziTitle({
  word,
  lines,
  className = "",
  strokeColor = "#C8102E",
}: {
  word: string;
  lines: readonly string[];
  className?: string;
  strokeColor?: string;
}) {
  return (
    <div className={`htitle ${className}`} data-htitle data-stroke={strokeColor}>
      <div className="htitle__hanzi" aria-hidden>
        {[...word].map((c, i) => (
          <span key={i} className="htitle__char" data-char={c} style={{ color: strokeColor }}>
            <span data-static className="block">
              <Hanzi char={c} className="h-full w-full" />
            </span>
          </span>
        ))}
      </div>
      <h2 className="htitle__text">
        {lines.map((l, i) => (
          <span key={i} className="htitle__mask">
            <span className="htitle__line" data-tline>
              {l}
            </span>
          </span>
        ))}
      </h2>
      <HanziTitleFx />
    </div>
  );
}
