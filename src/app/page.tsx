import { site } from "@/content/site";
import { HanziSprite } from "@/components/Hanzi";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Route } from "@/components/Route";
import { Cases } from "@/components/Cases";
import { About, CalcSection, Final, Footer, RateSection, Reviews, Services, Stats, Why } from "@/components/Sections";
import { MobileBar } from "@/components/MobileBar";
import { Preloader } from "@/components/Preloader";
import { LateFx } from "@/components/LateFx";

// Разметка Organization для поисковиков
const tel = site.contacts.phoneHref.replace("tel:", "");
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: `${site.brand} - ${site.person}`,
  description: site.description,
  url: site.url,
  logo: `${site.url}/apple-icon.png`,
  image: `${site.url}/og.jpg`,
  telephone: tel,
  email: site.contacts.email,
  founder: { "@type": "Person", name: site.person },
  address: [
    {
      "@type": "PostalAddress",
      name: site.contacts.office.label,
      addressCountry: "RU",
      addressLocality: site.contacts.office.city,
      streetAddress: site.contacts.office.street,
    },
    {
      "@type": "PostalAddress",
      name: site.contacts.warehouse.label,
      addressCountry: "CN",
      addressRegion: site.contacts.warehouse.region,
      addressLocality: site.contacts.warehouse.city,
      streetAddress: site.contacts.warehouse.addressRu,
    },
  ],
  areaServed: ["RU", "CN"],
  sameAs: [site.contacts.telegram, site.contacts.telegramChannel, site.contacts.instagram],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: tel,
    availableLanguage: ["ru", "zh"],
  },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a href="#main" className="skip-link">
        К содержанию
      </a>
      <HanziSprite />
      <Preloader />
      <Header />
      <main id="main">
        <Hero />
        <Stats />
        <Services />
        <Route />
        <Why />
        <Cases />
        <CalcSection />
        <RateSection />
        <About />
        <Reviews />
        <Final />
      </main>
      <Footer />
      <LateFx />
      <MobileBar />
    </>
  );
}
