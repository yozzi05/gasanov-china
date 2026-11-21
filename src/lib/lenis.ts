// Плавный скролл Lenis, если он включён (SmoothScroll кладёт его в window.lenis).
// При reduced-motion его нет - тогда работает обычная прокрутка.
type LenisLike = {
  scrollTo: (target: Element, options?: { offset?: number }) => void;
  stop: () => void;
  start: () => void;
};

export const getLenis = () => (window as unknown as { lenis?: LenisLike }).lenis;
