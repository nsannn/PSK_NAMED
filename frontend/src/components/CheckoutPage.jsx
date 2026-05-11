import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Use event passed from navigation state
  const passedEvent = location.state?.event;
  
  // If no event is passed, redirect back to home soon
  useEffect(() => {
    if (!passedEvent) {
      navigate('/');
    }
  }, [passedEvent, navigate]);

  if (!passedEvent) {
    return null; // Will redirect via useEffect
  }

  const targetEvent = {
    id: passedEvent.id,
    name: passedEvent.title,
    description: passedEvent.description,
    date: new Date(passedEvent.date).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    location: passedEvent.location,
    price: passedEvent.tickets?.length > 0 ? passedEvent.tickets[0].price : 0,
    currency: '€',
  };

  const totalPrice = (targetEvent.price * quantity).toFixed(2);

  async function handleCheckout() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          eventId: targetEvent.id,
          quantity,
        }),
      });

      // Safely parse JSON - backend may return empty body on 401
      let data;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.message || `Request failed (${res.status})`);
      }

      // Redirect to Stripe Checkout
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  // ── Not logged in ──
  if (!user) {
    return (
      <main className="checkout-page">
        <div className="checkout-card checkout-card--auth">
          <h2 className="checkout-card__title">Sign In Required</h2>
          <p className="checkout-card__subtitle">
            Please sign in or create an account to purchase tickets.
          </p>
        </div>
      </main>
    );
  }

  // ── Logged in — show event + purchase form ──
  return (
    <main className="checkout-page">
      <div className="checkout-card">
        {/* Event header */}
        <h1 className="checkout-card__title">{targetEvent.name}</h1>

        <div className="checkout-card__meta">
          <span className="checkout-card__meta-item">
            <span className="checkout-card__meta-icon">📅</span>
            {targetEvent.date}
          </span>
          <span className="checkout-card__meta-item">
            <span className="checkout-card__meta-icon">📍</span>
            {targetEvent.location}
          </span>
        </div>

        <p className="checkout-card__desc">{targetEvent.description}</p>

        <div className="checkout-card__divider" />

        {/* Quantity + Price */}
        <div className="checkout-card__row">
          <label className="checkout-card__label" htmlFor="ticket-qty">
            Tickets
          </label>
          <div className="checkout-card__qty-control">
            <button
              className="checkout-card__qty-btn"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="checkout-card__qty-value" id="ticket-qty">
              {quantity}
            </span>
            <button
              className="checkout-card__qty-btn"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              disabled={quantity >= 10}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="checkout-card__row">
          <span className="checkout-card__label">Price per ticket</span>
          <span className="checkout-card__value">
            {targetEvent.currency}{targetEvent.price.toFixed(2)}
          </span>
        </div>

        <div className="checkout-card__row checkout-card__row--total">
          <span className="checkout-card__label checkout-card__label--total">
            Total
          </span>
          <span className="checkout-card__value checkout-card__value--total">
            {targetEvent.currency}{totalPrice}
          </span>
        </div>

        {error && <div className="checkout-card__error">{error}</div>}

        <button
          className="btn btn--accent btn--full btn--lg checkout-card__submit"
          onClick={handleCheckout}
          disabled={loading}
          id="btn-checkout"
        >
          {loading ? (
            <span className="checkout-card__spinner" />
          ) : (
            <>Proceed to Checkout — {targetEvent.currency}{totalPrice}</>
          )}
        </button>

      </div>
    </main>
  );
}
