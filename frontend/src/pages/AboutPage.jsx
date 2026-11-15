import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Gem, Handshake, MessageCircle, Sparkles } from "lucide-react";
import Header from "../components/Header";
import Footer, { CommitmentStrip } from "../components/Footer";
import Seo from "../components/Seo";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { getWhatsAppLink, resolveMediaUrl } from "../config/env";
import appSettingsService from "../services/appSettings";
import { HERO_DEFAULTS } from "../constants/siteDefaults";
import { pillButton, shopButton, tagClass, wrapClass } from "../components/shop/shopUtils";
import useStorefrontMotion from "../hooks/useStorefrontMotion";

/*
 * À propos (maquette « 06 · À propos ») : la boutique, ses engagements, le
 * déroulé d'une commande, livraison et échanges, questions fréquentes et
 * informations légales (ancres utilisées par le pied de page).
 */

const COMMITMENTS = [
  { icon: Sparkles, title: "Minimalisme", text: "Lignes épurées et couleurs neutres, pensées pour durer et s'adapter à votre style." },
  { icon: Gem, title: "Qualité", text: "Matières sélectionnées et finitions contrôlées avant chaque envoi." },
  { icon: Handshake, title: "Circuit court", text: "Pas d'intermédiaire : vous échangez directement avec notre équipe." },
];

const STEPS = [
  { title: "Explorez", text: "Parcourez la boutique et ajoutez vos articles au panier." },
  { title: "Envoyez", text: "Votre panier est transmis à notre équipe sur WhatsApp." },
  { title: "Validez", text: "Nous confirmons la disponibilité et le montant total. Vous payez une fois la commande validée." },
  { title: "Recevez", text: "Votre commande est expédiée sous 24 h, à Abidjan et à l'intérieur." },
];

const FAQ = [
  { q: "Faut-il un compte pour commander ?", a: "Non. Un compte vous permet seulement de retrouver vos commandes et vos favoris." },
  { q: "Quand dois-je payer ?", a: "Uniquement après validation de la commande avec notre équipe sur WhatsApp, une fois le montant total confirmé. Aucun paiement n'est demandé sur le site." },
  { q: "Les remises sont-elles garanties ?", a: "Les remises affichées sont appliquées à l'enregistrement de la commande, dans la limite des stocks. Elles figurent dans le message envoyé sur WhatsApp." },
  { q: "Comment suivre ma commande ?", a: "Depuis votre compte, rubrique « Mes commandes », ou en communiquant votre numéro de commande à notre équipe sur WhatsApp." },
];

