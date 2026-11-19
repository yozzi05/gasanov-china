"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { Seal } from "./Seal";
import { InkButton } from "./InkButton";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="header" data-scrolled={scrolled || open}>
        <div className="header__bg" />
        <div className="header__inner">
          <a href="#top" className="header__logo flex items-center" aria-label={`${site.name} - ${site.brand}, наверх`}>
            <Seal className="h-[50px] w-[50px] lg:h-[60px] lg:w-[60px]" />
          </a>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Основное меню">
            {site.nav.map((n) => (
              <a key={n.href} href={n.href} className="nav-link">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <InkButton
              href={site.hero.ctaPrimary.href}
              variant="paper"
              className="hidden! h-12! px-6! text-[19px]! md:inline-flex!"
            >
              {site.hero.ctaPrimary.label}
            </InkButton>
            <button
              type="button"
              className="relative -mr-2 flex h-12 w-12 items-center justify-center lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setOpen((v) => !v)}
            >
              <span
                className="absolute h-[2px] w-7 bg-current transition-transform duration-300"
                style={{ transform: open ? "rotate(45deg)" : "translateY(-5px)" }}
              />
              <span
                className="absolute h-[2px] w-7 bg-current transition-transform duration-300"
                style={{ transform: open ? "rotate(-45deg)" : "translateY(5px)" }}
              />
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className="menu lg:hidden" data-open={open} inert={!open}>
        <nav
          className="flex h-full flex-col justify-center gap-1 px-5 pt-16 pb-28"
          aria-label="Мобильное меню"
        >
          {site.nav.map((n, i) => (
            <a
              key={n.href}
              href={n.href}
              className="menu__link font-display border-b border-paper/15 py-3 text-[52px] leading-none font-black uppercase"
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </a>
          ))}
          <a
            href={site.contacts.phoneHref}
            className="menu__link mt-6 text-lg"
            style={{ "--i": site.nav.length } as React.CSSProperties}
          >
            {site.contacts.phone}
          </a>
        </nav>
      </div>
    </>
  );
}
