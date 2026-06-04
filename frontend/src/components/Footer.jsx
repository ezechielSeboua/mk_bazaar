import { FaWhatsapp } from 'react-icons/fa';
import { getWhatsAppLink } from '../config/env';

export default function Footer() {
    return (
        <footer className="bg-black/80 py-6 mt-12">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-6 md:px-12">
                <p className="text-sm text-white">
                    &copy; {new Date().getFullYear()} MK BAZAAR. Tous droits réservés.
                </p>
                <div className="flex items-center gap-4">
                    <a 
                        href={getWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white hover:text-emerald-600 transition-colors"
                    >   
                        <FaWhatsapp className="text-lg" />
                        Contactez-nous
                    </a>
                </div>
            </div>
        </footer>
    );
}