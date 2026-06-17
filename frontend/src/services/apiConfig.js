import { API_URL } from '../config/env';

export { API_URL };

// Safe JSON parser
const safeJson = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

// Headers dynamiques
export const getAuthHeaders = (isJson = true) => {
    const token = localStorage.getItem('token');
    

    const headers = {
        'Accept': 'application/json',
        'Access-Control-Allow-Credentials': 'true',
        'ngrok-skip-browser-warning': 'true',
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

        const token = localStorage.getItem('token');
        const isFormData = options.body instanceof FormData;

        // DEBUG
        console.log('🔐 Token found:', !!token, token);
        // console.log('📤 Request to:', url);
        // console.log('🔑 Auth header:', token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN');
        
        if (options.body && !isFormData && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...getAuthHeaders(!isFormData),
                ...(options.headers || {})
            }
        });


        // console.log('📥 Raw response:', response);

        const data = await safeJson(response);

        // DEBUG Response
        // console.log('📥 Response status:', response.status);
        // console.log('📥 Response data:', data);

        // gestion JWT expired
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
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
        console.error('❌ API Error:', error);
        return {
            success: false,
            status: 0,
            data: null,
            error: error.message || 'Network error'
        };
    }
};