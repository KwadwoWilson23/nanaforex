import Navbar from "./Navbar";
import Footer from "./Footer";
import type { ReactNode } from "react";

/**
 * Standard marketing page shell: Navbar + main content + Footer.
 * `header` is a full-bleed hero section that sits under the fixed nav.
 */
export default function PageShell({
  header,
  children,
}: {
  header?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      {header}
      <main>{children}</main>
      <Footer />
    </>
  );
}
