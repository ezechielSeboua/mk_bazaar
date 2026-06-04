/** Zones par défaut (Abidjan) — utilisées si aucune config en base */
export const DEFAULT_SHIPPING_ZONES = [
    { id: 1, name: 'Abobo', price: 1500 },
    { id: 2, name: 'Adjamé', price: 1000 },
    { id: 3, name: 'Attécoubé', price: 1500 },
    { id: 4, name: 'Cocody', price: 2000 },
    { id: 5, name: 'Koumassi', price: 1500 },
    { id: 6, name: 'Marcory', price: 1500 },
    { id: 7, name: 'Plateau', price: 2000 },
    { id: 8, name: 'Port-Bouët', price: 2000 },
    { id: 9, name: 'Treichville', price: 1500 },
    { id: 10, name: 'Yopougon', price: 1500 },
    { id: 11, name: 'Expédition (hors Abidjan)', price: 3000 },
];

/** Normalise le format API (name ou legacy commune) */
export const normalizeShippingZones = (zones) => {
    if (!Array.isArray(zones)) return [];

    return zones
        .map((zone, index) => ({
            id: zone.id ?? index + 1,
            name: (zone.name ?? zone.commune ?? '').trim(),
            price: Number(zone.price) || 0,
        }))
        .filter((zone) => zone.name.length > 0);
};

export const validateShippingZones = (zones) => {
    if (!zones.length) {
        return 'Ajoutez au moins une zone de livraison.';
    }

    const emptyName = zones.some((z) => !z.name?.trim());
    if (emptyName) return 'Chaque zone doit avoir un nom.';

    const invalidPrice = zones.some((z) => Number(z.price) < 0 || Number.isNaN(Number(z.price)));
    if (invalidPrice) return 'Les tarifs doivent être des nombres positifs.';

    return null;
};
