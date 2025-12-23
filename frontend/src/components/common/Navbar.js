import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">🗺️</span>
          <span className="brand-text">InteractiveMap</span>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          ☰
        </button>

        <div className={`navbar-menu ${showMobileMenu ? 'show' : ''}`}>
          <div className="navbar-links">
            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/maps"
              className={`nav-link ${isActive('/maps') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Maps
            </Link>
          </div>

          <div className="navbar-user">
            <div
              className="user-menu-trigger"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="user-avatar">
                {user?.profile?.profile_picture ? (
                  <img src={user.profile.profile_picture} alt="Profile" />
                ) : (
                  <span>{user?.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="user-name">{user?.username}</span>
              <span className="dropdown-arrow">▼</span>
            </div>

            {showDropdown && (
              <div className="user-dropdown">
                <Link
                  to="/profile"
                  className="dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowMobileMenu(false);
                  }}
                >
                  <span className="dropdown-icon">👤</span>
                  Profile
                </Link>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    handleLogout();
                    setShowDropdown(false);
                    setShowMobileMenu(false);
                  }}
                >
                  <span className="dropdown-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;