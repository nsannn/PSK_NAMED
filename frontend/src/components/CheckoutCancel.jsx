import { useNavigate } from 'react-router-dom';
import './CheckoutCancel.css';

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <main className="checkout-result">
      <div className="result-card cancel-card">
        <div className="cancel-card__icon-wrap">
          <svg className="cancel-card__icon" viewBox="0 0 52 52">
            <circle className="cancel-card__circle" cx="26" cy="26" r="25" fill="none" />
            <path className="cancel-card__x1" fill="none" d="M17 17l18 18" />
            <path className="cancel-card__x2" fill="none" d="M35 17l-18 18" />
          </svg>
        </div>

        <h1 className="result-card__title">Payment Cancelled</h1>
        <p className="result-card__subtitle">
          No worries — you haven't been charged. You can try again whenever you're ready.
        </p>

        <div className="cancel-card__actions">
          <button
            className="btn btn--accent btn--full btn--lg"
            onClick={() => navigate('/checkout')}
            id="btn-retry-checkout"
          >
            Try Again
          </button>
          <button
            className="btn btn--outline btn--full"
            onClick={() => navigate('/')}
            id="btn-cancel-home"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
