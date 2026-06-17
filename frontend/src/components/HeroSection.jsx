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

  return (
    <section className="px-6 py-12 md:py-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
      <div className="space-y-6 md:space-y-8 order-2 md:order-1">
        <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block">
          {d.badge}
        </span>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extralight tracking-tight uppercase text-black leading-[0.95]">
          {d.title} <br />
          <span className="font-normal">{d.title_bold}</span>
        </h1>
        <p className="text-stone-600 max-w-md text-sm md:text-base leading-relaxed font-light">
          {d.subtitle}
        </p>
        <div className="pt-2">
          <Link
            to={d.cta_link}
            className="inline-flex items-center gap-4 bg-black text-[#F9F9F7] hover:bg-stone-900 transition-colors px-8 py-4 uppercase text-[11px] tracking-widest font-bold shadow-sm"
          >
            {d.cta_text}
            <FiArrowRight className="text-sm" />
          </Link>
        </div>
      </div>

      <div className="order-1 md:order-2 aspect-[3/4] bg-stone-100 relative overflow-hidden group shadow-sm">
        <img
          src={imageUrl}
          alt="Lookbook MK BAZAAR"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-out"
        />
        <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-widest text-stone-500 bg-[#F9F9F7]/60 backdrop-blur-sm px-3 py-1.5 font-medium">
          Lookbook 2026
        </div>
      </div>
    </section>
  );
}
