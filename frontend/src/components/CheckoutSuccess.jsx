import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { logger } from '../utils/logger';
import './CheckoutSuccess.css';

export default function CheckoutSuccess() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId || !user) {
      setLoading(false);
      return;
    }

    async function fetchStatus() {
      try {
        const data = await apiFetch(
          `/api/checkout/session-status?sessionId=${encodeURIComponent(sessionId)}`
        );
        setInfo(data);
      } catch (err) {
        logger.error('Failed to load checkout session status', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [searchParams, user]);

  if (!user) {
    return (
      <main className="checkout-result">
        <div className="result-card result-card--auth">
          <h2 className="result-card__title">Sign In Required</h2>
          <p className="result-card__subtitle">
            Please sign in to view your order confirmation.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="checkout-result">
        <div className="result-card">
          <div className="result-card__spinner-wrap">
            <span className="result-card__spinner" />
          </div>
          <p className="result-card__subtitle">Loading your order…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="checkout-result">
        <div className="result-card result-card--error">
          <h2 className="result-card__title">Something Went Wrong</h2>
          <p className="result-card__subtitle">{error}</p>
          <button className="btn btn--outline" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-result">
      <div className="result-card result-card--success">
        {/* Animated checkmark */}
        <div className="result-card__check-wrap">
          <svg className="result-card__check" viewBox="0 0 52 52">
            <circle className="result-card__check-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="result-card__check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <h1 className="result-card__title">Payment Successful!</h1>
        <p className="result-card__subtitle">
          Your tickets have been confirmed.
        </p>

        <div className="result-card__details">
          <div className="result-card__detail-row">
            <span className="result-card__detail-label">Event</span>
            <span className="result-card__detail-value">{info?.eventName}</span>
          </div>
          <div className="result-card__detail-row">
            <span className="result-card__detail-label">Tickets</span>
            <span className="result-card__detail-value">{info?.quantity}</span>
          </div>
          <div className="result-card__detail-row">
            <span className="result-card__detail-label">Confirmation sent to</span>
            <span className="result-card__detail-value">{info?.customerEmail}</span>
          </div>
          <div className="result-card__detail-row">
            <span className="result-card__detail-label">Status</span>
            <span className="result-card__detail-value result-card__detail-value--status">
              {info?.status === 'paid' ? 'Paid' : info?.status}
            </span>
          </div>
        </div>

        <button
          className="btn btn--accent btn--full btn--lg"
          onClick={() => navigate('/')}
          id="btn-back-home"
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
