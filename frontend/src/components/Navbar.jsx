import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthModal from './AuthModal';
import '../main.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [modalMode, setModalMode] = useState(null); // 'login' | 'register' | null
  const navigate = useNavigate();
  const location = useLocation();

  function openLogin() {
    setModalMode('login');
  }

  function openRegister() {
    setModalMode('register');
  }

  return (
    <>
      <div id="transparent_panel" style={{ display: modalMode ? 'block' : 'none', opacity: modalMode ? 0.5 : 0 }} onClick={() => setModalMode(null)}></div>
      <div id="top_bar">
        <div id="site_logo">Named</div>

        <div id="nav_group">
          <button
              className={location.pathname === '/' ? 'option_selected' : ''}
              onClick={() => navigate('/')}
          >
              My Events
          </button>
          <button
              className={location.pathname === '/dashboard' ? 'option_selected' : ''}
              onClick={() => navigate('/dashboard')}
          >
              Dashboard
          </button>
          <button>Partners</button>
          <button>Contacts</button>
        </div>

        <div id="notification_container">
            <button id="notification_button">🔔</button>
        </div>

        <div id="account_group">
          {user ? (
            <>
              <button id="user_account_button" onClick={() => navigate('/checkout')}>Buy Tickets</button>
              <button id="user_account_button" onClick={logout}>[{user.firstName || 'Username'}]</button>
            </>
          ) : (
            <>
                <button id="user_account_button" onClick={openLogin}>Sign In</button>
                <button id="user_account_button" onClick={openRegister}>Register</button>
            </>
          )}
        </div>

        <button id="menu_button">
          <span>☰</span>
        </button>
      </div>

      {/* Auth modal */}
      {modalMode && (
        <AuthModal
          mode={modalMode}
          onSwitchMode={(m) => setModalMode(m)}
          onClose={() => setModalMode(null)}
        />
      )}
    </>
  );
}
