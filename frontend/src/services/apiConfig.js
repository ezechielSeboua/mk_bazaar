import { API_URL, getApiOrigin } from '../config/env';

export { API_URL };

// Safe JSON parser
const safeJson = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

// Vérifie que l'URL appartient bien à notre domaine API (S-01)
const isTrustedUrl = (url) => {
    try {
        const apiOrigin = getApiOrigin();
        return url.startsWith(apiOrigin) || url.startsWith(API_URL) || !url.startsWith('http');
    } catch {
        return false;
    }
};

// Headers dynamiques — token injecté uniquement vers les URLs de confiance
export const getAuthHeaders = (isJson = true) => {
    const token = sessionStorage.getItem('token'); // S-02 : sessionStorage

    const headers = {
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    if (isJson) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
};

// Core fetch API
export const fetchAPI = async (endpoint, options = {}) => {
    try {
        const url = endpoint.startsWith('https')
            ? endpoint
            : `${API_URL}${endpoint}`;

        const isFormData = options.body instanceof FormData;
        // S-01 : ne pas envoyer le token vers des URLs externes
        const trusted = isTrustedUrl(url);

        // console.log('📤 Request to:', url);
        
        if (options.body && !isFormData && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...(trusted ? getAuthHeaders(!isFormData) : { 'Accept': 'application/json' }),
                ...(options.headers || {})
            }
        });

        const data = await safeJson(response);

        // gestion JWT expired — S-02 : sessionStorage
        if (response.status === 401) {
            sessionStorage.removeItem('token');
            window.dispatchEvent(new Event('auth:unauthorized'));
        }

        return {
            success: response.ok,
            status: response.status,
            data,
            error: response.ok
                ? null
                : (data?.message || 'Unexpected API error')
        };

    } catch (error) {
        if (import.meta.env.DEV) console.error('❌ API Error:', error); // S-14
        return {
            success: false,
            status: 0,
            data: null,
            error: error.message || 'Network error'
        };
    }
};