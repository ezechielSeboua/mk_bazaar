import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { resolveMediaUrl } from '../config/env';
import { HERO_DEFAULTS } from '../constants/siteDefaults';

export default function HeroSection({ hero = {} }) {
  // Skip empty/null values so DB-saved empty strings don't override fallback defaults
  const d = { ...HERO_DEFAULTS };
  Object.entries(hero).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) d[k] = v; });
  const imageUrl = d.image_url?.startsWith('/storage')
    ? resolveMediaUrl(d.image_url)
    : d.image_url;

  // S-03 : n'autoriser que les URLs relatives pour éviter les open redirects
  const safeCta = /^\/[^/]/.test(d.cta_link) ? d.cta_link : '/products';

  return (
    <section className="px-4 sm:px-6 py-10 md:py-20 max-w-7xl mx-auto grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
      {/* Contenu textuel - Toujours en premier sur mobile pour un impact immédiat */}
      <div className="space-y-6 md:space-y-8 order-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full border border-stone-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-stone-600 font-bold">
            {d.badge}
          </span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-charcoal leading-[1.08]">
          {d.title} <br />
          <span className="italic font-light text-stone-700">{d.title_bold}</span>
        </h1>

        <p className="text-stone-600 max-w-lg text-sm sm:text-base leading-relaxed font-light">
          {d.subtitle}
        </p>

        <div className="pt-2">
          <Link
            to={safeCta}
            className="group inline-flex items-center gap-3 bg-stone-950 text-white hover:bg-stone-800 transition-all duration-300 px-8 py-4 uppercase text-[11px] tracking-widest font-semibold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{d.cta_text}</span>
            <FiArrowRight className="text-sm transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Visuel Lookbook */}
      <div className="order-2 aspect-[3/4] max-w-md md:max-w-none mx-auto w-full bg-stone-100 relative rounded-2xl overflow-hidden group shadow-xl border border-stone-200/50">
        <img
          src={imageUrl}
          alt="Lookbook MK BAZAAR"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="absolute bottom-5 right-5 text-[10px] uppercase tracking-widest text-stone-800 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full font-semibold shadow-sm">
          Lookbook 2026
        </div>
      </div>
    </section>
  );
}
