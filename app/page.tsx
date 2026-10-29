import { Calculator } from "@/components/Calculator";
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
import { ScrollFilm } from "@/components/ScrollFilm";

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
        {/* the container doors open and the camera goes in (a clip made with Higgsfield, played by the scroll) */}
        {/* the film is a dark cinema moment in both themes: it melts into the night of the clip itself */}
        <ScrollFilm name="container" count={91} from="#05080c" to="#05080c" />
        <div className="relative bg-bg">
          <Calculator />
        </div>
        {/* through the porthole of the ship and out over the sea */}
        <ScrollFilm name="porthole" count={91} from="#05080c" to="#05080c" />
        <div className="relative">
          <Process />
        </div>
        <Reviews />
        <Owner />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
