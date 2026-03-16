const API_BASE_URL = '/api';

export const fetchFromApi = async (endpoint: string, options?: RequestInit) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...options?.headers,
            },
        });
        
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");
        
        if (!response.ok) {
            let errorMessage = `API Error (${response.status} on ${endpoint})`;
            try {
                const errorData = isJson ? await response.json() : { message: await response.text() };
                errorMessage = errorData.message || errorMessage;
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
            const text = await response.text();
            if (!text) return null;
            console.error(`Expected JSON from ${endpoint} but got:`, text.substring(0, 100));
            throw new Error(`Server returned non-JSON response for ${endpoint}`);
        }
        
        return await response.json();
        
    } catch (error: any) {
        console.error(`API call to ${endpoint} failed:`, error);
        throw error;
    }
};