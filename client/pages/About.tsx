import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Shield, Target, Users, Zap } from "lucide-react";

export default function About() {
  return (
    <Layout title="About Us | Guardian Trading">
      <section className="pt-32 pb-20 relative">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-7xl font-display font-bold mb-6"
          >
            Built by Traders,<br />
            <span className="text-gradient-primary">For Traders.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground"
          >
            Guardian Trading was established with a singular mission: to provide active traders with the institutional-grade tools, pricing, and access they need to succeed in competitive markets.
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-black/30 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Reliability",
                desc: "Rock-solid infrastructure ensuring your orders execute when milliseconds matter."
              },
              {
                icon: Zap,
                title: "Speed",
                desc: "Direct Market Access routing for the fastest possible fills."
              },
              {
                icon: Target,
                title: "Precision",
                desc: "Advanced toolsets for detailed technical analysis and precise entries."
              },
              {
                icon: Users,
                title: "Support",
                desc: "Dedicated trade desk support from licensed professionals."
              }
            ].map((value, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 rounded-2xl"
              >
                <value.icon className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-display font-bold mb-8">Our History</h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              The landscape of retail trading has changed dramatically over the past decade. However, while zero-commission brokers flooded the market, professional active traders were left behind, forced to choose between slow execution or exorbitant fees.
            </p>
            <p>
              Guardian Trading bridges this gap. We focus exclusively on the needs of the active day trader, swing trader, and institutional client. We don't sell order flow. We provide Direct Market Access (DMA), allowing you to route your trades directly to the exchange or ECN of your choice.
            </p>
            <p>
              With an extensive inventory for short borrows, robust desktop platforms, and a highly responsive support desk, Guardian equips you with everything required to navigate the modern market structure.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
