/**
 * Centralized logger utility for the React frontend.
 * Replaces console.log/error to standardize log formatting and (optionally)
 * forward critical errors to the backend.
 */

const IS_DEV = import.meta.env.DEV;

function formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

async function sendToBackend(level, message, error) {
    try {
        await fetch('/api/logs/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                level,
                message,
                stack: error?.stack || null,
                url: window.location.href,
                userAgent: navigator.userAgent
            })
        });
    } catch {
        // Ignore failure to send log
    }
}

export const logger = {
    info(message, ...args) {
        if (IS_DEV) {
            console.info(formatMessage('info', message), ...args);
        }
    },
    
    warn(message, ...args) {
        if (IS_DEV) {
            console.warn(formatMessage('warn', message), ...args);
        }
    },

    error(message, error = null, ...args) {
        if (IS_DEV) {
            console.error(formatMessage('error', message), error, ...args);
        }
        
        // Forward critical errors to the backend even in production
        sendToBackend('error', message, error);
    }
};
