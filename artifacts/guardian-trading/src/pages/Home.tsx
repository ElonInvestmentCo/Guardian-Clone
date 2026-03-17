import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { 
  ArrowRight, 
  BarChart2, 
  Activity, 
  Globe, 
  Cpu, 
  Zap, 
  Lock,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  return (
    <Layout>
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />
        
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advanced Trading Tech</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6">
                Optimised services for <span className="text-gradient-primary">active traders.</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Why Do Active Traders Use Guardian? We provide the DMA platforms, competitive routing, and heavy-duty borrow capabilities required to master your order flow.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => console.log('Trade Now')}
                  className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
                >
                  Trade Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link href="/platforms" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all text-center">
                  Learn More
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:h-[600px] flex items-center justify-center"
            >
              {/* Dashboard Mockup Image */}
              <div className="relative z-10 w-full glass-panel rounded-2xl overflow-hidden shadow-2xl shadow-primary/20">
                <div className="h-8 bg-black/40 border-b border-white/10 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <img 
                  src={`${import.meta.env.BASE_URL}images/hero-dashboard.png`} 
                  alt="Guardian Trading Dashboard" 
                  className="w-full h-auto object-cover opacity-90"
                />
              </div>
              
              {/* Decorative elements behind image */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] -z-10 rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS / CARDS SECTION */}
      <section id="pricing" className="py-20 bg-black/40 border-y border-white/5 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-display font-bold mb-4">Why Active Traders Use Guardian</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to execute complex strategies with precision and speed.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-24 h-24 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Control Your Costs</h3>
              <p className="text-sm text-muted-foreground mb-6">With Competitive Pricing</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-display font-bold text-white">$0.15</span>
                <span className="text-muted-foreground">/ share</span>
              </div>
              <p className="text-xs text-primary font-medium uppercase tracking-wider mt-4">Or $0.0005 per share</p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart2 className="w-24 h-24 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Master Your Order Flow</h3>
              <p className="text-sm text-muted-foreground mb-6">Direct Market Access</p>
              <div className="text-4xl font-display font-bold text-white tracking-widest mb-2">
                0.000 <span className="text-primary">5</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Connect directly to multiple exchanges and dark pools for optimal execution.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Cpu className="w-24 h-24 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Trading Technology</h3>
              <p className="text-sm text-muted-foreground mb-6">Built for Professionals</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Advanced Charting
                </li>
                <li className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Custom Hotkeys
                </li>
                <li className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Algorithmic Routing
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-5xl font-display font-bold mb-6">
                Locate & Stock Borrows
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Short selling requires a robust borrow system. Our dedicated team and technology ensure you have access to hard-to-borrow (HTB) lists when you need them most.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Extensive Locate Inventory</h4>
                    <p className="text-muted-foreground text-sm">Access multiple locate providers directly through your trading terminal.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Instant Approvals</h4>
                    <p className="text-muted-foreground text-sm">Automated locate systems give you fast responses in fast-moving markets.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Competitive Rates</h4>
                    <p className="text-muted-foreground text-sm">Transparent borrow fees and overnight holding rates.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass-panel p-2 rounded-2xl">
                <img 
                  src={`${import.meta.env.BASE_URL}images/abstract-bg.png`} 
                  alt="Stock Borrows Interface Abstract" 
                  className="w-full rounded-xl opacity-80 mix-blend-screen"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 bg-gradient-to-t from-primary/10 to-background border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-display font-bold mb-6">Ready to upgrade your trading?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join the ranks of professional traders who rely on Guardian Trading for execution, pricing, and support.
          </p>
          <button 
            onClick={() => console.log('Open Account')}
            className="px-10 py-5 bg-white text-black hover:bg-gray-200 font-bold rounded-xl shadow-xl shadow-white/10 hover:-translate-y-1 transition-all text-lg"
          >
            Open Your Account Today
          </button>
        </div>
      </section>
    </Layout>
  );
}
