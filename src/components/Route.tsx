import { site } from "@/content/site";
import { HanziTitle } from "./HanziTitle";
import { RouteMap } from "./RouteMap";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Блок «Маршрут»: секция закреплена, скролл рисует линию тушью по карте,
// зажигает этапы, ведёт счётчик дней и двигает контейнер.
// Без JS и при reduced-motion - обычная карта и список из шести этапов.
export function Route() {
  const { route } = site;
  return (
    <section id="route" className="route grain" data-route aria-label="Маршрут груза">
      <div className="route__sticky">
        <HanziTitle word={route.hanzi} lines={route.title} className="route__head" />

        <div className="route__day" aria-hidden>
          <span className="route__day-label">День</span>
          <span className="route__digits">
            {["tens", "ones"].map((k) => (
              <span key={k} className="route__digit">
                <span className="route__strip" data-digit={k}>
                  {DIGITS.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </span>
              </span>
            ))}
            {/* когда груз доехал до конца пути, рядом с 15 выезжает «-20» */}
            <span className="route__day-rest">
              <span>-{route.daysMax}</span>
            </span>
          </span>
          <span className="route__day-of">из {route.days}</span>
        </div>

        <div className="route__map">
          <RouteMap steps={route.steps.length} />
        </div>

        <div className="route__info">
          <ol className="route__steps">
            {route.steps.map((s, i) => (
              <li key={i} className="route__step" data-step>
                <span className="route__num">
                  {String(i + 1).padStart(2, "0")}
                  <i> / {String(route.steps.length).padStart(2, "0")}</i>
                </span>
                <h3 className="route__title">{s.title}</h3>
                <p className="route__text">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="route__ticks" aria-hidden>
            {route.steps.map((_, i) => (
              <span key={i} data-tick />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
