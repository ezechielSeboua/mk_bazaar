import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Seo from "../components/Seo";
import { useWishlist } from "../contexts/WishlistContext";
import { getProductById } from "../services/product";
import { shopButton, wrapClass } from "../components/shop/shopUtils";

/*
 * Favoris (maquette « 05 · Favoris ») : les articles sauvegardés sur cet
 * appareil, relus auprès de l'API pour afficher prix et stock à jour.
 */
export default function FavoritesPage() {
  const { wishlist } = useWishlist();
  const [fresh, setFresh] = useState({});

  const ids = wishlist.map((p) => p.id).join(",");
  useEffect(() => {
    let cancelled = false;
    const list = ids ? ids.split(",").map(Number) : [];
    Promise.all(list.map((id) => getProductById(id))).then((results) => {
      if (cancelled) return;
      const map = {};
      results.forEach((res, i) => { map[list[i]] = res?.success ? res.data : null; });
      setFresh(map);
    });
    return () => { cancelled = true; };
  }, [ids]);

  // Produit à jour s'il existe encore, sinon l'instantané enregistré
  const products = wishlist
    .map((saved) => (fresh[saved.id] === null ? null : fresh[saved.id] ?? saved))
    .filter(Boolean);
  const removed = wishlist.filter((saved) => fresh[saved.id] === null);

  return (
    <div className="min-h-screen bg-white text-[#111] font-admin antialiased">
      <Seo title="Mes favoris" path="/favoris" noindex />
      <Header />

      <main className={wrapClass}>
        <nav className="text-[13px] text-[#777] py-[22px]" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:underline">Accueil</Link> / <b className="font-medium text-[#111]">Favoris</b>
        </nav>

        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em]">
          Mes favoris {wishlist.length > 0 && <span className="text-[#767676] font-normal">({wishlist.length})</span>}
        </h1>
        <p className="text-[15px] text-[#6b6b6b] mt-1.5">Vos articles sauvegardés sont conservés sur cet appareil.</p>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-10 h-10 mx-auto text-[#bbb]" strokeWidth={1.2} aria-hidden="true" />
            <p className="text-[17px] font-medium mt-4">Aucun favori pour le moment</p>
            <p className="text-sm text-[#666] mt-1">Touchez le cœur d'un article pour le retrouver ici.</p>
            <Link to="/products" className={`${shopButton("primary")} mt-6`}>Découvrir la boutique</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-9 mt-8">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            {removed.length > 0 && (
              <p className="mt-10 text-sm text-[#666]">
                {removed.length} article{removed.length > 1 ? "s ne sont" : " n'est"} plus disponible{removed.length > 1 ? "s" : ""} et {removed.length > 1 ? "ont été masqués" : "a été masqué"}.
              </p>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
