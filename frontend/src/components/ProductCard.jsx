import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Plus } from "lucide-react";
import { useWishlist } from "../contexts/WishlistContext";
import VariantOrderDrawer from "./shop/VariantOrderDrawer";
import {
  activeVariants,
  addToCart,
  categoryLabel,
  formatFCFA,
  getPricing,
  isInStock,
  productImage,
  productSwatches,
  showStrikethrough,
} from "./shop/shopUtils";

/**
 * Carte produit (maquette « Retail premium »).
 *
 * layout="catalog"   : catégorie, nom et prix alignés à gauche, pastilles couleur (catalogue, favoris).
 * layout="editorial" : nom et prix centrés, plus discrets (sections de l'accueil).
 *
 * Badge : remise (« −20 % ») en priorité, sinon « Nouveau ». Survol : seconde photo
 * et bouton « Ajout rapide ».
 */
export default function ProductCard({ product, layout = "catalog" }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quickOpen, setQuickOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const loved = isInWishlist(product.id);
  const pricing = getPricing(product);
  const strike = showStrikethrough(pricing) && !pricing.from;
  const inStock = isInStock(product);
  const variants = activeVariants(product);
  const swatches = productSwatches(product);
  const secondImage = productImage(product, 1);
  const image = hovered && secondImage ? secondImage : productImage(product);

  const badge = pricing.discount_percent > 0
    ? `−${pricing.discount_percent} %`
    : product.is_new ? "Nouveau" : null;

  const quickAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!inStock) return;
    if (variants.length > 1) setQuickOpen(true);
    else addToCart({ product, variant: variants[0] ?? null, quantity: 1 });
  };

  const price = (
    <span className="tabular-nums">
      {pricing.from && "dès "}
      {strike && <s className="mr-2 font-normal text-[#767676]">{formatFCFA(pricing.base_price)}</s>}
      <span className={pricing.discount > 0 ? "text-[#111]" : undefined}>{formatFCFA(pricing.final_price)}</span>
    </span>
  );

  const editorial = layout === "editorial";

  return (
    <>
      <Link
        to={`/products/${product.slug}`}
        className={`group block font-admin antialiased ${editorial ? "text-center" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className={`relative aspect-[3/4] overflow-hidden ${editorial ? "bg-[#f4f3f1]" : "bg-[#f3f3f3] rounded-sm"}`}>
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02] ${inStock ? "" : "opacity-60"}`}
          />

          {badge && (
            <span className="absolute top-2.5 left-2.5 bg-white text-[#111] text-[11px] font-semibold px-2 py-1 rounded-sm">{badge}</span>
          )}
          {!inStock && (
            <span className="absolute bottom-2.5 left-2.5 bg-white/95 text-[#444] text-[11px] font-semibold px-2 py-1 rounded-sm">Épuisé</span>
          )}

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
            aria-pressed={loved}
            aria-label={loved ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
            className={`absolute top-2.5 right-2.5 w-[34px] h-[34px] rounded-full bg-white grid place-items-center transition-colors ${loved ? "text-[#c2410c]" : "text-[#333] hover:text-[#111]"}`}
          >
            <Heart className="w-4 h-4" strokeWidth={1.6} fill={loved ? "currentColor" : "none"} aria-hidden="true" />
          </button>

          {inStock && (
            <button
              type="button"
              onClick={quickAdd}
              className="absolute left-2.5 right-2.5 bottom-2.5 h-[38px] rounded-[3px] bg-white/95 text-[13px] font-semibold flex items-center justify-center gap-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0 transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
              {variants.length > 1 ? "Choisir et ajouter" : "Ajouter au panier"}
            </button>
          )}
        </div>

        {editorial ? (
          <>
            <p className="text-[13px] text-[#111] mt-3.5">{product.name}</p>
            <p className="text-[13px] text-[#6b6b6b] mt-1">{price}</p>
          </>
        ) : (
          <div className="pt-3">
            {categoryLabel(product) && <p className="text-xs text-[#767676]">{categoryLabel(product)}</p>}
            <p className="text-[14.5px] font-medium text-[#111] mt-[3px] mb-1.5">{product.name}</p>
            <p className="text-[14.5px] font-semibold">{price}</p>
            {swatches.length > 1 && (
              <div className="flex gap-[5px] mt-[9px]" aria-label={`${swatches.length} coloris`}>
                {swatches.slice(0, 6).map((s) => (
                  <i key={s.name} title={s.name} className="block w-[11px] h-[11px] rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.12)]" style={{ background: s.hex }} />
                ))}
              </div>
            )}
          </div>
        )}
      </Link>

      {quickOpen && <VariantOrderDrawer product={product} onClose={() => setQuickOpen(false)} />}
    </>
  );
}
