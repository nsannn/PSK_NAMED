import React from 'react';
import { logger } from '../utils/logger';
import './ErrorBoundary.css';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to our centralized logger
        logger.error('React Component Error', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary__card">
                        <div className="error-boundary__icon">⚠️</div>
                        <h1 className="error-boundary__title">Oops! Something went wrong.</h1>
                        <p className="error-boundary__message">
                            We've encountered an unexpected error. Our team has been notified.
                        </p>
                        <button 
                            className="btn btn--primary"
                            onClick={() => window.location.reload()}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
