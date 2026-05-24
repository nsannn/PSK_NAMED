import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

export default function AuthModal({ mode, onSwitchMode, onClose }) {
  const { login, register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Customer');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!agreedToTerms) {
          setError('You must agree to the Terms and Conditions.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await register(firstName, lastName, email, password, confirmPassword, role);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setError('');
    onSwitchMode(mode === 'login' ? 'register' : 'login');
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal" id={`modal-${mode}`}>
        <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="modal__title">
          {mode === 'login' ? 'Sign In to Your Account' : 'Create New Account'}
        </h2>

        <div className="modal__divider" />

        {error && <div className="modal__error" id="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal__form">
          {mode === 'register' && (
            <div className="modal__row">
              <input
                type="text"
                id="register-first-name"
                className="modal__input modal__input--half"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                id="register-last-name"
                className="modal__input modal__input--half"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          )}

          <input
            type="email"
            id={`${mode}-email`}
            className="modal__input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            id={`${mode}-password`}
            className="modal__input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {mode === 'register' && (
            <input
              type="password"
              id="register-confirm-password"
              className="modal__input"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          {mode === 'register' && (
            <select
              id="register-role"
              className="modal__input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="Customer">Customer</option>
              <option value="Manager">Manager</option>
            </select>
          )}

          {mode === 'login' && (
            <button type="button" className="modal__text-btn modal__text-btn--right">
              Forgot Password?
            </button>
          )}

          {mode === 'register' && (
            <label className="modal__checkbox-label" htmlFor="terms-checkbox">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              I agree to the Terms and Conditions
            </label>
          )}

          <button
            type="submit"
            className="btn btn--accent btn--full btn--lg"
            id={`${mode}-submit`}
            disabled={loading}
          >
            {loading ? (mode === 'login' ? 'Signing In...' : 'Creating Account...') : (mode === 'login' ? 'Sign In' : 'Register')}
          </button>
        </form>

        <button type="button" className="modal__text-btn modal__text-btn--center" onClick={switchMode}>
          {mode === 'login'
            ? "Don't have an account? Register"
            : 'Already have an account? Sign In'}
        </button>
      </div>
    </>
  );
}
