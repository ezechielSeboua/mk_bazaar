import { API_URL, fetchAPI } from './apiConfig';


// Login
export const login = async (email, password) => {
    const res = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    if (res.success) {
        localStorage.setItem('token', res.data.token);

        // user optionnel (si backend le renvoie)
        if (res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
        }
    }

    return res;
};

// Register
export const register = async (userData) => {
    const res = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });

    if (res.success) {
        localStorage.setItem('token', res.data.token);

        if (res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
        }
    }

    return res;
};

// Logout
export const logout = async () => {
    const res = await fetchAPI('/auth/logout', {
        method: 'POST'
    });

    // nettoyage local dans tous les cas (UX safe)
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    return res;
};

// Profile (source de vérité backend)
export const profile = async () => {
    const res = await fetchAPI('/auth/me', {
        method: 'GET'
    });

    if (res.success && res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
    }

    return res;
};

// Mettre à jour son propre profil (nom, téléphone)
export const updateProfile = async (data) => {
    const res = await fetchAPI('/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    if (res.success && res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
    }
    return res;
};

// Upload photo de profil
export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetchAPI('/profile/avatar', {
        method: 'POST',
        body: formData,
    });
    if (res.success && res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
    }
    return res;
};

// Token helper
export const getToken = () => {
    return localStorage.getItem('token');
};

// Auth state
export const isAuthenticated = () => {
    return !!getToken();
};

// User local cache (safe parse)
export const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};