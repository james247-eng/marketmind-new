// Sidebar.jsx
import './Sidebar.css';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Sparkles, 
  FileText, 
  Calendar, 
  Link2, 
  Settings,
  Crown,
  X
} from 'lucide-react';

function Sidebar({ isOpen, onClose }) {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'My Businesses', icon: Building2, path: '/businesses' },
    { name: 'Generate Content', icon: Sparkles, path: '/generate' },
    { name: 'Content History', icon: FileText, path: '/history' },
    { name: 'Schedule Posts', icon: Calendar, path: '/schedule' },
    { name: 'Social Accounts', icon: Link2, path: '/accounts' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Close button for mobile */}
        <button className="sidebar-close" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Logo Section */}
        <div className="sidebar-logo">
          <h1>Market Mind</h1>
          <span className="logo-tagline">AI Marketing Assistant</span>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            
            return (
              <a 
                key={item.name} 
                href={item.path} 
                className="sidebar-item"
                onClick={onClose}
              >
                <IconComponent className="sidebar-icon" size={20} />
                <span className="sidebar-text">{item.name}</span>
              </a>
            );
          })}
        </nav>

        {/* Upgrade Section */}
        <div className="sidebar-upgrade">
          <Crown size={24} className="upgrade-icon" />
          <p className="upgrade-text">Free Plan</p>
          <p className="upgrade-subtext">10/10 posts used</p>
          <button className="upgrade-btn">Upgrade to Pro</button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;