export default function AboutPage() {
  const { contactInfo, siteName } = useSiteSettings();
  const whatsappLink = getWhatsAppLink(null, contactInfo?.whatsapp);
  const [image, setImage] = useState(HERO_DEFAULTS.image_url);
  const mainRef = useRef(null);
  useStorefrontMotion(mainRef, [image]);

  useEffect(() => {
    let cancelled = false;
    appSettingsService.getSetting("hero")
      .then((data) => { if (!cancelled && data?.image_url) setImage(data.image_url.startsWith("/") ? resolveMediaUrl(data.image_url) : data.image_url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const sectionTitle = (tag, title) => (
    <>
      <p data-anim="fade" className={`${tagClass} text-[#6b6b6b]`}>{tag}</p>
      <h2 data-anim="title" className="text-[26px] sm:text-[34px] font-light tracking-[-0.02em] mt-3">{title}</h2>
    </>
  );

  return (
    <div className="min-h-screen bg-white text-[#111] font-admin antialiased">
      <Seo title="À propos" description="MK Bazaar : une sélection exigeante de mode, bijoux et accessoires à Abidjan. Commande directe sur WhatsApp." path="/about" />
      <Header />

      <main ref={mainRef}>
        <section data-anim="hero" className="relative h-[460px] sm:h-[560px] overflow-hidden bg-[#f4f3f1]">
          {image && <img src={image} alt="" className="absolute inset-0 w-full h-[112%] -top-[6%] object-cover" />}
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,.6),rgba(0,0,0,0)_60%)]" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-12 px-4 text-center text-white">
            <p data-anim="fade" data-anim-load data-anim-delay="0.3" className={`${tagClass} text-[#eee]`}>La boutique</p>
            <h1 data-anim="title" data-anim-load data-anim-delay="0.45" className="text-[32px] sm:text-[48px] font-light tracking-[-0.02em] mt-3 max-w-[820px] mx-auto">Une sélection exigeante, sans intermédiaire.</h1>
            <p data-anim="fade" data-anim-load data-anim-delay="0.8" className="text-[15px] sm:text-base text-[#e5e5e5] mt-4 max-w-[620px] mx-auto">
              Des pièces intemporelles, choisies à Abidjan pour leur qualité et leur design épuré. Vous commandez directement auprès de nous, sur WhatsApp.
            </p>
          </div>
        </section>

        <section className={`${wrapClass} pt-20 sm:pt-28 max-w-[820px] text-center`}>
          {sectionTitle("Notre histoire", "Née à Abidjan, pensée pour durer")}
          <p data-anim="fade" className="text-[16px] leading-[1.75] text-[#444] mt-6">
            {siteName} sélectionne chaque pièce avec exigence, pour sa matière, sa coupe et sa finition : vêtements,
            chaussures, sacs, bijoux et accessoires, à porter au quotidien comme lors de vos réceptions.
          </p>
        </section>

        <section className={`${wrapClass} pt-20 sm:pt-28 text-center`}>
          {sectionTitle("Nos engagements", "Ce qui guide chaque pièce")}
          <div data-anim="stagger" className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 text-left">
            {COMMITMENTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="border border-[#ececec] rounded p-6">
                <Icon className="w-6 h-6 text-[#111]" strokeWidth={1.4} aria-hidden="true" />
                <h3 className="text-lg font-semibold mt-4">{title}</h3>
                <p className="text-sm text-[#555] mt-2 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${wrapClass} pt-20 sm:pt-28 text-center`}>
          {sectionTitle("Commander", "Comment se passe une commande")}
          <ol data-anim="stagger" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 text-left">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t border-[#111] pt-5">
                <span className="text-[13px] font-semibold tabular-nums text-[#6b6b6b]">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="text-lg font-semibold mt-2">{step.title}</h3>
                <p className="text-sm text-[#555] mt-2 leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
          <Link to="/products" className={`${pillButton("light")} mt-12`}>Découvrir la boutique</Link>
        </section>

        <section id="livraison" className={`${wrapClass} pt-20 sm:pt-28 max-w-[820px] scroll-mt-28`}>
          {sectionTitle("Livraison et échanges", "Expédition sous 24 h")}
          <div data-anim="fade" className="space-y-4 text-[15px] leading-[1.75] text-[#444] mt-6">
            <p>Votre commande est expédiée sous 24 h après validation, à Abidjan et à l'intérieur du pays. Les frais de livraison dépendent de votre commune et vous sont indiqués avant la validation.</p>
            <p>Un souci de taille ? L'échange est possible sous 48 h après réception, pour un article non porté et dans son état d'origine. Contactez-nous sur WhatsApp avec votre numéro de commande.</p>
          </div>
        </section>

        <section id="faq" className={`${wrapClass} pt-20 sm:pt-28 max-w-[820px] scroll-mt-28`}>
          {sectionTitle("Aide", "Questions fréquentes")}
          <div data-anim="stagger" className="mt-6 divide-y divide-[#ececec] border-y border-[#ececec]">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="cursor-pointer list-none flex justify-between items-center gap-4 text-[15px] font-medium">
                  {q}<span className="text-[#767676] group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-sm text-[#555] leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={`${wrapClass} pt-20 sm:pt-28 max-w-[820px] space-y-10`}>
          <div id="cgv" className="scroll-mt-28">
            <h2 className="text-xl font-semibold">Conditions générales de vente</h2>
            <p className="text-sm text-[#555] leading-relaxed mt-3">
              Les commandes passées sur le site sont des demandes : elles deviennent définitives après confirmation de la disponibilité
              et du montant total par notre équipe sur WhatsApp, puis paiement. Les prix et remises sont ceux affichés au moment de la commande,
              dans la limite des stocks.
            </p>
          </div>
          <div id="mentions" className="scroll-mt-28">
            <h2 className="text-xl font-semibold">Mentions légales</h2>
            <p className="text-sm text-[#555] leading-relaxed mt-3">
              {siteName}{contactInfo?.address ? `, ${contactInfo.address}` : ""}{contactInfo?.email ? ` · ${contactInfo.email}` : ""}.
            </p>
          </div>
          <div id="confidentialite" className="scroll-mt-28">
            <h2 className="text-xl font-semibold">Politique de confidentialité</h2>
            <p className="text-sm text-[#555] leading-relaxed mt-3">
              Vos nom, numéro de téléphone et adresse servent uniquement à traiter et livrer vos commandes. Vos favoris et votre panier sont
              enregistrés sur votre appareil.
            </p>
          </div>
        </section>

        <section className={`${wrapClass} pt-20 sm:pt-28 text-center`}>
          <div className="bg-[#f4f3f1] px-6 py-14">
            <h2 data-anim="title" className="text-[24px] sm:text-[30px] font-light tracking-[-0.02em]">Une question ? Notre équipe vous répond sur WhatsApp</h2>
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={`${shopButton("primary")} mt-6`}>
                <MessageCircle className="w-4 h-4" strokeWidth={1.6} aria-hidden="true" /> Écrire sur WhatsApp
              </a>
            )}
          </div>
        </section>

        <div className="mt-20">
          <CommitmentStrip />
        </div>
      </main>

      <Footer />
    </div>
  );
}
