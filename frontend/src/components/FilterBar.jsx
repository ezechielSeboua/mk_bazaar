export default function FilterBar({
  selectedCategory,
  setSelectedCategory,
  categories = [],
}) {
  return (
    <div className="w-full mb-6">
      {/* Barre de pastilles de catégories avec défilement horizontal fluide */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        <button
          onClick={() => setSelectedCategory("Tous")}
          className={`shrink-0 px-4 sm:px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            selectedCategory === "Tous"
              ? "bg-stone-950 text-white shadow-sm"
              : "bg-white text-stone-600 hover:text-stone-950 border border-stone-200 hover:border-stone-400"
          }`}
        >
          Toutes les pièces
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`shrink-0 px-4 sm:px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                isSelected
                  ? "bg-brand-terracotta text-white shadow-sm shadow-brand-terracotta/20"
                  : "bg-white text-stone-600 hover:text-stone-950 border border-stone-200 hover:border-stone-400"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
