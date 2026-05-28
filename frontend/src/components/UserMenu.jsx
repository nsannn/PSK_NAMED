import { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import './UserMenu.css';

export default function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const role = user.role;
  const canManage = role === 'Manager' || role === 'SuperAdmin';
  const canValidate = role === 'Manager' || role === 'Validator' || role === 'SuperAdmin';
  const isCustomer = role === 'Customer';

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu__trigger"
        id="user-menu-trigger"
        onClick={() => setOpen(!open)}
        aria-label="User menu"
      >
        <span className="user-menu__avatar" data-testid="user-avatar-small">{initials}</span>
        <span className="user-menu__name">{user.firstName}</span>
        <span className={`user-menu__chevron ${open ? 'user-menu__chevron--open' : ''}`}>▾</span>
      </button>

      <div className={`user-menu__dropdown ${open ? 'user-menu__dropdown--open' : ''}`} id="user-dropdown">
        <div className="user-menu__header">
          <span className="user-menu__avatar user-menu__avatar--lg">{initials}</span>
          <div className="user-menu__info">
            <span className="user-menu__fullname">{user.firstName} {user.lastName}</span>
            <span className="user-menu__email">{user.email}</span>
            <span className="user-menu__role">{user.role}</span>
          </div>
        </div>
        <div className="user-menu__divider" />

        {/* Customer: My Tickets */}
        {isCustomer && (
          <button className="user-menu__item" onClick={() => { navigate('/my-tickets'); setOpen(false); }}>My Tickets</button>
        )}

        {/* Manager/Validator/SuperAdmin: Ticket Validation */}
        {canValidate && (
          <button className="user-menu__item" onClick={() => { navigate('/ticket-validation'); setOpen(false); }}>Ticket Validation</button>
        )}

        {/* Manager/SuperAdmin: Dashboard */}
        {canManage && (
          <button className="user-menu__item" onClick={() => { navigate('/dashboard'); setOpen(false); }}>Dashboard</button>
        )}

        <button className="user-menu__item" id="btn-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}
