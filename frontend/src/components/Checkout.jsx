import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import './Checkout.css';

// Load Stripe Publishable Key from environment variables
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
const stripePromise = loadStripe(stripeKey);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    // Call the backend to create a real Payment Intent and get the client_secret
    try {
      const response = await fetch('http://localhost:5033/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 4500 }), // Amount in cents ($45.00)
      });
      if(!response.ok){
         setError('Failed response from backend API endpoint.');
         setLoading(false);
         return;
      }

      const { clientSecret, error: backendError } = await response.json();

      if (backendError) {
        setError(backendError);
        setLoading(false);
        return;
      }

      const cardNumberElement = elements.getElement(CardNumberElement);

      // Tell stripe to process the payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Real PaymentIntent succeeded: ', paymentIntent);
        setSuccess(true);
        setLoading(false);
        cardNumberElement.clear();
        elements.getElement(CardExpiryElement).clear();
        elements.getElement(CardCvcElement).clear();
      }
    } catch (e) {
      setError('An error occurred. Check browser console.');
      console.error(e);
      setLoading(false);
    }
  };

  const stripeElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#e0dcdc',
        '::placeholder': {
          color: '#787474',
        },
        iconColor: '#cd6300'
      },
      invalid: {
        color: '#ff6b6b',
        iconColor: '#ff6b6b',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="card-input-group">
        <div>
          <label className="card-input-label">Card Number</label>
          <div className="stripe-element-container">
            <CardNumberElement options={{ ...stripeElementOptions, showIcon: true }} />
          </div>
        </div>
        
        <div className="card-input-row">
          <div>
            <label className="card-input-label">Expiration Date</label>
            <div className="stripe-element-container">
              <CardExpiryElement options={stripeElementOptions} />
            </div>
          </div>
          <div>
            <label className="card-input-label">CVC</label>
            <div className="stripe-element-container">
              <CardCvcElement options={stripeElementOptions} />
            </div>
          </div>
        </div>
      </div>
      
      {error && <div className="checkout-error">{error}</div>}
      {success && <div className="checkout-success">Payment Successful! (Simulation)</div>}
      
      <button 
        type="submit" 
        className="btn btn--accent btn--full btn--lg" 
        disabled={!stripe || loading}
      >
        {loading ? 'Processing...' : 'Pay $45.00'}
      </button>
    </form>
  );
}

export default function Checkout() {
  return (
    <div className="checkout-container">
      <h2 className="checkout-header">Complete your purchase</h2>
      <div className="checkout-divider"></div>
      
      <div className="checkout-summary">
        <div className="summary-item">
          <span>Event Ticket (Standard)</span>
          <span>$45.00</span>
        </div>
        <div className="summary-item">
          <span>Processing Fee</span>
          <span>$0.00</span>
        </div>
        <div className="summary-total">
          <span>Total</span>
          <span>$45.00</span>
        </div>
      </div>

      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
      
      <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-1)'}}>
        <strong>Note:</strong> This is a simulation using a test key. In a real integration, the backend handles the payment intent via Stripe.net.
      </div>
    </div>
  );
}
