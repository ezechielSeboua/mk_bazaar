// import { fetchAPI } from './apiConfig';
// import { fetchAllPages } from '../utils/pagination';

// const DASHBOARD_PER_PAGE = 500;

// // Une page de produits (boutique publique, filtres optionnels)
// export const getProducts = async (page = 1, categorySlug = null, sort = null, search = null, inStock = null) => {
//     let url = `/products?page=${page}&per_page=12`;

//     if (categorySlug) {
//         url += `&category_slug=${categorySlug}`;
//     }

//     if (sort === 'prix-croissant') {
//         url += `&sort=price_low`;
//     } else if (sort === 'prix-decroissant') {
//         url += `&sort=price_high`;
//     } else if (sort === 'nouveautes') {
//         url += `&sort=newest`;
//     }

//     if (search && search.trim() !== '') {
//         url += `&search=${encodeURIComponent(search)}`;
//     }

//     if (inStock !== null) {
//         url += `&in_stock=${inStock}`;   // envoie 1 ou 0
//     }

//     return fetchAPI(url, { method: 'GET' });
// };


// // Get featured products
// export const getFeaturedProducts = async () => {
//     return fetchAPI('/products/featured', {
//         method: 'GET'
//     });
// };

// // Get product by slug (route publique)
// export const getProductBySlug = async (slug) => {
//     return fetchAPI(`/products/${encodeURIComponent(slug)}`, {
//         method: 'GET'
//     });
// };

// // Get product by ID (admin / compatibilité)
// export const getProductById = async (productId) => {
//     return fetchAPI(`/products/${productId}`, {
//         method: 'GET'
//     });
// };

// // Create product
// export const createProduct = async (productData) => {

//     return fetchAPI('/products', {
//         method: 'POST',
//         body:
//             productData instanceof FormData
//                 ? productData
//                 : JSON.stringify(productData)
//     });
// };

// // Update product
// export const updateProduct = async (productId, productData) => {

//     // Cas FormData + fichiers
//     if (productData instanceof FormData) {

//         productData.append('_method', 'PUT');

//         return fetchAPI(`/products/${productId}`, {
//             method: 'POST',
//             body: productData
//         });
//     }

//     // Cas JSON
//     return fetchAPI(`/products/${productId}`, {
//         method: 'PUT',
//         body: JSON.stringify(productData)
//     });
// };

// // Delete product
// export const deleteProduct = async (productId) => {
//     return fetchAPI(`/products/${productId}`, {
//         method: 'DELETE'
//     });
// };

// // Add product images
// export const addProductImages = async (productId, formData) => {
//     return fetchAPI(`/products/${productId}/images`, {
//         method: 'POST',
//         body: formData
//     });
// };

// // Delete product image
// export const deleteProductImage = async (imageId) => {
//     return fetchAPI(`/images/${imageId}`, {
//         method: 'DELETE'
//     });
// };

// // Search products
// export const searchProducts = async (query) => {
//     return fetchAPI(
//         `/products?search=${encodeURIComponent(query)}`,
//         {
//             method: 'GET'
//         }
//     );
// };

// // Get products by category
// export const getProductsByCategory = async (categoryId) => {
//     return fetchAPI(`/products?category_id=${categoryId}`, {
//         method: 'GET'
//     });
// };

// // Une page brute (dashboard / admin)
// export const getProductsPage = async (page = 1, perPage = DASHBOARD_PER_PAGE) => {
//     return fetchAPI(`/products?page=${page}&per_page=${perPage}`, {
//         method: 'GET'
//     });
// };

// // Tous les produits pour le dashboard (parcours toutes les pages)
// export const getAllProducts = async () => {
//     return fetchAllPages((page) => getProductsPage(page, DASHBOARD_PER_PAGE));
// };

// //Supprimer plusieurs produits
// export const deleteProducts = async (ids) => {
//     return fetchAPI('/products/bulk-delete', {
//         method: 'POST',
//         body: JSON.stringify({ ids }),
//     });
// };


