import { Link } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppLink } from "../config/env";

export default function Footer() {
  return (
    <footer className="w-full bg-black/90 border-t border-stone-200/80 mt-20">
      {/* Bloc principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs">
        {/* Colonne 1 – Marque */}
        <div className="sm:col-span-2 md:col-span-1">
          <div className="w-16 bg-white rounded-full flex items-center justify-start mb-6">
            <img src="/mk_bazaar_logo.png" alt="logo" />
          </div>
          <h3 className="font-bold uppercase tracking-[0.2em] text-white mb-4 text-sm">
            MK Bazaar
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
              <Link to="/" className="hover:text-black transition-colors">
                Accueil
              </Link>
            </li>
            <li>
              <Link
                to="/products"
                className="hover:text-black transition-colors"
              >
                Collections
              </Link>
            </li>
            <li>
              <Link to="/panier" className="hover:text-black transition-colors">
                Panier
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 3 – Aide */}
        {/* <div>
          <h3 className="font-bold uppercase tracking-[0.2em] text-black mb-4 text-sm">
            Aide & Infos
          </h3>
          <ul className="space-y-2.5 text-white uppercase tracking-wider">
            <li>
              <span className="cursor-not-allowed opacity-50">Livraisons</span>
            </li>
            <li>
              <span className="cursor-not-allowed opacity-50">Retours</span>
            </li>
            <li>
              <span className="cursor-not-allowed opacity-50">FAQ</span>
            </li>
          </ul>
        </div> */}

        {/* Colonne 4 – Contact */}
        <div>
          <h3 className="font-bold uppercase tracking-[0.2em] text-[#c07b5a] mb-4 text-sm">
            Contact
          </h3>
          <p className="text-white leading-relaxed mb-4">
            Disponible par WhatsApp pour toute question ou commande.
          </p>
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-emerald-800 hover:text-emerald-600 transition-colors"
          >
            <FaWhatsapp className="text-lg" />
            <span className="uppercase tracking-wider text-[10px]">
              Échanger sur WhatsApp
            </span>
          </a>
        </div>
      </div>

      {/* Barre inférieure */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-5 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-center text-[10px] text-white uppercase tracking-widest">
        <p>
          &copy; {new Date().getFullYear()} MK BAZAAR. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
