import { Link } from "react-router-dom";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok, FaPinterest } from "react-icons/fa";
import { resolveMediaUrl, getWhatsAppLink } from "../config/env";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

export default function Footer() {
  const { siteName, contactInfo, socialLinks, logo } = useSiteSettings();

  const logoSrc = logo?.url ? resolveMediaUrl(logo.url) : '/mk_bazaar_logo.png';
  const whatsappHref = getWhatsAppLink(null, contactInfo.whatsapp);

  const socialItems = [
    { key: 'instagram', icon: FaInstagram, label: 'Instagram' },
    { key: 'facebook',  icon: FaFacebook,  label: 'Facebook'  },
    { key: 'tiktok',    icon: FaTiktok,    label: 'TikTok'    },
    { key: 'pinterest', icon: FaPinterest, label: 'Pinterest' },
  ].filter(({ key }) => !!socialLinks[key]);

  return (
    <footer className="w-full bg-stone-950 border-t border-stone-800 text-stone-300 mt-20">
      {/* Bloc principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs">
        {/* Colonne 1 – Marque */}
        <div className="sm:col-span-2 md:col-span-1">
          <div className="w-20 h-20 bg-white rounded-2xl p-2 flex items-center justify-center mb-5 shadow-sm">
            <img src={logoSrc} alt={siteName} className="w-full h-full object-contain" />
          </div>
          <h3 className="font-serif text-base tracking-wider text-white mb-3">
            {siteName}
          </h3>
          <p className="text-stone-400 text-xs leading-relaxed max-w-xs font-light">
            Sélection de pièces textiles épurées et objets d'artisanat d'exception. L'authenticité et l'élégance minimaliste.
          </p>
        </div>

        {/* Colonne 2 – Navigation */}
        <div>
          <h3 className="font-semibold uppercase tracking-[0.2em] text-brand-terracotta mb-4 text-xs">
            Navigation
          </h3>
          <ul className="space-y-2.5 text-stone-300 text-xs uppercase tracking-wider font-medium">
            <li>
              <Link to="/" className="hover:text-white transition-colors">
                Accueil
              </Link>
            </li>
            <li>
              <Link to="/products" className="hover:text-white transition-colors">
                Collections
              </Link>
            </li>
            <li>
              <Link to="/favoris" className="hover:text-white transition-colors">
                Favoris
              </Link>
            </li>
            <li>
              <Link to="/panier" className="hover:text-white transition-colors">
                Panier
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-white transition-colors">
                À propos
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 3 – Contact */}
        <div>
          <h3 className="font-semibold uppercase tracking-[0.2em] text-brand-terracotta mb-4 text-xs">
            Contact
          </h3>
          <div className="space-y-2 text-stone-400 text-xs leading-relaxed mb-4 font-light">
            {contactInfo.address && <p>{contactInfo.address}</p>}
            {contactInfo.email && (
              <a href={`mailto:${contactInfo.email}`} className="block hover:text-white transition-colors">
                {contactInfo.email}
              </a>
            )}
          </div>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors font-medium text-xs mt-1"
            >
              <FaWhatsapp className="text-base" />
              <span className="uppercase tracking-wider text-[11px]">
                Échanger sur WhatsApp
              </span>
            </a>
          )}
          {socialItems.length > 0 && (
            <div className="flex items-center gap-3 mt-5">
              {socialItems.map(({ key, icon: Icon, label }) => (
                <a
                  key={key}
                  href={socialLinks[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition-all"
                >
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Colonne 4 – Engagement & Livraison */}
        <div>
          <h3 className="font-semibold uppercase tracking-[0.2em] text-brand-terracotta mb-4 text-xs">
            Engagements
          </h3>
          <ul className="space-y-2 text-stone-400 text-xs font-light leading-relaxed">
            <li>✓ Paiement sécurisé à la livraison</li>
            <li>✓ Expédition rapide à Abidjan & intérieur</li>
            <li>✓ Support client dédié sur WhatsApp</li>
            <li>✓ Matières certifiées de qualité supérieure</li>
          </ul>
        </div>
      </div>

      {/* Barre inférieure */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-5 border-t border-stone-900 flex flex-col sm:flex-row justify-between items-center text-[10px] text-stone-500 uppercase tracking-widest gap-2">
        <p>&copy; {new Date().getFullYear()} {siteName.toUpperCase()}. Tous droits réservés.</p>
        <p className="normal-case tracking-normal text-stone-500">Conçu avec soin pour une expérience d'exception.</p>
      </div>
    </footer>
  );
}
