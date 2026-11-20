import type { Metadata, Viewport } from "next";
import { Golos_Text, Sofia_Sans_Extra_Condensed } from "next/font/google";
import { site } from "@/content/site";
import { BASE_PATH } from "@/lib/basePath";
import "./globals.css";
import "./sections.css";
import "./hero-scene.css";

const sofia = Sofia_Sans_Extra_Condensed({
  variable: "--font-sofia",
  subsets: ["latin", "cyrillic"],
  weight: ["800", "900"],
  display: "swap",
});

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
  // текстовый шрифт не предзагружаем: он не должен отбирать канал у первого экрана
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  alternates: { canonical: "/" },
  // демо-копию (например, на GitHub Pages) от индексации закрываем
  robots: process.env.NEXT_PUBLIC_NOINDEX ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: `${site.person} · ${site.brand}`,
    title: site.title,
    description: site.description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Заур Гасанов - доставка из Китая от 1 $/кг за 15 дней" }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#C8102E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${sofia.variable} ${golos.variable} antialiased`}
      style={{ "--grain": `url(${BASE_PATH}/textures/grain.png)` } as React.CSSProperties}
    >
      <head>
        {/* До первой отрисовки отмечаем, можно ли анимировать (для плавного появления блоков) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.motion=matchMedia("(prefers-reduced-motion: reduce)").matches?"off":"on"`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
