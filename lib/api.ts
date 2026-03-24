const API_BASE_URL = '/api';

export const fetchFromApi = async (endpoint: string, options?: RequestInit) => {
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        const url = endpoint.startsWith('/') 
            ? `${API_BASE_URL}${endpoint}`
            : `${API_BASE_URL}/${endpoint}`;
            
        const cacheBuster = url.includes('?') ? `&_t=${Date.now()}` : `?_t=${Date.now()}`;
        
        const response = await fetch(url + cacheBuster, {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...(user ? { 'X-User-Role': user.role, 'X-User-Id': user.id.toString() } : {}),
                ...options?.headers,
            },
        });
        
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");
        
        const text = await response.text();
        console.log(`[API] ${endpoint} response:`, text.substring(0, 100));
        
        if (!response.ok) {
            let errorMessage = `API Error (${response.status} on ${endpoint})`;
            try {
                if (isJson) {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } else {
                    errorMessage = text ? `Server Error: ${text.substring(0, 100)}...` : errorMessage;
                }
            } catch (e) {
                // Ignore parse error for error response
            }
            throw new Error(errorMessage);
        }

        // Handle successful but empty responses
        if (response.status === 204) {
            return null;
        }

        if (!isJson) {
            if (!text) return null;
            console.error(`Expected JSON from ${endpoint} but got:`, text.substring(0, 100));
            throw new Error(`Server returned non-JSON response for ${endpoint}`);
        }
        
        return JSON.parse(text);
        
    } catch (error: any) {
        console.error(`API call to ${endpoint} failed:`, error);
        throw error;
    }
};