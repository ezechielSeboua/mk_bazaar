import { fetchAPI } from './apiConfig';

// S-02 : token stocké en sessionStorage (ne survit pas à la fermeture du navigateur)
// La migration vers des cookies HttpOnly est la correction définitive mais requiert le backend.

const TOKEN_KEY = 'token';

// Login
export const login = async (email, password) => {
    const res = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    if (res.success) {
        sessionStorage.setItem(TOKEN_KEY, res.data.token);
        // L'objet user n'est plus persisté localement — AuthContext gère l'état React
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
        sessionStorage.setItem(TOKEN_KEY, res.data.token);
    }

    return res;
};

// Logout
export const logout = async () => {
    const res = await fetchAPI('/auth/logout', {
        method: 'POST'
    });

    sessionStorage.removeItem(TOKEN_KEY);

    return res;
};

// Profile (source de vérité backend)
export const profile = async () => {
    const res = await fetchAPI('/auth/me', {
        method: 'GET'
    });

    return res;
};

// Mettre à jour son propre profil (nom, téléphone)
export const updateProfile = async (data) => {
    const res = await fetchAPI('/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
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
    return res;
};

// Token helper
export const getToken = () => {
    return sessionStorage.getItem(TOKEN_KEY);
};

// Auth state
export const isAuthenticated = () => {
    return !!getToken();
};

// Compatibilité — retourne null (user géré uniquement via AuthContext/React state)
export const getCurrentUser = () => null;
