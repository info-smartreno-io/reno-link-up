import { ClipboardList, Search, Hammer, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  {
    step: "1",
    icon: ClipboardList,
    title: "Tell Us About Your Project",
    description: "Share your renovation goals, timeline, and budget. Our team scopes the project in detail.",
  },
  {
    step: "2",
    icon: Search,
    title: "Get Matched & Compare Bids",
    description: "Receive structured proposals from vetted, licensed professionals — all on identical scope.",
  },
  {
    step: "3",
    icon: Hammer,
    title: "Build With Confidence",
    description: "Your renovation is managed with clear milestones, communication, and budget tracking.",
  },
];

export function SmartRenoProcessSteps() {
  return (
    <section className="py-16 md:py-24 border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-3"
          >
            How SmartReno Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Three simple steps from idea to construction.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connector lines (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              {/* Step number circle */}
              <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <step.icon className="h-7 w-7" />
              </div>

              {/* Step label */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
                Step {step.step}
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>

              {/* Arrow between steps (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:flex absolute top-14 -right-3 z-20">
                  <ArrowRight className="h-5 w-5 text-primary/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
