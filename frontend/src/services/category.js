import { fetchAPI } from './apiConfig';

/**
 * Récupérer toutes les catégories
 */
export const getCategories = async () => {
    return fetchAPI('/categories', {
        method: 'GET'
    });
};

/**
 * Créer une nouvelle catégorie (Supporte l'envoi d'une image)
 * @param {FormData} categoryFormData - Doit être une instance de FormData
 */
export const createCategory = async (categoryFormData) => {
    console.log("Creating category with FormData containing image...");
    return fetchAPI('/categories', {
        method: 'POST',
        // IMPORTANT : Pas de 'Content-Type' ici, le navigateur le gère automatiquement pour FormData
        body: categoryFormData 
    });
};

/**
 * Mettre à jour une catégorie (Supporte l'envoi d'une nouvelle image)
 * * 💡 ASTUCE LARAVEL CRUCIALE : 
 * Les requêtes 'PUT' natives de PHP ont du mal à lire le 'multipart/form-data'. 
 * Pour modifier une image, on utilise une astuce reconnue : on fait un 'POST' 
 * et on ajoute un champ caché '_method' égal à 'PUT'.
 */
export const updateCategory = async (categorySlugOrId, categoryFormData) => {
    // Si ce n'est pas déjà fait dans ton composant, on s'assure d'injecter la méthode PUT
    if (categoryFormData instanceof FormData && !categoryFormData.has('_method')) {
        categoryFormData.append('_method', 'PUT');
    }

    return fetchAPI(`/categories/${categorySlugOrId}`, {
        method: 'POST', // On triche avec POST pour que Laravel intercepte correctement le fichier
        body: categoryFormData
    });
};

/**
 * Supprimer une catégorie
 */
export const deleteCategory = async (categorySlugOrId) => {
    return fetchAPI(`/categories/${categorySlugOrId}`, {
        method: 'DELETE'
    });
};

/**
 * Récupérer une catégorie par son slug ou son ID
 */
export const getCategoryBySlug = async (categorySlugOrId) => {
    return fetchAPI(`/categories/${categorySlugOrId}`, {
        method: 'GET'
    });
};