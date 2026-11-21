"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { getLenis } from "@/lib/lenis";
import type { CaseModalProps } from "./CaseModal";

// Окно кейса: лёгкая часть, которая есть на странице сразу.
// • ловит нажатия на [data-case-open] (накладные, отзывы) и адреса #case-g17-00X;
// • ведёт историю: при открытии адрес меняется на #case-…, «Назад» закрывает окно;
// • само окно (CaseModal с текстами, медиа и галереей) подгружается отдельным файлом
//   только при наведении на карточку или при открытии.
const HASH = /^#(case-g17-\d{3})$/i;

type Open = { anchor: string; origin: Element | null };

export function CaseDialog() {
  const [Modal, setModal] = useState<ComponentType<CaseModalProps> | null>(null);
  const [open, setOpen] = useState<Open | null>(null);
  const [closing, setClosing] = useState(false);
  const openRef = useRef<Open | null>(null);
  const pushed = useRef(false); // окно добавило запись в историю - закрываем через «Назад»
  const opener = useRef<HTMLElement | null>(null);
  const afterClose = useRef<(() => void) | null>(null);

  const load = useCallback(() => {
    import("./CaseModal").then((m) => setModal(() => m.CaseModal));
  }, []);

  const show = useCallback(
    (anchor: string, from: HTMLElement | null, push: boolean) => {
      if (!document.querySelector(`[data-case-card="${anchor}"]`)) return; // такого кейса нет
      if (push) {
        history.pushState({ g17case: anchor }, "", `#${anchor}`);
        pushed.current = true;
      }
      if (from && !openRef.current) opener.current = from;
      const next = { anchor, origin: from?.closest(".waybill, .review") ?? from };
      openRef.current = next;
      setOpen(next);
      setClosing(false);
      load();
    },
    [load],
  );

  const requestClose = useCallback((after?: () => void) => {
    if (!openRef.current) return;
    afterClose.current = after ?? null;
    if (pushed.current) {
      pushed.current = false;
      history.back(); // закроется в обработчике popstate
    } else {
      history.replaceState(null, "", location.pathname + location.search);
      setClosing(true);
    }
  }, []);

  const navigate = useCallback((anchor: string) => {
    history.replaceState({ g17case: anchor }, "", `#${anchor}`);
    const next = { anchor, origin: null };
    openRef.current = next;
    setOpen(next);
  }, []);

  // После закрытия: фокус и «что дальше» - когда окно уже убрано и страница разблокирована
  const pending = useRef<(() => void) | null>(null);
  const exited = useCallback(() => {
    const anchor = openRef.current?.anchor;
    const back =
      opener.current ?? (anchor ? document.querySelector<HTMLElement>(`[data-case-card="${anchor}"]`) : null);
    const after = afterClose.current;
    opener.current = null;
    afterClose.current = null;
    pending.current = () => {
      // фокус - на карточку, с которой открывали (или на накладную этого кейса)
      back?.focus({ preventScroll: true });
      after?.();
    };
    openRef.current = null;
    setOpen(null);
    setClosing(false);
  }, []);

  useEffect(() => {
    if (open || !pending.current) return;
    const run = pending.current;
    pending.current = null;
    run();
  }, [open]);

  const toCalc = useCallback(() => {
    requestClose(() => {
      const el = document.getElementById("calc");
      if (!el) return;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(el, { offset: -60 });
      else {
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: reduce ? "auto" : "smooth" });
      }
    });
  }, [requestClose]);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      const t = (e.target as Element | null)?.closest?.<HTMLElement>("[data-case-open]");
      if (!t) return;
      // ссылку можно открыть в новой вкладке как обычно
      if (t instanceof HTMLAnchorElement && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
      e.preventDefault();
      e.stopPropagation(); // не отдаём ссылку плавному скроллу
      show(t.dataset.caseOpen!, t, true);
    };
    const prefetch = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-case-open]")) load();
    };
    const pop = () => {
      const m = location.hash.match(HASH);
      if (m) {
        pushed.current = true;
        show(m[1].toLowerCase(), null, false);
      } else if (openRef.current) {
        setClosing(true);
      }
    };
    document.addEventListener("click", click, true);
    document.addEventListener("pointerover", prefetch, { passive: true });
    document.addEventListener("focusin", prefetch);
    window.addEventListener("popstate", pop);

    // Открытие по ссылке #case-g17-00X: ждём, пока уйдёт загрузочный экран.
    // Запись без адреса кейса остаётся под окном - «Назад» закроет окно, а не уведёт с сайта.
    let timer = 0;
    const m = location.hash.match(HASH);
    const go = () => {
      window.removeEventListener("g17:loaded", go);
      clearTimeout(timer);
      if (openRef.current) return;
      history.replaceState(null, "", location.pathname + location.search);
      show(m![1].toLowerCase(), null, true);
    };
    if (m) {
      if (window.__g17Loaded) go();
      else {
        window.addEventListener("g17:loaded", go);
        timer = window.setTimeout(go, 3000);
      }
    }
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("pointerover", prefetch);
      document.removeEventListener("focusin", prefetch);
      window.removeEventListener("popstate", pop);
      window.removeEventListener("g17:loaded", go);
      clearTimeout(timer);
    };
  }, [show, load]);

  if (!open || !Modal) return null;
  return (
    <Modal
      anchor={open.anchor}
      origin={open.origin}
      closing={closing}
      onClose={() => requestClose()}
      onNavigate={navigate}
      onCalc={toCalc}
      onExited={exited}
    />
  );
}
