import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

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
      <div className="navbar-brand">
        <Link to="/dashboard">
          <span className="brand-icon">🗺️</span>
          <span className="brand-text">Interactive Maps</span>
        </Link>
      </div>

      <div className="navbar-menu">
        <Link
          to="/dashboard"
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        <Link
          to="/maps"
          className={`nav-link ${isActive('/maps') ? 'active' : ''}`}
        >
          Maps
        </Link>
        <Link
          to="/categories"
          className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
        >
          Categories
        </Link>
      </div>

      <div className="navbar-user">
        <div
          className="user-dropdown-trigger"
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
          <>
            <div
              className="dropdown-backdrop"
              onClick={() => setShowDropdown(false)}
            />
            <div className="user-dropdown">
              <Link
                to="/profile"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
              >
                <span>👤</span> Profile
              </Link>
              <hr className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleLogout}>
                <span>🚪</span> Logout
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
