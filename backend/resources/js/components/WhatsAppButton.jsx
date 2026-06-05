import React from 'react';

export default function WhatsAppButton({ product, options = {} }) {
  const handleWhatsAppClick = () => {
    if (!product.in_stock) return;

    // Build the message dynamically
    const optionsText = Object.entries(options)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const message = `Bonjour MK Bazaar, je souhaite commander l'article suivant:\n\n*Produit:* ${product.name}\n${
      optionsText ? `*Options:* ${optionsText}\n` : ''
    }*Prix:* ${product.price} FCFA\n*Lien:* ${window.location.href}\n\nMerci de me confirmer la disponibilité pour une livraison.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/225XXXXXXXXXX?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      disabled={!product.in_stock}
      className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
        product.in_stock
          ? 'bg-green-500 hover:bg-green-600 text-white'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.992 1.271 9.909 9.909 0 006.793 16.645 9.865 9.865 0 005.529-1.675l6.058 1.591-.923-5.567a9.879 9.879 0 001.064-4.942c0-5.448-4.424-9.868-9.868-9.868z" />
      </svg>
      Acheter via WhatsApp
    </button>
  );
}
