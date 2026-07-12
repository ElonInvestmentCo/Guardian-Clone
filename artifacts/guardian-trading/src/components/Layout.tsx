import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { StockTicker } from "./StockTicker";
import { Helmet, HelmetProvider } from "react-helmet-async";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function Layout({ 
  children, 
  title = "Guardian Trading | Professional DMA Platform",
  description = "Optimised services, tools and support designed specifically for active traders."
}: LayoutProps) {
  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col bg-background font-sans text-foreground overflow-x-hidden">
        <Helmet>
          <title>{title}</title>
          <meta name="description" content={description} />
        </Helmet>
        <Navbar />
        <div className="fixed top-[78px] left-0 right-0 z-40">
          <StockTicker />
        </div>
        <main className="flex-1" style={{ paddingTop: "36px" }}>
          {children}
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}
