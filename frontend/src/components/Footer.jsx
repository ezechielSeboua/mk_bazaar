import { Link } from "react-router-dom";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok, FaPinterest } from "react-icons/fa";
import { resolveMediaUrl, getWhatsAppLink } from "../config/env";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

export default function Footer() {
  const { siteName, contactInfo, socialLinks, logo } = useSiteSettings();

  const logoSrc = logo?.url ? resolveMediaUrl(logo.url) : '/mk_bazaar_logo.png';
  // getWhatsAppLink applique le repli VITE_WHATSAPP_NUMBER et retourne null si
  // aucun numéro n'est exploitable : pas de garde supplémentaire ici, sinon le
  // footer masquerait son lien pendant que le reste du site affiche le sien.
  const whatsappHref = getWhatsAppLink(null, contactInfo.whatsapp);

  const socialItems = [
    { key: 'instagram', icon: FaInstagram, label: 'Instagram' },
    { key: 'facebook',  icon: FaFacebook,  label: 'Facebook'  },
    { key: 'tiktok',    icon: FaTiktok,    label: 'TikTok'    },
    { key: 'pinterest', icon: FaPinterest, label: 'Pinterest' },
  ].filter(({ key }) => !!socialLinks[key]);

  return (
    <footer className="w-full bg-black/90 border-t border-stone-200/80 mt-20">
      {/* Bloc principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs">
        {/* Colonne 1 – Marque */}
        <div className="sm:col-span-2 md:col-span-1">
          <div className="w-24 bg-white rounded-full flex items-center justify-start mb-6">
            <img src={logoSrc} alt={siteName} />
          </div>
          <h3 className="font-bold uppercase tracking-[0.2em] text-white mb-4 text-sm">
            {siteName}
          </h3>
          <p className="text-white leading-relaxed max-w-xs">
            Sélection d'objets d'art et pièces textiles épurées. L'authenticité
            à l'état pur.
          </p>
        </div>

        {/* Colonne 2 – Navigation */}
        <div>
          <h3 className="font-bold uppercase tracking-[0.2em] text-[#c07b5a] mb-4 text-sm">
            Navigation
          </h3>
          <ul className="space-y-2.5 text-white uppercase tracking-wider">
            <li>
              <Link to="/" className="hover:text-stone-300 transition-colors">
                Accueil
              </Link>
            </li>
            <li>
              <Link to="/products" className="hover:text-stone-300 transition-colors">
                Collections
              </Link>
            </li>
            <li>
              <Link to="/panier" className="hover:text-stone-300 transition-colors">
                Panier
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 3 – Contact */}
        <div>
          <h3 className="font-bold uppercase tracking-[0.2em] text-[#c07b5a] mb-4 text-sm">
            Contact
          </h3>
          <div className="space-y-2 text-white text-[11px] leading-relaxed mb-4">
            {contactInfo.address && <p>{contactInfo.address}</p>}
            {contactInfo.email && (
              <a href={`mailto:${contactInfo.email}`} className="block hover:text-stone-300 transition-colors">
                {contactInfo.email}
              </a>
            )}
          </div>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <FaWhatsapp className="text-lg" />
              <span className="uppercase tracking-wider text-[10px]">
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
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  <Icon className="text-lg" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barre inférieure */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-5 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center text-[10px] text-stone-500 uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} {siteName.toUpperCase()}. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