import { fetchAPI } from './apiConfig';
import { fetchAllPages } from '../utils/pagination';

const DASHBOARD_PER_PAGE = 500;

// Une page de produits (boutique publique, filtres optionnels)
export const getProducts = async (page = 1, categorySlug = null, sort = null, search = null, inStock = null) => {
    let url = `/products?page=${page}&per_page=12`;

    if (categorySlug) {
        url += `&category_slug=${categorySlug}`;
    }

    if (sort === 'prix-croissant') {
        url += `&sort=price_low`;
    } else if (sort === 'prix-decroissant') {
        url += `&sort=price_high`;
    } else if (sort === 'nouveautes') {
        url += `&sort=newest`;
    }

    if (search && search.trim() !== '') {
        url += `&search=${encodeURIComponent(search)}`;
    }

    // Adapté pour correspondre à la logique de variantes (le backend interceptera in_stock)
    if (inStock !== null) {
        url += `&in_stock=${inStock}`;   // envoie 1 ou 0
    }

    return fetchAPI(url, { method: 'GET' });
};

// Get featured products
export const getFeaturedProducts = async () => {
    return fetchAPI('/products/featured', {
        method: 'GET'
    });
};

// Get product by slug (route publique)
export const getProductBySlug = async (slug) => {
    return fetchAPI(`/products/${encodeURIComponent(slug)}`, {
        method: 'GET'
    });
};

// Get product by ID (admin / compatibilité)
export const getProductById = async (productId) => {
    return fetchAPI(`/products/${productId}`, {
        method: 'GET'
    });
};

// Create product
export const createProduct = async (productData) => {
    // Nettoyé : Ton fetchAPI gère déjà le test (productData instanceof FormData) 
    // et fait le JSON.stringify() automatiquement s'il le faut.
    return fetchAPI('/products', {
        method: 'POST',
        body: productData
    });
};

// Update product
export const updateProduct = async (productId, productData) => {
    // Cas FormData + fichiers
    if (productData instanceof FormData) {
        productData.append('_method', 'PUT');

        return fetchAPI(`/products/${productId}`, {
            method: 'POST', // Requis par PHP pour intercepter le FormData en mise à jour
            body: productData
        });
    }

    // Cas JSON (Allégé car fetchAPI applique déjà le JSON.stringify sur le body)
    return fetchAPI(`/products/${productId}`, {
        method: 'PUT',
        body: productData
    });
};

// Delete product
export const deleteProduct = async (productId) => {
    return fetchAPI(`/products/${productId}`, {
        method: 'DELETE'
    });
};

// Add product images
export const addProductImages = async (productId, formData) => {
    return fetchAPI(`/products/${productId}/images`, {
        method: 'POST',
        body: formData
    });
};

// Delete product image
export const deleteProductImage = async (imageId) => {
    return fetchAPI(`/images/${imageId}`, {
        method: 'DELETE'
    });
};

// Search products
export const searchProducts = async (query) => {
    return fetchAPI(
        `/products?search=${encodeURIComponent(query)}`,
        {
            method: 'GET'
        }
    );
};

// Get products by category
export const getProductsByCategory = async (categoryId) => {
    return fetchAPI(`/products?category_id=${categoryId}`, {
        method: 'GET'
    });
};

// Une page brute (dashboard / admin)
export const getProductsPage = async (page = 1, perPage = DASHBOARD_PER_PAGE) => {
    return fetchAPI(`/products?page=${page}&per_page=${perPage}`, {
        method: 'GET'
    });
};

// Tous les produits pour le dashboard (parcours toutes les pages)
export const getAllProducts = async () => {
    return fetchAllPages((page) => getProductsPage(page, DASHBOARD_PER_PAGE));
};

// Supprimer plusieurs produits
export const deleteProducts = async (ids) => {
    return fetchAPI('/products/bulk-delete', {
        method: 'POST',
        body: { ids }, // Plus besoin de JSON.stringify() ici non plus
    });
};