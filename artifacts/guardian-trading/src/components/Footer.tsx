import { Link } from "wouter";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";

export function Footer() {
  return (
    <footer className="bg-[#0e0e0e] border-t border-white/5 pt-16 pb-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-flex items-center mb-5">
              <img
                src={guardianLogo}
                alt="Guardian Trading"
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-[#888] text-sm max-w-sm mb-6 leading-relaxed">
              Optimised services, tools and support designed specifically for active traders.
              Master your order flow with our professional DMA platform.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-5">Quick Links</h4>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/about" className="text-[#888] hover:text-primary text-sm transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/platforms" className="text-[#888] hover:text-primary text-sm transition-colors">Trading Platforms</Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-[#888] hover:text-primary text-sm transition-colors">Pricing & Commissions</Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#888] hover:text-primary text-sm transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-5">Legal</h4>
            <ul className="flex flex-col gap-3">
              <li><a href="#" className="text-[#888] hover:text-white text-sm transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-[#888] hover:text-white text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-[#888] hover:text-white text-sm transition-colors">Risk Disclosure</a></li>
              <li><a href="#" className="text-[#888] hover:text-white text-sm transition-colors">Margin Disclosure</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-[#555]">
            © {new Date().getFullYear()} Guardian Trading. All rights reserved.
          </p>
          <p className="text-xs text-[#444] max-w-2xl md:text-right leading-relaxed">
            Trading in financial markets carries a high level of risk and may not be suitable for all investors.
            Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.
          </p>
        </div>
      </div>
    </footer>
  );
}
