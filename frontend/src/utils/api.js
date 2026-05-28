import { logger } from './logger';

export class ApiError extends Error {
    constructor(message, status, traceId, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.traceId = traceId;
        this.data = data;
    }
}

/**
 * Standardized wrapper around fetch() that handles credentials, 
 * JSON parsing, and unified error throwing.
 */
export async function apiFetch(url, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };

    const fetchOptions = {
        ...options,
        credentials: options.credentials || 'same-origin',
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    // Remove Content-Type if we are sending FormData (browser sets it automatically with boundary)
    if (fetchOptions.body instanceof FormData) {
        delete fetchOptions.headers['Content-Type'];
    }

    try {
        const response = await fetch(url, fetchOptions);
        
        let data = {};
        const text = await response.text();
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                logger.warn(`Failed to parse JSON response from ${url}`, { text });
            }
        }

        if (!response.ok) {
            const message = data.message || `Request failed with status ${response.status}`;
            const traceId = data.traceId || null;
            
            logger.warn(`API Error: ${response.status} ${url}`, { message, traceId });
            throw new ApiError(message, response.status, traceId, data);
        }

        return data;
    } catch (error) {
        // Only log network errors or unhandled exceptions, ApiErrors are already logged
        if (!(error instanceof ApiError)) {
            logger.error(`Network or fetch error for ${url}`, error);
        }
        throw error;
    }
}
