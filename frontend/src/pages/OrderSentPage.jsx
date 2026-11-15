import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, MessageCircle, Package } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import { LAST_ORDER_KEY } from "../components/shop/checkout";
import { formatFCFA, promotionLabel, shopButton, wrapClass } from "../components/shop/shopUtils";

/*
 * Confirmation après envoi (maquette « 04c · Commande envoyée ») : la commande
 * est enregistrée mais pas encore validée, la suite se fait sur WhatsApp.
 */

const STEPS = [
  { title: "Panier envoyé", text: "Votre message WhatsApp contient la liste des articles, les remises appliquées et votre adresse." },
  { title: "Confirmation par notre équipe", text: "Nous vérifions la disponibilité et vous confirmons le montant total, livraison comprise. Réponse en moins de 24 h." },
  { title: "Validation et paiement", text: "Vous validez la commande et payez sur WhatsApp, uniquement après accord sur le montant." },
  { title: "Expédition", text: "Votre commande est expédiée sous 24 h après validation." },
];

const readLastOrder = () => {
  try { return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || "null"); } catch { return null; }
};

export default function OrderSentPage() {
  const { state } = useLocation();
  const data = state?.order ? state : readLastOrder();
  const order = data?.order;

  if (!order) {
    return (
      <div className="min-h-screen bg-white text-[#111] font-admin antialiased">
        <Seo title="Commande" path="/commande-envoyee" noindex />
        <Header />
        <main className={`${wrapClass} py-24 text-center`}>
          <h1 className="text-2xl font-semibold">Aucune commande récente</h1>
          <p className="text-[15px] text-[#666] mt-2">Retrouvez vos commandes dans votre compte, ou poursuivez vos achats.</p>
          <div className="flex justify-center gap-3 mt-6">
            <Link to="/compte?tab=orders" className={shopButton("secondary")}>Mes commandes</Link>
            <Link to="/products" className={shopButton("primary")}>Continuer mes achats</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const items = order.items ?? [];
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsGross = items.reduce((sum, item) => sum + (item.price + (item.discount ?? 0)) * item.quantity, 0);
  const promotions = [...new Set(items.filter((i) => i.discount > 0).map((i) => promotionLabel(i.promotion?.name)).filter(Boolean))];

  return (
    <div className="min-h-screen bg-white text-[#111] font-admin antialiased">
      <Seo title="Commande envoyée" path="/commande-envoyee" noindex />
      <Header />

      <main className={`${wrapClass} pt-12 sm:pt-16`}>
        <div className="max-w-[920px] mx-auto grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-10">
          <div>
            <CheckCircle2 className="w-10 h-10 text-[#166534]" strokeWidth={1.4} aria-hidden="true" />
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] mt-4">Commande envoyée sur WhatsApp</h1>
            <p className="text-[15px] text-[#444] mt-3 leading-relaxed">
              Votre commande <b className="font-semibold text-[#111]">{order.order_number}</b> a été transmise à notre équipe.
              Elle <b className="font-semibold text-[#111]">n'est pas encore validée</b> : rien n'est à payer pour l'instant.
            </p>

            <h2 className="text-base font-semibold mt-9 mb-4">Et maintenant ?</h2>
            <ol className="space-y-5">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className={`w-7 h-7 shrink-0 rounded-full grid place-items-center text-[13px] font-semibold ${index === 0 ? "bg-[#111] text-white" : "bg-[#f1f1f1] text-[#444]"}`}>{index + 1}</span>
                  <div>
                    <p className="font-medium text-[15px]">{step.title}</p>
                    <p className="text-sm text-[#666] mt-0.5 leading-relaxed">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="border border-[#ececec] rounded p-5 self-start" aria-label="Récapitulatif de la commande">
            <dl className="space-y-2.5 text-sm tabular-nums">
              <div className="flex justify-between"><dt className="text-[#555]">{count} article{count > 1 ? "s" : ""}</dt><dd>{formatFCFA(itemsGross)}</dd></div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-[#166534]"><dt>Remise{promotions.length ? ` · ${promotions.join(", ")}` : ""}</dt><dd>−{formatFCFA(order.discount_total)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-[#555]">Livraison · {order.delivery_location}</dt><dd>{formatFCFA(order.delivery_fee)}</dd></div>
              <div className="flex justify-between pt-3 border-t border-[#ececec] text-base font-semibold"><dt>Total estimé</dt><dd>{formatFCFA(order.total_price)}</dd></div>
            </dl>

            <div className="grid gap-2.5 mt-5">
              {data.whatsappLink && (
                <a href={data.whatsappLink} target="_blank" rel="noopener noreferrer" className={`${shopButton("whatsapp")} w-full`}>
                  <MessageCircle className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" /> Ouvrir la conversation WhatsApp
                </a>
              )}
              {!data.guest && (
                <Link to="/compte?tab=orders" className={`${shopButton("secondary")} w-full`}>
                  <Package className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" /> Suivre ma commande
                </Link>
              )}
            </div>
            {data.whatsappLink && <p className="mt-3 text-[12.5px] text-[#666]">WhatsApp ne s'est pas ouvert ? Utilisez le bouton ci-dessus.</p>}
            {data.guest && (
              <p className="mt-4 text-[12.5px] text-[#444] bg-[#fafafa] rounded px-3 py-2.5">
                Commande passée sans compte : notez votre numéro de commande, il vous sera utile pour échanger avec notre équipe.
              </p>
            )}
          </aside>
        </div>

        <div className="text-center mt-14">
          <Link to="/products" className="text-sm underline">Continuer mes achats</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
