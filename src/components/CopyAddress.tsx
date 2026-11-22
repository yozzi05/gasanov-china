"use client";

import { useEffect, useRef, useState } from "react";

// Кнопка-ссылка «Скопировать адрес для поставщика»: кладёт адрес в буфер обмена
// и на 2 секунды показывает «Скопировано». Если буфер недоступен - выделяет текст
// адреса (элемент targetId), чтобы его можно было скопировать вручную.
export function CopyAddress({ text, targetId }: { text: string; targetId: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const select = () => {
    const el = document.getElementById(targetId);
    const sel = window.getSelection();
    if (!el || !sel) return false;
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  };

  const ok = () => {
    setDone(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 2000);
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      ok();
    } catch {
      // запасной путь (старые браузеры, http): выделяем адрес и пробуем скопировать выделение
      if (!select()) return;
      try {
        if (document.execCommand("copy")) {
          window.getSelection()?.removeAllRanges();
          ok();
        }
      } catch {
        // текст остаётся выделенным - скопируют сами
      }
    }
  };

  return (
    <p>
      <button type="button" className="footer__copy" onClick={copy}>
        <span aria-live="polite">{done ? "Скопировано" : "Скопировать адрес для поставщика"}</span>
      </button>
    </p>
  );
}
