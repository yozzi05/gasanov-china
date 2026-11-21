"use client";

import { useEffect, useState } from "react";

// Листание ленты отзывов на десктопе с мышью: стрелки «назад / вперёд»
// и перетаскивание ленты мышью. На телефоне лента листается пальцем, стрелки скрыты.
export function ReviewsNav({ target }: { target: string }) {
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const track = document.querySelector<HTMLElement>(target);
    if (!track) return;
    const update = () =>
      setEdge({
        start: track.scrollLeft <= 4,
        end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
      });
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    // перетаскивание мышью (палец и трекпад листают сами)
    let drag: { x: number; left: number; moved: boolean } | null = null;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        track.dataset.dragging = "";
        track.setPointerCapture(e.pointerId);
      }
      track.scrollLeft = drag.left - dx;
    };
    const up = () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      delete track.dataset.dragging;
      // после перетаскивания отпускание мыши - не нажатие на карточку
      if (moved) track.addEventListener("click", (ev) => ev.stopPropagation(), { capture: true, once: true });
    };
    track.addEventListener("pointerdown", down);
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      track.removeEventListener("pointerdown", down);
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
      track.removeEventListener("pointercancel", up);
    };
  }, [target]);

  const go = (dir: -1 | 1) => {
    const track = document.querySelector<HTMLElement>(target);
    if (!track) return;
    const card = track.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="reviews__nav">
      <button type="button" onClick={() => go(-1)} disabled={edge.start} aria-label="Предыдущие отзывы">
        ←
      </button>
      <button type="button" onClick={() => go(1)} disabled={edge.end} aria-label="Следующие отзывы">
        →
      </button>
    </div>
  );
}
