"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  UNITS,
  fmtVolume,
  parseNum,
  placesVolume,
  type Places,
  type Shape,
  type Unit,
} from "@/lib/calcTariff";

type DimKey = "l" | "w" | "h" | "d";
type DimState = { value: string; unit: Unit };

/** Значения помощника - живут в калькуляторе, чтобы сохраняться между открытиями */
export type VolumeHelperState = {
  shape: Shape;
  count: string;
  dims: Record<DimKey, DimState>;
};

const dim = (): DimState => ({ value: "", unit: "см" });
export const VOLUME_HELPER_EMPTY: VolumeHelperState = {
  shape: "box",
  count: "1",
  dims: { l: dim(), w: dim(), h: dim(), d: dim() },
};

const FIELDS: Record<Shape, [DimKey, string][]> = {
  box: [
    ["l", "Длина"],
    ["w", "Ширина"],
    ["h", "Высота"],
  ],
  cylinder: [
    ["d", "Диаметр"],
    ["h", "Высота"],
  ],
};

function toPlaces(s: VolumeHelperState): Places {
  const d = (k: DimKey) => ({
    value: parseNum(s.dims[k].value),
    unit: s.dims[k].unit,
  });
  const count = parseNum(s.count);
  return s.shape === "box"
    ? { shape: "box", count, l: d("l"), w: d("w"), h: d("h") }
    : { shape: "cylinder", count, d: d("d"), h: d("h") };
}

const BoxIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3" />
    <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
  </svg>
);

// Поле «Объём» с кнопкой помощника. Помощник считает объём по местам (коробки или
// цилиндры) и сразу подставляет его в поле. Десктоп - панель под полем,
// телефон - нижняя шторка. Закрывается кнопкой «Готово», Esc, кликом вне панели
// и свайпом вниз (телефон).
export function VolumeHelper({
  inputId,
  volume,
  state,
  onManualVolume,
  onHelperChange,
}: {
  inputId: string;
  volume: string;
  state: VolumeHelperState;
  onManualVolume: (s: string) => void;
  onHelperChange: (
    next: VolumeHelperState,
    volume: string,
    places: Places | null,
  ) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  // место панели на десктопе: под полем, на ширину калькулятора (координаты страницы)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [drag, setDrag] = useState(0);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);
  const dragStart = useRef<number | null>(null);

  const places = toPlaces(state);
  const total = placesVolume(places);

  const update = (next: VolumeHelperState) => {
    const p = toPlaces(next);
    const v = placesVolume(p);
    onHelperChange(next, v > 0 ? fmtVolume(v) : "", v > 0 ? p : null);
  };

  const close = () => {
    setOpen(false);
    setDrag(0);
    iconRef.current?.focus({ preventScroll: true });
  };

  // при открытии: панель встаёт под полем, фокус - на первый размер
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const f = fieldRef.current;
      const c = f?.closest(".calc");
      if (!f || !c) return;
      const fr = f.getBoundingClientRect();
      const cr = c.getBoundingClientRect();
      setPos({
        top: fr.bottom + window.scrollY + 10,
        left: cr.left + window.scrollX,
        width: cr.width,
      });
    };
    place();
    window.addEventListener("resize", place);
    panelRef.current
      ?.querySelector<HTMLInputElement>(".vhelp__grid input")
      ?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !iconRef.current?.contains(t))
        close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("resize", place);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // свайп вниз за ручку шторки (телефон)
  const onDragStart = (e: React.PointerEvent) => {
    dragStart.current = e.clientY;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // без захвата указателя свайп тоже работает, пока палец над шапкой
    }
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (dragStart.current !== null)
      setDrag(Math.max(0, e.clientY - dragStart.current));
  };
  const onDragEnd = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (drag > 80) close();
    else setDrag(0);
  };

  const setDim = (k: DimKey, patch: Partial<DimState>) =>
    update({
      ...state,
      dims: { ...state.dims, [k]: { ...state.dims[k], ...patch } },
    });

  return (
    <>
      <div className="calc__field" ref={fieldRef}>
        <label htmlFor={inputId}>Объём, м³</label>
        <div className="calc__input-wrap calc__input-wrap--icon">
          <input
            id={inputId}
            inputMode="decimal"
            autoComplete="off"
            value={volume}
            onChange={(e) => onManualVolume(e.target.value)}
          />
          <button
            ref={iconRef}
            type="button"
            className="calc__icon-btn"
            aria-label="Рассчитать объём"
            aria-expanded={open}
            aria-controls={`${id}-panel`}
            onClick={() => (open ? close() : setOpen(true))}
          >
            <BoxIcon />
          </button>
        </div>
      </div>

      {/* панель выносится в конец страницы: внутри блока с анимацией появления
          фиксированная шторка привязалась бы к блоку, а не к экрану */}
      {open &&
        createPortal(
          <div className="vhelp__backdrop" aria-hidden />,
          document.body,
        )}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={`${id}-panel`}
            className="vhelp"
            role="dialog"
            aria-labelledby={`${id}-title`}
            style={
              {
                "--top": `${pos.top}px`,
                "--left": `${pos.left}px`,
                "--width": `${pos.width}px`,
                "--drag": `${drag}px`,
              } as React.CSSProperties
            }
          >
            <div
              className="vhelp__head"
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
            >
              <span className="vhelp__grip" aria-hidden />
              <p className="vhelp__title" id={`${id}-title`}>
                Расчёт объёма груза
              </p>
            </div>

            <fieldset className="calc__plans">
              <legend>Форма</legend>
              {(
                [
                  ["box", "Коробка"],
                  ["cylinder", "Цилиндр"],
                ] as const
              ).map(([s, label]) => (
                <label
                  key={s}
                  className="calc__plan"
                  data-checked={state.shape === s}
                >
                  <input
                    type="radio"
                    name={`${id}-shape`}
                    value={s}
                    checked={state.shape === s}
                    onChange={() => update({ ...state, shape: s })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>

            <div className="vhelp__grid">
              {FIELDS[state.shape].map(([k, label]) => (
                <div className="calc__field" key={k}>
                  <label htmlFor={`${id}-${k}`}>{label}</label>
                  <div className="calc__input-wrap">
                    <input
                      id={`${id}-${k}`}
                      inputMode="decimal"
                      autoComplete="off"
                      value={state.dims[k].value}
                      onChange={(e) => setDim(k, { value: e.target.value })}
                    />
                    <select
                      className="calc__unit"
                      aria-label={`${label}: единицы`}
                      value={state.dims[k].unit}
                      onChange={(e) =>
                        setDim(k, { unit: e.target.value as Unit })
                      }
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              <div className="calc__field">
                <label htmlFor={`${id}-count`}>Мест, шт</label>
                <input
                  id={`${id}-count`}
                  inputMode="numeric"
                  autoComplete="off"
                  value={state.count}
                  onChange={(e) => update({ ...state, count: e.target.value })}
                />
              </div>
            </div>

            <div className="vhelp__foot">
              <p className="vhelp__total" aria-live="polite">
                Объём: <b>{total > 0 ? `${fmtVolume(total)} м³` : "-"}</b>
              </p>
              <button
                type="button"
                className="ink-btn vhelp__done"
                data-variant="paper"
                onClick={close}
              >
                <span className="ink-btn__fill" aria-hidden />
                <span className="ink-btn__label">Готово</span>
                <span
                  className="ink-btn__label ink-btn__label--hover"
                  aria-hidden
                >
                  Готово
                </span>
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
