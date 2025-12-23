// Header.jsx
import './Header.css';
import { Search, Bell, ChevronDown, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Header({ onMenuClick }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return currentUser?.email?.[0].toUpperCase() || 'U';
  };

  return (
    <header className="header">
      {/* Mobile Menu Button */}
      <button className="menu-toggle" onClick={onMenuClick}>
        <Menu size={24} />
      </button>

      {/* Search Bar */}
      <div className="header-search">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Search businesses, content, or posts..." 
          className="search-input"
        />
      </div>

      {/* Right Side */}
      <div className="header-actions">
        {/* Notification Bell */}
        <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        {/* User Profile Dropdown */}
        <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="user-avatar">
            <span>{getInitials()}</span>
          </div>
          <div className="user-info">
            <p className="user-name">
              {currentUser?.displayName || 'User'}
            </p>
            <p className="user-email">
              {currentUser?.email || 'user@example.com'}
            </p>
          </div>
          <ChevronDown size={16} className="dropdown-icon" />

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="dropdown-menu">
              <button onClick={handleLogout} className="dropdown-item">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;