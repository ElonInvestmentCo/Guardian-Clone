import { Link } from "wouter";
import { Shield, Twitter, Linkedin, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#05070a] border-t border-white/5 pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 group mb-6">
              <Shield className="w-8 h-8 text-primary" />
              <span className="font-display font-bold text-xl tracking-tight text-white">
                GUARDIAN<span className="text-primary">TRADING</span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
              Optimised services, tools and support designed specifically for active traders. Master your order flow with our proprietary DMA platform.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-display font-bold text-white mb-6">Quick Links</h4>
            <ul className="flex flex-col gap-4">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/platforms" className="text-muted-foreground hover:text-primary transition-colors">Trading Platforms</Link></li>
              <li><Link href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing & Commissions</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display font-bold text-white mb-6">Legal</h4>
            <ul className="flex flex-col gap-4">
              <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Risk Disclosure</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Margin Disclosure</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Guardian Trading. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60 max-w-2xl text-center md:text-right">
            Trading in financial markets carries a high level of risk and may not be suitable for all investors. 
            Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.
          </p>
        </div>
      </div>
    </footer>
  );
}
