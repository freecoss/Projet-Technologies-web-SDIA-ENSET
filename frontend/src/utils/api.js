import API_URL from '@/config';

/**
 * Wrapper personnalisé autour de fetch pour intercepter les erreurs 401
 * et déconnecter automatiquement l'utilisateur si le JWT a expiré.
 */
export const fetchApi = async (endpoint, options = {}) => {
    const token = localStorage.getItem('bch7al_token');
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Si on envoie un FormData (pour les fichiers), le navigateur doit définir le Content-Type lui-même
    if (options.body instanceof FormData) {
        delete defaultHeaders['Content-Type'];
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, config);
        
        // Interception JWT Expiré ou Invalide
        if (response.status === 401) {
            // Un événement global qu'on peut écouter dans AuthContext pour déconnecter
            const event = new CustomEvent('auth:unauthorized');
            window.dispatchEvent(event);
        }

        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};
