// Settings.jsx
// User account settings and preferences

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { logOut } from '../../services/authService.js';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth } from '../../services/firebase.js';
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
  CheckCircle,
  Loader,
} from 'lucide-react';
import './Settings.css';

// Matches TIERS in functions/index.js
const TIER_LIMITS = {
  free:       { posts: 5,         research: 0,          platforms: 1 },
  pro:        { posts: 100,       research: 50,         platforms: 5 },
  enterprise: { posts: 'Unlimited', research: 'Unlimited', platforms: 'Unlimited' },
};

function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser }               = useAuth();
  const navigate                      = useNavigate();
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [activeTab, setActiveTab]     = useState('profile');

  // ─── Profile form ───────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    displayName:     currentUser?.displayName || '',
    email:           currentUser?.email       || '',
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  // ─── Notification prefs ─────────────────────────────────────────────────────
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    postReminders:      true,
    weeklyReports:      false,
    accountActivity:    true,
  });

  // ─── Billing / usage (from Firestore) ───────────────────────────────────────
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [usage, setUsage] = useState({
    postsThisMonth:    0,
    researchThisMonth: 0,
  });
  const [usageLoading, setUsageLoading] = useState(true);

  // ─── Fetch real usage from Firestore ────────────────────────────────────────

  useEffect(() => {
    if (!currentUser) return;

    const fetchUsage = async () => {
      setUsageLoading(true);
      try {
        // Get subscription tier from users collection
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists()) {
          setSubscriptionTier(userSnap.data().subscriptionTier || 'free');
        }

        // Get usage counters
        const usageSnap = await getDoc(doc(db, 'usage', currentUser.uid));
        if (usageSnap.exists()) {
          const data = usageSnap.data();
          setUsage({
            postsThisMonth:    data.postsThisMonth    || 0,
            researchThisMonth: data.researchThisMonth || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching usage:', err);
      } finally {
        setUsageLoading(false);
      }
    };

    fetchUsage();
  }, [currentUser]);

  // Auto-clear alerts
  useEffect(() => {
    if (!error && !success) return;
    const t = setTimeout(() => { setError(''); setSuccess(''); }, 5000);
    return () => clearTimeout(t);
  }, [error, success]);

  // ─── Profile update ──────────────────────────────────────────────────────────

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
      });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Password change ─────────────────────────────────────────────────────────

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (profileData.newPassword !== profileData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (profileData.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        profileData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, profileData.newPassword);

      setSuccess('Password changed successfully!');
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword:     '',
        confirmPassword: '',
      }));
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect.');
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Notifications ───────────────────────────────────────────────────────────

  const handleNotificationToggle = (key) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Logout ──────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logOut();
      navigate('/login');
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const tierLimits  = TIER_LIMITS[subscriptionTier] || TIER_LIMITS.free;
  const tierDisplay = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1);

  const formatLimit = (used, limit) =>
    limit === 'Unlimited' ? `${used} / Unlimited` : `${used} / ${limit}`;

  const usagePercent = (used, limit) =>
    limit === 'Unlimited' ? 0 : Math.min(100, Math.round((used / limit) * 100));

  // ─── Render ──────────────────────────────────────────────────────────────────

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
            <div className="alert alert-error" role="alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="status">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          <div className="settings-container">

            {/* Tabs */}
            <div className="settings-tabs">
              {[
                { id: 'profile',       label: 'Profile',       Icon: User       },
                { id: 'security',      label: 'Security',      Icon: Shield     },
                { id: 'notifications', label: 'Notifications', Icon: Bell       },
                { id: 'billing',       label: 'Billing',       Icon: CreditCard },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={`tab-item ${activeTab === id ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>

            <div className="settings-content">

              {/* ── PROFILE ── */}
              {activeTab === 'profile' && (
                <div className="settings-section">
                  <h3>Profile Information</h3>
                  <form onSubmit={handleProfileUpdate}>
                    <div className="form-group">
                      <label><User size={16} /> Full Name</label>
                      <input
                        type="text"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="form-group">
                      <label><Mail size={16} /> Email Address</label>
                      <input type="email" value={profileData.email} disabled className="disabled-input" />
                      <small>Email cannot be changed</small>
                    </div>
                    <button type="submit" className="btn-save" disabled={loading}>
                      {loading ? <Loader size={16} className="spin" /> : <Save size={18} />}
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* ── SECURITY ── */}
              {activeTab === 'security' && (
                <div className="settings-section">
                  <h3>Change Password</h3>
                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label><Lock size={16} /> Current Password</label>
                      <input
                        type="password"
                        value={profileData.currentPassword}
                        onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label><Lock size={16} /> New Password</label>
                      <input
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label><Lock size={16} /> Confirm New Password</label>
                      <input
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    <button type="submit" className="btn-save" disabled={loading}>
                      {loading ? <Loader size={16} className="spin" /> : <Save size={18} />}
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

              {/* ── NOTIFICATIONS ── */}
              {activeTab === 'notifications' && (
                <div className="settings-section">
                  <h3>Notification Preferences</h3>
                  {[
                    { key: 'emailNotifications', title: 'Email Notifications',  desc: 'Receive email updates about your account' },
                    { key: 'postReminders',       title: 'Post Reminders',       desc: 'Get reminded before scheduled posts go live' },
                    { key: 'weeklyReports',       title: 'Weekly Reports',       desc: 'Receive weekly performance summaries' },
                    { key: 'accountActivity',     title: 'Account Activity',     desc: 'Alerts for important account changes' },
                  ].map(({ key, title, desc }) => (
                    <div key={key} className="notification-item">
                      <div className="notification-info">
                        <Bell size={20} />
                        <div>
                          <h4>{title}</h4>
                          <p>{desc}</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notificationSettings[key]}
                          onChange={() => handleNotificationToggle(key)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* ── BILLING ── */}
              {activeTab === 'billing' && (
                <div className="settings-section">
                  <h3>Billing & Subscription</h3>

                  <div className="subscription-card">
                    <div className="subscription-header">
                      <CreditCard size={24} />
                      <div>
                        <h4>{tierDisplay} Plan</h4>
                        <p>
                          {tierLimits.posts === 'Unlimited'
                            ? 'Unlimited posts · Unlimited platforms'
                            : `${tierLimits.posts} posts/month · ${tierLimits.platforms} platform${tierLimits.platforms > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                    {subscriptionTier === 'free' && (
                      <button
                        className="btn-upgrade"
                        onClick={() => navigate('/pricing')}
                      >
                        Upgrade to Pro
                      </button>
                    )}
                  </div>

                  {/* Real usage stats */}
                  <div className="usage-stats">
                    <h4>Usage This Month</h4>

                    {usageLoading ? (
                      <div className="loading-state">
                        <Loader size={16} className="spin" /> Loading usage...
                      </div>
                    ) : (
                      <>
                        <div className="stat-item">
                          <div className="stat-label">
                            <span>Posts Generated</span>
                            <strong>{formatLimit(usage.postsThisMonth, tierLimits.posts)}</strong>
                          </div>
                          {tierLimits.posts !== 'Unlimited' && (
                            <div className="usage-bar">
                              <div
                                className="usage-fill"
                                style={{
                                  width: `${usagePercent(usage.postsThisMonth, tierLimits.posts)}%`,
                                  backgroundColor: usagePercent(usage.postsThisMonth, tierLimits.posts) >= 90 ? '#ef4444' : '#7c3aed',
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {subscriptionTier !== 'free' && (
                          <div className="stat-item">
                            <div className="stat-label">
                              <span>Research Queries</span>
                              <strong>{formatLimit(usage.researchThisMonth, tierLimits.research)}</strong>
                            </div>
                            {tierLimits.research !== 'Unlimited' && (
                              <div className="usage-bar">
                                <div
                                  className="usage-fill"
                                  style={{
                                    width: `${usagePercent(usage.researchThisMonth, tierLimits.research)}%`,
                                    backgroundColor: usagePercent(usage.researchThisMonth, tierLimits.research) >= 90 ? '#ef4444' : '#7c3aed',
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {subscriptionTier === 'free' && (
                    <div className="pricing-info">
                      <h4>Pro Plan Benefits</h4>
                      <ul>
                        <li>✅ 100 posts per month</li>
                        <li>✅ 5 social platforms</li>
                        <li>✅ 50 research queries</li>
                        <li>✅ Advanced analytics</li>
                        <li>✅ Priority support</li>
                      </ul>
                      <p className="price">₦9,999/month</p>
                    </div>
                  )}

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