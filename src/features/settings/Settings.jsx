// Settings.jsx
// User account settings and preferences

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  CreditCard, 
  Shield, 
  LogOut as LogOutIcon,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import './Settings.css';

function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    postReminders: true,
    weeklyReports: false,
    accountActivity: true
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Simulate update
    setTimeout(() => {
      setSuccess('Profile updated successfully!');
      setLoading(false);
    }, 1000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (profileData.newPassword !== profileData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (profileData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Simulate password change
    setTimeout(() => {
      setSuccess('Password changed successfully!');
      setProfileData({
        ...profileData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setLoading(false);
    }, 1000);
  };

  const handleNotificationToggle = (key) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key]
    });
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logOut();
      navigate('/login');
    }
  };

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">
          
          <div className="page-header">
            <div>
              <h1>Settings</h1>
              <p>Manage your account and preferences</p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          <div className="settings-container">
            
            {/* Settings Tabs */}
            <div className="settings-tabs">
              <button
                className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={20} />
                Profile
              </button>
              <button
                className={`tab-item ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Shield size={20} />
                Security
              </button>
              <button
                className={`tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={20} />
                Notifications
              </button>
              <button
                className={`tab-item ${activeTab === 'billing' ? 'active' : ''}`}
                onClick={() => setActiveTab('billing')}
              >
                <CreditCard size={20} />
                Billing
              </button>
            </div>

            {/* Settings Content */}
            <div className="settings-content">
              
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="settings-section">
                  <h3>Profile Information</h3>
                  <form onSubmit={handleProfileUpdate}>
                    <div className="form-group">
                      <label>
                        <User size={16} />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <Mail size={16} />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="disabled-input"
                      />
                      <small>Email cannot be changed</small>
                    </div>

                    <button type="submit" className="btn-save" disabled={loading}>
                      <Save size={18} />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="settings-section">
                  <h3>Change Password</h3>
                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label>
                        <Lock size={16} />
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={profileData.currentPassword}
                        onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <Lock size={16} />
                        New Password
                      </label>
                      <input
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <Lock size={16} />
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>

                    <button type="submit" className="btn-save" disabled={loading}>
                      <Save size={18} />
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>

                  <div className="danger-zone">
                    <h4>Danger Zone</h4>
                    <p>Once you logout, you'll need to sign in again.</p>
                    <button className="btn-logout" onClick={handleLogout}>
                      <LogOutIcon size={18} />
                      Logout
                    </button>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="settings-section">
                  <h3>Notification Preferences</h3>
                  
                  <div className="notification-item">
                    <div className="notification-info">
                      <Bell size={20} />
                      <div>
                        <h4>Email Notifications</h4>
                        <p>Receive email updates about your account</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={() => handleNotificationToggle('emailNotifications')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <Bell size={20} />
                      <div>
                        <h4>Post Reminders</h4>
                        <p>Get reminded before scheduled posts go live</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.postReminders}
                        onChange={() => handleNotificationToggle('postReminders')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <Bell size={20} />
                      <div>
                        <h4>Weekly Reports</h4>
                        <p>Receive weekly performance summaries</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyReports}
                        onChange={() => handleNotificationToggle('weeklyReports')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <Bell size={20} />
                      <div>
                        <h4>Account Activity</h4>
                        <p>Alerts for important account changes</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.accountActivity}
                        onChange={() => handleNotificationToggle('accountActivity')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              )}

              {/* BILLING TAB */}
              {activeTab === 'billing' && (
                <div className="settings-section">
                  <h3>Billing & Subscription</h3>
                  
                  <div className="subscription-card">
                    <div className="subscription-header">
                      <CreditCard size={24} />
                      <div>
                        <h4>Free Plan</h4>
                        <p>10 posts per month • 2 platforms</p>
                      </div>
                    </div>
                    <button className="btn-upgrade">
                      Upgrade to Pro
                    </button>
                  </div>

                  <div className="usage-stats">
                    <h4>Usage This Month</h4>
                    <div className="stat-item">
                      <span>Posts Generated</span>
                      <strong>10 / 10</strong>
                    </div>
                    <div className="stat-item">
                      <span>Platforms Connected</span>
                      <strong>2 / 2</strong>
                    </div>
                    <div className="stat-item">
                      <span>AI Credits Used</span>
                      <strong>20 / 20</strong>
                    </div>
                  </div>

                  <div className="pricing-info">
                    <h4>Pro Plan Benefits</h4>
                    <ul>
                      <li>✅ 100 posts per month</li>
                      <li>✅ Unlimited platforms</li>
                      <li>✅ 500 AI credits</li>
                      <li>✅ Advanced analytics</li>
                      <li>✅ Priority support</li>
                    </ul>
                    <p className="price">$29/month</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;