// Дерево тушью с красной кроной. Сам рисунок создаёт scripts/build-art.mjs
// (npm run art) и кладёт в public/art - так он не раздувает HTML страницы.
//
// layer="back" - ствол, ветви и крона; layer="front" - светлые цветы,
// которые лежат поверх букв и дают глубину.

// Поле рисунка относительно базового квадрата 1000×1000 (те же числа, что в build-art.mjs)
import { BASE_PATH } from "@/lib/basePath";

const VIEW = { x: -400, y: -250, w: 1800, h: 1300 };

export function InkTree({ layer = "back" }: { layer?: "back" | "front" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/art/tree-${layer}.svg`}
      alt=""
      aria-hidden
      width={VIEW.w}
      height={VIEW.h}
      decoding="async"
      style={{
        display: "block",
        maxWidth: "none",
        width: `${VIEW.w / 10}%`,
        height: "auto",
        marginLeft: `${VIEW.x / 10}%`,
        marginTop: `${VIEW.y / 10}%`,
        // блок занимает место квадрата 1000×1000, остальное - «вылет» ветвей
        marginBottom: `${-(VIEW.h + VIEW.y - 1000) / 10}%`,
      }}
    />
  );
}
