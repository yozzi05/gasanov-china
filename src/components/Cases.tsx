import { site } from "@/content/site";
import manifest from "@/content/images.json";
import { HanziTitle } from "./HanziTitle";
import { InkEdge } from "./InkEdge";
import { Pic } from "./Pic";
import { Seal } from "./Seal";

type ImageName = keyof typeof manifest;

// Кейсы: карточки как грузовые накладные. На десктопе лента едет горизонтально
// по скроллу, при наведении проявляется фото и ставится печать «Доставлено».
// На телефоне лента листается пальцем, фото видно сразу.
export function Cases() {
  const { cases } = site;
  return (
    <section id="cases" className="cases grain" data-cases aria-label="Кейсы">
      <InkEdge color="#111010" variant={1} />
      <div className="cases__sticky">
        <div className="cases__head">
          <HanziTitle word={cases.hanzi} lines={cases.title} />
          <p className="cases__hint" aria-hidden>
            Листайте <span>→</span>
          </p>
        </div>
        <div className="cases__viewport" data-viewport tabIndex={0} role="group" aria-label="Лента кейсов">
          <ul className="cases__track" data-track>
            {cases.items.map((c, i) => (
              <li key={c.id} className="waybill" data-reveal style={{ "--d": i % 3, "--tilt": `${((i % 3) - 1) * 0.9}deg` } as React.CSSProperties}>
                <div className="waybill__top">
                  <span>Грузовая накладная</span>
                  <span>№ {c.id}</span>
                </div>
                <div className="waybill__photo">
                  {c.image ? (
                    <Pic
                      name={c.image as ImageName}
                      alt={c.title}
                      sizes="(max-width: 767px) 80vw, 380px"
                    />
                  ) : (
                    <Seal className="waybill__nophoto" />
                  )}
                </div>
                <h3 className="waybill__title">{c.title}</h3>
                <dl className="waybill__rows">
                  <div>
                    <dt>Маршрут</dt>
                    <dd>{cases.route}</dd>
                  </div>
                  <div>
                    <dt>Отметка</dt>
                    <dd>{c.meta}</dd>
                  </div>
                </dl>
                <div className="waybill__foot">
                  <span className="waybill__barcode" aria-hidden />
                  <span className="waybill__stamp" aria-hidden>
                    <Seal className="h-6 w-6" />
                    {cases.stamp}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
