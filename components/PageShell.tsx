import { asset } from "@/lib/asset";
import { Footer } from "./Footer";
import { Header } from "./Header";

/** Frame for the inner pages (car pages, legal texts): same header and footer, links lead back to the home page sections. */
export function PageShell({ children }: { children: React.ReactNode }) {
  const home = asset("/");
  return (
    <>
      <Header prefix={home} />
      <main id="main" className="pt-[68px] sm:pt-[76px]">
        {children}
      </main>
      <Footer prefix={home} />
    </>
  );
}
