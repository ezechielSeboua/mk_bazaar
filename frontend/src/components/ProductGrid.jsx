import ProductCard from "./ProductCard";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-3 h-[380px] flex flex-col justify-between animate-pulse">
      <div className="aspect-[4/5] w-full bg-stone-200 rounded-xl" />
      <div className="space-y-2 mt-3">
        <div className="h-3 bg-stone-200 rounded w-1/3" />
        <div className="h-4 bg-stone-200 rounded w-3/4" />
        <div className="h-5 bg-stone-200 rounded w-1/2 pt-1" />
      </div>
      <div className="h-10 bg-stone-200 rounded-xl mt-3" />
    </div>
  );
}

export default function ProductGrid({ products = [], loading = false }) {
  return (
    <section className="px-4 py-12 sm:py-16 bg-[#FAFAFA] border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold block mb-2">
            Sélection exclusive
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-light text-stone-950">
            Pièces <span className="italic font-normal">phares</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : products.slice(0, 8).map((p, i) => (
                <ProductCard key={p.id || i} product={p} delay={i * 0.04} />
              ))}
        </div>
      </div>
    </section>
  );
}
