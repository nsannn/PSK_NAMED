import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import UserMenu from './UserMenu';
import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [modalMode, setModalMode] = useState(null); // 'login' | 'register' | null
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role;
  const canManage = role === 'Manager' || role === 'SuperAdmin';
  const canValidate = role === 'Manager' || role === 'Validator' || role === 'SuperAdmin';
  const homePath = role === 'Validator' ? '/validator-dashboard' : '/';

  function openLogin() {
    setModalMode('login');
    setMobileOpen(false);
  }

  function openRegister() {
    setModalMode('register');
    setMobileOpen(false);
  }

  const isActive = (path) => location.pathname === path ? 'navbar__link--active' : '';

  // Helpers for user menu inside mobile sidebar
  const isCustomer = role === 'Customer';
  const validationDestination = role === 'Validator' ? '/validator-dashboard' : '/ticket-validation';
  const validationLabel = role === 'Validator' ? 'Assigned Events' : 'Ticket Validation';

  return (
    <>
      <nav className="navbar" id="navbar">
        <div
          className="navbar__logo"
          id="site-logo"
          onClick={() => navigate(homePath)}
          style={{ cursor: 'pointer' }}
        >
          Named
        </div>

        <div className="navbar__links" id="nav-links">
          {canManage && (
            <button className={`navbar__link ${isActive('/dashboard')}`} onClick={() => navigate('/dashboard')}>Dashboard</button>
          )}
        </div>

        <div className="navbar__actions" id="nav-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <NotificationDropdown />
              <UserMenu />
            </div>
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
        
        {user ? (
          <div className="mobile-sidebar__user-section">
            <div className="mobile-sidebar__user-profile">
              <span className="mobile-sidebar__user-name">{user.firstName} {user.lastName}</span>
              <span className="mobile-sidebar__user-role">{user.role}</span>
            </div>
            
            <div className="mobile-sidebar__links">
              {canManage && (
                <button className="mobile-sidebar__link" onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}>Dashboard</button>
              )}
              
              {isCustomer && (
                <button className="mobile-sidebar__link" onClick={() => { navigate('/my-tickets'); setMobileOpen(false); }}>My Tickets</button>
              )}

              {canValidate && (
                <button className="mobile-sidebar__link" onClick={() => { navigate(validationDestination); setMobileOpen(false); }}>{validationLabel}</button>
              )}
              
              <NotificationDropdown isMobile={true} />
              
              <button className="mobile-sidebar__link mobile-sidebar__link--logout" onClick={() => { logout(); setMobileOpen(false); }}>Logout</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mobile-sidebar__links">
              {canManage && (
                <button className="mobile-sidebar__link" onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}>Dashboard</button>
              )}
            </div>
            <div className="mobile-sidebar__actions">
              <button className="btn btn--accent btn--full" onClick={openLogin}>Sign In</button>
              <button className="btn btn--outline btn--full" onClick={openRegister}>Register</button>
            </div>
          </>
        )}
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
