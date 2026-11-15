import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaPinterest, FaTiktok } from "react-icons/fa";
import { Check, MessageCircle, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { resolveMediaUrl, getWhatsAppLink } from "../config/env";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { getCategoryMenu } from "../services/category";

const ICON = { strokeWidth: 1.6, "aria-hidden": true };

/** Engagements affichés au-dessus du pied de page. */
export function CommitmentStrip() {
  const items = [
    { icon: Truck, label: "Expédition sous 24 h, Abidjan et intérieur" },
    { icon: MessageCircle, label: "Commande et paiement validés sur WhatsApp" },
    { icon: RefreshCcw, label: "Échange sous 48 h" },
    { icon: ShieldCheck, label: "Qualité contrôlée avant envoi" },
  ];
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 font-admin">
      <ul className="flex flex-wrap justify-center gap-x-10 gap-y-3 py-[22px] border-y border-[#ececec] text-[12.5px] text-[#444]">
        {items.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-[#666]" {...ICON} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Pied de page (maquette « Retail premium ») : marque, catégories du menu,
 * aide, informations légales et contact.
 */
export default function Footer() {
  const { siteName, contactInfo, socialLinks, logo } = useSiteSettings();
  const [categories, setCategories] = useState([]);
  const logoSrc = logo?.url ? resolveMediaUrl(logo.url) : "/mk_bazaar_logo.png";
  const whatsappHref = getWhatsAppLink(null, contactInfo?.whatsapp);

  useEffect(() => {
    let cancelled = false;
    getCategoryMenu().then((res) => {
      if (!cancelled && res?.success) setCategories([...(res.data?.items ?? []), ...(res.data?.more ?? [])]);
    });
    return () => { cancelled = true; };
  }, []);

  const socials = [
    { key: "instagram", icon: FaInstagram, label: "Instagram" },
    { key: "facebook", icon: FaFacebook, label: "Facebook" },
    { key: "tiktok", icon: FaTiktok, label: "TikTok" },
    { key: "pinterest", icon: FaPinterest, label: "Pinterest" },
  ].filter(({ key }) => !!socialLinks?.[key]);

  const heading = "text-[13px] font-semibold text-[#111] mb-3.5";
  const link = "block text-sm text-[#555] hover:text-[#111] mb-[11px]";

  return (
    <footer className="bg-[#fafafa] border-t border-[#ececec] mt-24 font-admin antialiased">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-14 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] gap-10">
        <div>
          <img src={logoSrc} alt={siteName} className="h-11 w-auto" />
          <p className="mt-4 text-sm text-[#555] leading-relaxed max-w-[260px]">
            Mode, bijoux et accessoires, sélectionnés à Abidjan pour leur qualité et leur finition.
          </p>
        </div>

        <nav aria-label="Boutique">
          <h2 className={heading}>Boutique</h2>
          {categories.slice(0, 6).map((category) => (
            <Link key={category.id} to={`/products?category=${encodeURIComponent(category.slug)}`} className={link}>{category.name}</Link>
          ))}
          <Link to="/offres" className={link}>Offres</Link>
        </nav>

        <nav aria-label="Aide">
          <h2 className={heading}>Aide</h2>
          <Link to="/compte?tab=orders" className={link}>Suivre ma commande</Link>
          <Link to="/about#livraison" className={link}>Livraison et échanges</Link>
          <Link to="/about#faq" className={link}>Questions fréquentes</Link>
        </nav>

        <nav aria-label="Informations légales">
          <h2 className={heading}>Informations légales</h2>
          <Link to="/about#cgv" className={link}>Conditions générales de vente</Link>
          <Link to="/about#mentions" className={link}>Mentions légales</Link>
          <Link to="/about#confidentialite" className={link}>Politique de confidentialité</Link>
        </nav>

        <div>
          <h2 className={heading}>Contact</h2>
          {contactInfo?.address && <p className="text-sm text-[#555] mb-[11px]">{contactInfo.address}</p>}
          {contactInfo?.email && <a href={`mailto:${contactInfo.email}`} className={link}>{contactInfo.email}</a>}
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-9 px-3.5 mt-1.5 mb-3 rounded border border-[#d4d4d4] bg-white text-[13.5px] font-semibold text-[#555] hover:text-[#111]">
            <MessageCircle className="w-4 h-4" {...ICON} /> Écrire sur WhatsApp
          </a>
          {socials.length > 0 && (
            <div className="flex gap-3.5 text-[#555]">
              {socials.map(({ key, icon: Icon, label }) => (
                <a key={key} href={socialLinks[key]} target="_blank" rel="noopener noreferrer" aria-label={label} className="hover:text-[#111]">
                  <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-5 pb-7 border-t border-[#ececec] flex flex-col sm:flex-row gap-2 justify-between text-[12.5px] text-[#666]">
        <span>© {new Date().getFullYear()} {siteName}. Tous droits réservés.</span>
        <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" {...ICON} /> Commande et paiement confirmés sur WhatsApp</span>
      </div>
    </footer>
  );
}
