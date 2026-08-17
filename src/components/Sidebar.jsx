// Sidebar.jsx
import './Sidebar.css';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Sparkles, 
  FileText, 
  Calendar, 
  Link2, 
  Settings,
  Crown,
  Users,
  X
} from 'lucide-react';

function Sidebar({ isOpen, onClose }) {
  const { workspaceId } = useParams();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: workspaceId ? `/app/${workspaceId}/analytics` : '/app' },
    { name: 'My Workspaces', icon: Building2, path: '/app/workspaces' },
    { name: 'Generate Content', icon: Sparkles, path: workspaceId ? `/app/${workspaceId}/content` : '/app' },
    { name: 'Content History', icon: FileText, path: workspaceId ? `/app/${workspaceId}/content/history` : '/app' },
    { name: 'Brand Setup', icon: Crown, path: workspaceId ? `/app/${workspaceId}/brand` : '/app' },
    { name: 'Schedule Posts', icon: Calendar, path: workspaceId ? `/app/${workspaceId}/calendar` : '/app' },
    { name: 'Social Accounts', icon: Link2, path: workspaceId ? `/app/${workspaceId}/social` : '/app' },
    { name: 'Leads', icon: Users, path: workspaceId ? `/app/${workspaceId}/leads` : '/app' },
    { name: 'Settings', icon: Settings, path: workspaceId ? `/app/${workspaceId}/settings` : '/app' },
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
              <Link 
                key={item.name} 
                to={item.path} 
                className="sidebar-item"
                onClick={onClose}
              >
                <IconComponent className="sidebar-icon" size={20} />
                <span className="sidebar-text">{item.name}</span>
              </Link>
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
