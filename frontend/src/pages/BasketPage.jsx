import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import DeliveryFields from "../components/shop/DeliveryFields";
import { useCatalogData } from "../contexts/CatalogContext";
import { useAuth } from "../contexts/AuthContext";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { getProductById, getVariant } from "../services/product";
import { submitOrder, validateCheckout } from "../components/shop/checkout";
import { scrollToElement } from "../hooks/useBodyScrollLock";
import { formatFCFA, promotionLabel, readCart, shopButton, wrapClass, writeCart } from "../components/shop/shopUtils";

/*
 * Panier (maquettes « 04 · Panier » et « 04b · Panier sans compte ») :
 * articles avec prix à jour, coordonnées de livraison, récapitulatif avec
 * remises, puis envoi de la commande sur WhatsApp. Aucun paiement sur le site.
 */

/** Retire les drapeaux d'affichage avant d'enregistrer le panier. */
const stripFlags = (list) => list.map((item) => {
  const copy = { ...item };
  delete copy.unavailable;
  return copy;
});

const optionsLabel = (attributes) => Object.entries(attributes ?? {})
  .filter(([, v]) => v)
  .map(([k, v]) => `${k.charAt(0).toUpperCase()}${k.slice(1).replace(/_/g, " ")} ${v}`)
  .join(" · ");

