import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export default function HeroSection() {
    return (
        <section className="px-6 py-12 md:py-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Texte d'accroche */}
            <div className="space-y-6 md:space-y-8 order-2 md:order-1">
                <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block">
                    Drop 01 / Édition Limitée
                </span>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extralight tracking-tight uppercase text-black leading-[0.95]">
                    Formes brutes. <br />
                    <span className="font-normal">Teintes neutres.</span>
                </h1>
                <p className="text-stone-600 max-w-md text-sm md:text-base leading-relaxed font-light">
                    Une esthétique pensée pour le quotidien. Pièces intemporelles coupées dans des matières d'exception.
                </p>
                <div className="pt-2">
                    <Link 
                        to="/products" 
                        className="inline-flex items-center gap-4 bg-black text-[#F9F9F7] hover:bg-stone-900 transition-colors px-8 py-4 uppercase text-[11px] tracking-widest font-bold shadow-sm"
                    >
                        Explorer les pièces
                        <FiArrowRight className="text-sm" />
                    </Link>
                </div>
            </div>
            
            {/* Visuel principal */}
            <div className="order-1 md:order-2 aspect-[3/4] bg-stone-100 relative overflow-hidden group shadow-sm">
                <img
                    src="https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&h=800&fit=crop"
                    alt="Lookbook MK BAZAAR - Manteau oversize structuré"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-out"
                />
                <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-widest text-stone-500 bg-[#F9F9F7]/60 backdrop-blur-sm px-3 py-1.5 font-medium">
                    Lookbook 2026
                </div>
            </div>
        </section>
    );
}