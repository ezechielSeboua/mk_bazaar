import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { DEFAULT_TESTIMONIALS } from "../constants/siteDefaults";

export default function TestimonialsSection({ testimonials }) {
  const data = testimonials && testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 md:mb-16"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-3">
          Témoignages
        </span>
        <h2 className="text-2xl md:text-3xl font-light uppercase tracking-tight text-stone-900">
          Ce que nos <span className="font-normal">clients disent</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {data.map((t, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="group relative bg-stone-50 border border-stone-100 rounded-2xl p-6 md:p-8 hover:border-stone-300 hover:shadow-lg transition-all duration-300 flex flex-col"
          >
            <Quote className="w-8 h-8 text-stone-200 group-hover:text-[#c07b5a]/30 transition-colors duration-300 mb-4" />
            <div className="flex gap-1 mb-4" aria-label="5 étoiles sur 5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              ))}
            </div>
            <blockquote className="flex-1">
              <p className="text-stone-600 italic leading-relaxed text-sm md:text-base">
                « {t.comment} »
              </p>
            </blockquote>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <p className="font-bold text-sm text-stone-900 uppercase tracking-wide">{t.name}</p>
              <p className="text-[10px] uppercase text-stone-400 tracking-wider mt-1">{t.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
