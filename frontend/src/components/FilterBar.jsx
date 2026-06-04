import { FiSliders } from 'react-icons/fi';

export default function FilterBar({
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    showOutOfStock,
    setShowOutOfStock,
    categories = [],
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-12">
            {/* Catégories – pastilles organiques */}
            <div className="flex flex-wrap items-center gap-2.5">
                {/* Bouton "Tous" */}
                <button
                    onClick={() => setSelectedCategory('Tous')}
                    className={`px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                        selectedCategory === 'Tous'
                            ? 'bg-[#c07b5a] text-white shadow-sm shadow-[#c07b5a]/20'
                            : 'bg-stone-100 text-stone-700 hover:bg-[#fef4ee] hover:text-[#c07b5a] border border-stone-200'
                    }`}
                >
                    Tous
                </button>

                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                            selectedCategory === cat.name
                                ? 'bg-[#c07b5a] text-white shadow-sm shadow-[#c07b5a]/20'
                                : 'bg-stone-100 text-stone-700 hover:bg-[#fef4ee] hover:text-[#c07b5a] border border-stone-200'
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Tri + Filtres */}
            <div className="flex items-center gap-3">
                {/* Tri */}
                <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-full px-4 py-2.5 text-stone-600">
                    <FiSliders className="text-sm text-[#c07b5a]" />
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold hidden sm:inline">
                        Trier par
                    </label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-transparent border-none p-0 text-[11px] uppercase tracking-[0.15em] font-medium cursor-pointer focus:ring-0 text-stone-800 pr-2"
                    >
                        <option value="nouveautes">Nouveautés</option>
                        <option value="prix-croissant">Prix croissant</option>
                        <option value="prix-decroissant">Prix décroissant</option>
                    </select>
                    <svg className="w-3.5 h-3.5 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {/* Filtre Rupture */}
                <label className="flex items-center gap-2.5 bg-stone-50 border border-stone-200 rounded-full px-4 py-2.5 cursor-pointer hover:border-[#c07b5a] transition-colors">
                    <input
                        type="checkbox"
                        checked={showOutOfStock}
                        onChange={(e) => setShowOutOfStock(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#c07b5a] cursor-pointer"
                    />
                    <span className="text-[11px] uppercase tracking-[0.15em] font-medium text-stone-700">
                        Rupture
                    </span>
                </label>
            </div>
        </div>
    );
}