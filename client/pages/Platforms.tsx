import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Monitor, Layers, Crosshair, BarChart } from "lucide-react";

export default function Platforms() {
  return (
    <Layout title="Trading Platforms | Guardian Trading">
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/20 blur-[150px] -z-10 rounded-full" />
        
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-7xl font-display font-bold mb-6"
            >
              Professional <span className="text-gradient-primary">DMA</span> Platforms
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground"
            >
              Experience ultra-low latency, complete customizability, and advanced order types with our suite of desktop trading software.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full glass-panel rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 max-w-5xl mx-auto border-white/10"
          >
            <img 
              src={`${import.meta.env.BASE_URL}images/platform-preview.png`} 
              alt="DMA Trading Platform" 
              className="w-full h-auto"
            />
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-black/40 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            
            <div className="glass-panel p-10 rounded-2xl">
              <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <Layers className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Level 2 & Level 1 Quotes</h3>
              <p className="text-muted-foreground leading-relaxed">
                View complete market depth with fully integrated Level 2 quote windows. Track market maker movement, identify liquidity pools, and spot hidden support and resistance before the chart updates.
              </p>
            </div>

            <div className="glass-panel p-10 rounded-2xl">
              <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <Crosshair className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Advanced Order Routing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Take control of your execution. Route orders directly to ARCA, NSDQ, EDGX, or use our intelligent smart-routers to hunt for hidden liquidity and price improvement.
              </p>
            </div>

            <div className="glass-panel p-10 rounded-2xl">
              <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <Monitor className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Custom Layouts & Hotkeys</h3>
              <p className="text-muted-foreground leading-relaxed">
                Millisecond reactions require perfect setups. Build your ultimate workspace across multiple monitors and map complex order macros to single keystrokes.
              </p>
            </div>

            <div className="glass-panel p-10 rounded-2xl">
              <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <BarChart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Integrated Charting</h3>
              <p className="text-muted-foreground leading-relaxed">
                Analyze price action with dozens of built-in indicators, drawing tools, and multi-timeframe synchronization without needing a separate charting subscription.
              </p>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