function Steps() {
  const steps = ["Panier", "Livraison", "Validation et paiement sur WhatsApp"];
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[#666]">
      {steps.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-semibold ${index === 0 ? "bg-[#111] text-white" : "bg-[#f1f1f1] text-[#444]"}`}>{index + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}

/** Relit prix, stock et disponibilité de chaque ligne auprès de l'API. */
async function refreshLines(items) {
  return Promise.all(items.map(async (item) => {
    try {
      if (item.variant_id) {
        const res = await getVariant(item.variant_id);
        if (!res?.success) return { ...item, unavailable: true };
        const v = res.data;
        const ok = v.is_active !== false && v.product?.is_active !== false && (v.stock ?? 0) > 0;
        return {
          ...item,
          price: v.pricing?.final_price ?? item.price,
          base_price: v.pricing?.base_price ?? item.base_price,
          promotion: v.pricing?.promotion?.name ?? null,
          stock: v.stock,
          quantity: ok ? Math.min(item.quantity, v.stock) : item.quantity,
          unavailable: !ok,
        };
      }
      const res = await getProductById(item.id);
      if (!res?.success) return { ...item, unavailable: true };
      const p = res.data;
      const ok = p.is_active !== false && (p.stock ?? 0) > 0;
      return {
        ...item,
        price: p.pricing?.final_price ?? item.price,
        base_price: p.pricing?.base_price ?? item.base_price,
        promotion: p.pricing?.promotion?.name ?? null,
        stock: p.stock,
        quantity: ok ? Math.min(item.quantity, p.stock) : item.quantity,
        unavailable: !ok,
      };
    } catch {
      return item;
    }
  }));
}

export default function BasketPage() {
  const { shippingZones } = useCatalogData();
  const { user } = useAuth();
  const { contactInfo } = useSiteSettings();
  const navigate = useNavigate();

  const [items, setItems] = useState(() => readCart());
  const [checked, setChecked] = useState(() => readCart().length === 0);
  const [values, setValues] = useState({ name: "", phone: "", zoneId: null, address: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const current = readCart();
    if (!current.length) return undefined;
    refreshLines(current).then((fresh) => {
      if (cancelled) return;
      setItems(fresh);
      writeCart(stripFlags(fresh));
      setChecked(true);
    });
    return () => { cancelled = true; };
  }, []);

  const save = (next) => {
    setItems(next);
    writeCart(stripFlags(next));
  };
  const setQuantity = (index, quantity) => save(items.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock || quantity)) } : item)));
  const remove = (index) => save(items.filter((_, i) => i !== index));

  const sellable = items.filter((item) => !item.unavailable);
  const count = sellable.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = sellable.reduce((sum, item) => sum + (item.base_price ?? item.price) * item.quantity, 0);
  const byPromo = new Map();
  sellable.forEach((item) => {
    const saved = ((item.base_price ?? item.price) - item.price) * item.quantity;
    const key = promotionLabel(item.promotion) || "Promotion";
    if (saved > 0) byPromo.set(key, (byPromo.get(key) ?? 0) + saved);
  });
  const discounts = [...byPromo.entries()];
  const discountTotal = discounts.reduce((sum, [, v]) => sum + v, 0);
  const zone = shippingZones.find((z) => z.id === values.zoneId) ?? null;
  const total = subtotal - discountTotal + (zone?.price ?? 0);

  const checkout = async () => {
    const found = validateCheckout({ user, name: values.name, phone: values.phone, zone, address: values.address });
    setErrors(found);
    if (Object.keys(found).length) {
      scrollToElement(document.getElementById("livraison"));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { order, whatsappLink } = await submitOrder({
        items: sellable.map((item) => ({ product_id: item.id, variant_id: item.variant_id, quantity: item.quantity, name: item.name, attributes: item.attributes })),
        user,
        name: values.name,
        phone: values.phone,
        zone,
        address: values.address,
        whatsappNumber: contactInfo?.whatsapp,
        title: "NOUVELLE COMMANDE — MK BAZAAR",
      });
      save(items.filter((item) => item.unavailable));
      navigate("/commande-envoyee", { state: { order, whatsappLink, guest: !user } });
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111] font-admin antialiased">
      <Seo title="Panier" path="/panier" noindex />
      <Header />

      <main className={wrapClass}>
        <nav className="text-[13px] text-[#777] py-[22px]" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:underline">Accueil</Link> / <b className="font-medium text-[#111]">Panier</b>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em]">
            Mon panier {count > 0 && <span className="text-[#767676] font-normal">({count})</span>}
          </h1>
          {items.length > 0 && <Steps />}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 border-t border-[#ececec]">
            <ShoppingBag className="w-10 h-10 mx-auto text-[#bbb]" strokeWidth={1.2} aria-hidden="true" />
            <p className="text-[17px] font-medium mt-4">Votre panier est vide</p>
            <p className="text-sm text-[#666] mt-1">Parcourez la boutique et ajoutez vos pièces préférées.</p>
            <Link to="/products" className={`${shopButton("primary")} mt-6`}>Découvrir la boutique</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-10 items-start">
            <div className="space-y-10 min-w-0">
              <section aria-label="Articles">
                <div className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_130px_120px] gap-4 pb-3 border-b border-[#ececec] text-[12.5px] text-[#666]">
                  <span>Article</span><span className="text-right">Prix unitaire</span><span className="text-center">Quantité</span><span className="text-right">Total</span>
                </div>
                <ul>
                  {items.map((item, index) => (
                    <li key={`${item.id}-${item.variant_id ?? "u"}`} className={`grid grid-cols-[80px_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_120px_130px_120px] gap-x-4 gap-y-3 py-5 border-b border-[#ececec] items-center ${item.unavailable ? "opacity-60" : ""}`}>
                      <div className="contents md:flex md:gap-4 md:items-center">
                        <Link to={`/products/${item.slug}`} className="row-span-2 md:row-span-1 shrink-0">
                          <img src={item.image} alt="" className="w-20 h-[100px] object-cover rounded-sm bg-[#f3f3f3]" />
                        </Link>
                        <div className="min-w-0">
                          <Link to={`/products/${item.slug}`} className="font-medium hover:underline">{item.name}</Link>
                          {item.attributes && <p className="text-[13px] text-[#666] mt-0.5">{optionsLabel(item.attributes)}</p>}
                          {item.unavailable ? (
                            <p className="text-[13px] text-[#b42318] mt-1">Indisponible : retirez-le pour commander</p>
                          ) : (
                            <p className="text-[13px] text-[#166534] mt-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />En stock</p>
                          )}
                          <button type="button" onClick={() => remove(index)} className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-[#666] hover:text-[#b42318]">
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" /> Retirer
                          </button>
                        </div>
                      </div>
                      <div className="col-start-2 md:col-start-auto md:text-right text-sm tabular-nums">
                        {item.base_price > item.price && <s className="block text-[#767676] text-[13px]">{formatFCFA(item.base_price)}</s>}
                        {formatFCFA(item.price)}
                      </div>
                      <div className="col-start-2 md:col-start-auto md:justify-self-center flex items-center gap-3">
                        <div className="inline-flex items-center h-10 border border-[#d9d9d9] rounded" role="group" aria-label={`Quantité de ${item.name}`}>
                          <button type="button" onClick={() => setQuantity(index, item.quantity - 1)} disabled={item.quantity <= 1 || item.unavailable} className="w-9 h-full grid place-items-center disabled:opacity-40" aria-label="Diminuer">
                            <Minus className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                          <button type="button" onClick={() => setQuantity(index, item.quantity + 1)} disabled={item.unavailable || (item.stock && item.quantity >= item.stock)} className="w-9 h-full grid place-items-center disabled:opacity-40" aria-label="Augmenter">
                            <Plus className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden="true" />
                          </button>
                        </div>
                        <span className="md:hidden text-sm font-semibold tabular-nums">{formatFCFA(item.price * item.quantity)}</span>
                      </div>
                      <div className="hidden md:block text-right text-sm font-semibold tabular-nums">{formatFCFA(item.price * item.quantity)}</div>
                    </li>
                  ))}
                </ul>
                <Link to="/products" className="inline-block mt-5 text-sm underline">Continuer mes achats</Link>
              </section>

              <section id="livraison" aria-labelledby="delivery-title" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-5">
                  <h2 id="delivery-title" className="text-lg font-semibold">Vos coordonnées de livraison</h2>
                  {!user && <span className="text-xs font-medium bg-[#f1f1f1] text-[#444] rounded-full px-2.5 py-1">Sans compte</span>}
                </div>
                <div className="max-w-[560px]">
                  <DeliveryFields user={user} values={values} onChange={setValues} errors={errors} zones={shippingZones} idPrefix="cart" />
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-28 space-y-5" aria-label="Récapitulatif">
              <div className="border border-[#ececec] rounded p-5">
                <h2 className="text-base font-semibold mb-4">Récapitulatif</h2>
                <dl className="space-y-2.5 text-sm tabular-nums">
                  <div className="flex justify-between"><dt className="text-[#555]">Sous-total ({count} article{count > 1 ? "s" : ""})</dt><dd>{formatFCFA(subtotal)}</dd></div>
                  {discounts.map(([name, value]) => (
                    <div key={name} className="flex justify-between text-[#166534]"><dt>Remise · {name}</dt><dd>−{formatFCFA(value)}</dd></div>
                  ))}
                  <div className="flex justify-between"><dt className="text-[#555]">Livraison{zone ? ` · ${zone.name}` : ""}</dt><dd>{zone ? formatFCFA(zone.price) : "Selon la commune"}</dd></div>
                  <div className="flex justify-between pt-3 mt-1 border-t border-[#ececec] text-base font-semibold">
                    <dt>Total estimé</dt><dd>{formatFCFA(total)}</dd>
                  </div>
                  {!zone && <p className="text-[12.5px] text-[#666] -mt-1 text-right">hors frais de livraison</p>}
                </dl>
                {discountTotal > 0 && <p className="mt-3 text-[13px] font-medium text-[#166534]">Vous économisez {formatFCFA(discountTotal)}</p>}
                {submitError && <p role="alert" className="mt-4 text-[13px] text-[#b42318] bg-[#fdeaea] rounded px-3 py-2">{submitError}</p>}
                <button type="button" onClick={checkout} disabled={submitting || !checked || sellable.length === 0} className={`${shopButton("whatsapp", "lg")} w-full mt-5`}>
                  <MessageCircle className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" />
                  {submitting ? "Envoi…" : "Envoyer ma commande sur WhatsApp"}
                </button>
              </div>

              <div className="bg-[#fafafa] border border-[#ececec] rounded p-5 text-sm text-[#444]">
                <h2 className="font-semibold text-[#111] mb-3">Comment se passe la validation ?</h2>
                <ol className="space-y-2.5">
                  <li className="flex gap-2.5"><b className="font-semibold text-[#111]">1</b>Vous envoyez votre panier à notre équipe sur WhatsApp.</li>
                  <li className="flex gap-2.5"><b className="font-semibold text-[#111]">2</b><span>Nous vérifions la disponibilité et vous confirmons le <b className="font-semibold text-[#111]">montant total, livraison comprise</b>.</span></li>
                  <li className="flex gap-2.5"><b className="font-semibold text-[#111]">3</b><span>Le paiement se fait uniquement une fois la commande et le montant <b className="font-semibold text-[#111]">validés ensemble</b> sur WhatsApp.</span></li>
                </ol>
                <p className="mt-3 text-[12.5px] text-[#666]">Aucun paiement n'est demandé sur le site.</p>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
