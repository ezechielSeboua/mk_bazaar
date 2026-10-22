export default function ProductHeader() {
  return (
    <div className="mb-8 md:mb-12 space-y-2">
      <span className="text-xs uppercase tracking-[0.25em] font-bold text-brand-terracotta block">
        Catalogue Permanent
      </span>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal text-stone-950 tracking-tight">
        Toutes les <span className="italic">pièces</span>
      </h1>
      <p className="text-xs sm:text-sm text-stone-500 font-light max-w-md pt-1">
        Créations artisanales, matières nobles et coupes intemporelles pensées pour sublimer votre quotidien.
      </p>
    </div>
  );
}
