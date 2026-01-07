import { motion } from "framer-motion";
import { Zap, FileText, Download, Globe, Sparkles, Clock } from "lucide-react";

const FeaturesGrid = () => {
  const features = [
    {
      icon: Zap,
      title: "Launch flows 10x faster",
      description: "Go from blank account to fully written cart, welcome, and post-purchase flows in minutes—not weeks waiting on an agency."
    },
    {
      icon: FileText,
      title: "Battle-tested blueprints",
      description: "Choose from proven abandoned-cart, browse-abandon, welcome, post-purchase, win-back, and VIP playbooks used by top stores."
    },
    {
      icon: Download,
      title: "Works with your stack",
      description: "One-click HTML export for Klaviyo, Mailchimp, Shopify Email, and every major email platform."
    },
    {
      icon: Globe,
      title: "Sell globally",
      description: "Translate your entire campaign into 30+ languages. Recover lost carts across borders without extra copywriters."
    },
    {
      icon: Sparkles,
      title: "Smart Improvements",
      description: "Click 'Improve' to refine any email instantly. Adjust tone or urgency to hit industry benchmarks (10-15% recovery)."
    },
    {
      icon: Clock,
      title: "Optimized Timing",
      description: "Proven drip schedules based on e-commerce best practices to maximize open rates and revenue recovery."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl p-8 border-primary/20 hover-lift group"
        >
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <feature.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
          <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default FeaturesGrid;
