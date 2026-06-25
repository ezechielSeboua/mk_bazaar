import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'mk_wishlist';

export function WishlistProvider({ children }) {
    const [wishlist, setWishlist] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    });

    const toggleWishlist = useCallback((product) => {
        setWishlist(prev => {
            const exists = prev.some(p => p.id === product.id);
            const next = exists
                ? prev.filter(p => p.id !== product.id)
                : [...prev, {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    image: product.image_path?.[0] || null,
                    category: product.category?.name || product.category || null,
                }];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const isInWishlist = useCallback((productId) => wishlist.some(p => p.id === productId), [wishlist]);

    const value = useMemo(() => ({ wishlist, toggleWishlist, isInWishlist }), [wishlist, toggleWishlist, isInWishlist]);

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist doit être utilisé dans WishlistProvider');
    return ctx;
};
