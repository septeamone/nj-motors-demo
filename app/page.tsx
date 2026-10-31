import { Calculator } from "@/components/Calculator";
import { Cases } from "@/components/Cases";
import { Catalog } from "@/components/Catalog";
import { Contact } from "@/components/Contact";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MobileBar } from "@/components/MobileBar";
import { Owner } from "@/components/Owner";
import { Process } from "@/components/Process";
import { Reviews } from "@/components/Reviews";

// Marks the intro before first paint, so the header and hero text never flash ahead of the emblem (see EmblemStage).
const introScript = `if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.intro='play'`;

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: introScript }} />
      <Header />
      <main id="main">
        <Hero />
        {/* the catalog rises over the last frame of the container film in the hero */}
        <div className="relative">
          <Catalog />
        </div>
        {/* real deals against the Russian market: appears once the owner's deals are filled in */}
        <Cases />
        <Calculator />
        <Process />
        {/* one block: who you work with, then what his clients say */}
        <Owner />
        <Reviews />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
