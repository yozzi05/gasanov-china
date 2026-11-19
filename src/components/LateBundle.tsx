"use client";

import { useEffect } from "react";
import { site } from "@/content/site";
import { SmoothScroll } from "./SmoothScroll";
import { Cursor } from "./Cursor";
import { HeroFx } from "./HeroFx";
import { RouteFx } from "./RouteFx";
import { CasesFx } from "./CasesFx";
import { PageFx } from "./PageFx";

// Все эффекты, которые ищут свои блоки по data-атрибутам. Грузится из LateFx.
export function LateBundle() {
  useEffect(() => {
    // эффекты дочерних компонентов уже запущены - сообщаем загрузочному экрану
    window.__g17FxReady = true;
    window.dispatchEvent(new Event("g17:fxready"));
  }, []);

  return (
    <>
      <SmoothScroll />
      <Cursor />
      <HeroFx />
      <RouteFx days={site.route.days} />
      <CasesFx />
      <PageFx />
    </>
  );
}
