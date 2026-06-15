import { FiSliders } from 'react-icons/fi';

export default function FilterBar({
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    // showOutOfStock,        // commenté
    // setShowOutOfStock,     // commenté
    categories = [],
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-5 mb-8 sm:mb-12">
            {/* ---- Catégories – version mobile : menu déroulant ---- */}
            <div className="block md:hidden w-full">
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full border border-stone-200 bg-stone-50 text-[11px] uppercase tracking-[0.15em] font-medium text-stone-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c07b5a]/20 focus:border-[#c07b5a]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        paddingRight: '2.5rem',
                    }}
                >
                    <option value="Tous">Toutes les catégories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* ---- Catégories – version desktop : pastilles ---- */}
            <div className="hidden md:flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setSelectedCategory('Tous')}
                    className={`shrink-0 px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
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
                        className={`shrink-0 px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                            selectedCategory === cat.name
                                ? 'bg-[#c07b5a] text-white shadow-sm shadow-[#c07b5a]/20'
                                : 'bg-stone-100 text-stone-700 hover:bg-[#fef4ee] hover:text-[#c07b5a] border border-stone-200'
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Tri + Filtres (commun aux deux versions) */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Tri – sélecteur avec flèche intégrée */}
                <div className="flex items-center gap-2 sm:gap-3 bg-stone-50 border border-stone-200 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-stone-600">
                    <FiSliders className="text-sm text-[#c07b5a] shrink-0" />
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold hidden sm:inline">
                        Trier par
                    </label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-transparent border-none p-0 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-medium cursor-pointer focus:ring-0 text-stone-800 pr-6"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right center',
                            paddingRight: '1.5rem',
                        }}
                    >
                        <option value="nouveautes">Nouveautés</option>
                        <option value="prix-croissant">Prix croissant</option>
                        <option value="prix-decroissant">Prix décroissant</option>
                    </select>
                    {/* SVG externe supprimé */}
                </div>

                {/* Filtre Rupture – commenté */}
                {/*
                <label className="flex items-center gap-2 sm:gap-2.5 bg-stone-50 border border-stone-200 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 cursor-pointer hover:border-[#c07b5a] transition-colors">
                    <input
                        type="checkbox"
                        checked={showOutOfStock}
                        onChange={(e) => setShowOutOfStock(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#c07b5a] cursor-pointer shrink-0"
                    />
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-medium text-stone-700 whitespace-nowrap">
                        Rupture
                    </span>
                </label>
                */}
            </div>
        </div>
    );
}