"use client";

import { useEffect, useRef } from "react";

// Кнопка: магнитится к курсору и заливается тушью из точки, куда вошёл курсор.
export function InkButton({
  href,
  children,
  variant = "paper",
  external = false,
  className = "",
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  variant?: "paper" | "outline" | "ink" | "red" | "ink-outline";
  external?: boolean;
  className?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const enter = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - r.left}px`);
      el.style.setProperty("--y", `${e.clientY - r.top}px`);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * 0.28;
      const y = (e.clientY - (r.top + r.height / 2)) * 0.4;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    };
    const leave = () => (el.style.transform = "");
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <a
      ref={ref}
      href={href}
      data-variant={variant}
      className={`ink-btn ${className}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      <span className="ink-btn__fill" aria-hidden />
      <span className="ink-btn__label">{children}</span>
      <span className="ink-btn__label ink-btn__label--hover" aria-hidden>
        {children}
      </span>
    </a>
  );
}
