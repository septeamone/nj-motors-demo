import { Calculator } from "@/components/Calculator";
import { Catalog } from "@/components/Catalog";
import { Contact } from "@/components/Contact";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MobileBar } from "@/components/MobileBar";
import { Owner } from "@/components/Owner";
import { Portal } from "@/components/Portal";
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
        <Catalog />
        <Portal kind="container" from="var(--bg)" to="var(--bg)" />
        {/* the section after a portal rises over the portal's last screen */}
        <div className="relative">
          <Calculator />
        </div>
        <Portal kind="porthole" from="var(--bg)" to="var(--bg-2)" />
        <div className="relative">
          <Process />
        </div>
        <Reviews />
        <Owner />
        <Faq />
        <Portal kind="emblem" from="var(--bg)" to="var(--accent-fill)" />
        <div className="relative">
          <Contact />
        </div>
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
