import { fetchAPI } from './apiConfig';


// Get all users (Admin only)
export const getUsers = async () => {
    return fetchAPI('/users', {
        method: 'GET'
    });
};

// Get user by ID
export const getUserById = async (userId) => {
    return fetchAPI(`/users/${userId}`, {
        method: 'GET'
    });
};

// Create user (Admin only)
export const createUser = async (userData) => {
    return fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
};

// Update user
export const updateUser = async (userId, userData) => {
    return fetchAPI(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
    });
};

// Delete user (Admin only)
export const deleteUser = async (userId) => {
    return fetchAPI(`/users/${userId}`, {
        method: 'DELETE'
    });
};

// Change password
export const changePassword = async (oldPassword, newPassword) => {
    return fetchAPI('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
};

// Update user role (Admin only)
export const updateUserRole = async (userId, role) => {
    return fetchAPI(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
    });
};

// Deactivate user account
export const deactivateAccount = async (userId) => {
    return fetchAPI(`/users/${userId}/deactivate`, {
        method: 'POST'
    });
};

// Search users (Admin only)
export const searchUsers = async (query) => {
    return fetchAPI(`/users?search=${encodeURIComponent(query)}`, {
        method: 'GET'
    });
};
