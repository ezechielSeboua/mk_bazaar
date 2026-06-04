import { fetchAPI } from './apiConfig';

// Get all categories
export const getCategories = async () => {
    return fetchAPI('/categories', {
        method: 'GET'
    });
};

// Create category
export const createCategory = async (categoryData) => {
    console.log("Creating category with data:", categoryData);
    return fetchAPI('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
    });
};

// Update category
export const updateCategory = async (categoryId, categoryData) => {
    return fetchAPI(`/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
    });
};

// Delete category
export const deleteCategory = async (categoryId) => {
    return fetchAPI(`/categories/${categoryId}`, {
        method: 'DELETE'
    });
};

// Get category by ID
export const getCategoryById = async (categoryId) => {
    return fetchAPI(`/categories/${categoryId}`, {
        method: 'GET'
    });
};
