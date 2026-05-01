import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import UserMenu from './UserMenu';
import './Navbar.css';

export default function Navbar() {
  const { user } = useAuth();
  const [modalMode, setModalMode] = useState(null); // 'login' | 'register' | null
  const [mobileOpen, setMobileOpen] = useState(false);

  function openLogin() {
    setModalMode('login');
    setMobileOpen(false);
  }

  function openRegister() {
    setModalMode('register');
    setMobileOpen(false);
  }

  return (
    <>
      <nav className="navbar" id="navbar">
        <div className="navbar__logo" id="site-logo">Named</div>

        <div className="navbar__links" id="nav-links">
          <button className="navbar__link">Events</button>
          <button className="navbar__link">Partners</button>
          <button className="navbar__link">Contacts</button>
        </div>

        <div className="navbar__actions" id="nav-actions">
          {user ? (
            <UserMenu />
          ) : (
            <>
              <button className="btn btn--accent" id="btn-signin" onClick={openLogin}>
                Sign In
              </button>
              <button className="btn btn--outline" id="btn-register" onClick={openRegister}>
                Register
              </button>
            </>
          )}
        </div>

        <button
          className="navbar__hamburger"
          id="btn-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span>{mobileOpen ? '✕' : '☰'}</span>
        </button>
      </nav>

      {/* Mobile sidebar */}
      <div className={`mobile-overlay ${mobileOpen ? 'mobile-overlay--visible' : ''}`}
           onClick={() => setMobileOpen(false)} />
      <aside className={`mobile-sidebar ${mobileOpen ? 'mobile-sidebar--open' : ''}`} id="mobile-sidebar">
        <div className="mobile-sidebar__links">
          <button className="mobile-sidebar__link">Events</button>
          <button className="mobile-sidebar__link">Partners</button>
          <button className="mobile-sidebar__link">Contacts</button>
        </div>
        <div className="mobile-sidebar__actions">
          {user ? (
            <UserMenu />
          ) : (
            <>
              <button className="btn btn--accent btn--full" onClick={openLogin}>Sign In</button>
              <button className="btn btn--outline btn--full" onClick={openRegister}>Register</button>
            </>
          )}
        </div>
      </aside>

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
