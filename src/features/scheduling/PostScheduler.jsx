// PostScheduler.jsx
// Schedule posts to social media - SIMPLIFIED VERSION

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { getConnectedAccounts } from '../../services/socialMediaService';
import { getContentHistory } from '../../services/contentService';
import { schedulePost, getScheduledPosts, cancelScheduledPost } from '../../services/schedulingService';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Calendar, Clock, Send, X, AlertCircle, CheckCircle } from 'lucide-react';
import './PostScheduler.css';

function PostScheduler() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  
  // Data states
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [savedContent, setSavedContent] = useState([]); // User's saved content
  const [connectedAccounts, setConnectedAccounts] = useState([]); // User's social accounts
  const [upcomingPosts, setUpcomingPosts] = useState([]); // Already scheduled posts
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [scheduleForm, setScheduleForm] = useState({
    contentId: '', // Which content to post
    platforms: [], // Which platforms (facebook, twitter, etc)
    date: '', // When to post - date
    time: '' // When to post - time
  });

  // STEP 1: Load user's businesses when component mounts
  useEffect(() => {
    loadBusinesses();
    loadConnectedAccounts();
  }, [currentUser]);

  // STEP 2: When business is selected, load content and scheduled posts
  useEffect(() => {
    if (selectedBusiness) {
      loadSavedContent();
      loadUpcomingPosts();
    }
  }, [selectedBusiness]);

  // Load user's businesses from Firestore
  const loadBusinesses = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'businesses'),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setBusinesses(list);
      
      // Auto-select first business
      if (list.length > 0) {
        setSelectedBusiness(list[0].id);
      }
    } catch (err) {
      console.error('Error loading businesses:', err);
    }
  };

  // Load user's saved content for selected business
  const loadSavedContent = async () => {
    const result = await getContentHistory(selectedBusiness);
    if (result.success) {
      setSavedContent(result.content);
    }
  };

  // Load user's connected social accounts
  const loadConnectedAccounts = async () => {
    if (!currentUser) return;

    const result = await getConnectedAccounts(currentUser.uid);
    if (result.success) {
      setConnectedAccounts(result.accounts);
    }
  };

  // Load already scheduled posts
  const loadUpcomingPosts = async () => {
    const result = await getScheduledPosts(selectedBusiness);
    if (result.success) {
      setUpcomingPosts(result.posts);
    }
  };

  // Handle platform selection (checkboxes)
  const togglePlatform = (platformName) => {
    const isSelected = scheduleForm.platforms.includes(platformName);
    
    if (isSelected) {
      // Remove platform
      setScheduleForm({
        ...scheduleForm,
        platforms: scheduleForm.platforms.filter(p => p !== platformName)
      });
    } else {
      // Add platform
      setScheduleForm({
        ...scheduleForm,
        platforms: [...scheduleForm.platforms, platformName]
      });
    }
  };

  // Handle form submission
  const handleSchedulePost = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!scheduleForm.contentId) {
      setError('Please select content to post');
      return;
    }

    if (scheduleForm.platforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    if (!scheduleForm.date || !scheduleForm.time) {
      setError('Please select when to post');
      return;
    }

    setLoading(true);

    try {
      // Find the selected content
      const content = savedContent.find(c => c.id === scheduleForm.contentId);
      
      // Combine date and time into one datetime
      const scheduledDateTime = new Date(`${scheduleForm.date}T${scheduleForm.time}`);

      // Get account details for selected platforms
      const selectedAccounts = connectedAccounts.filter(account =>
        scheduleForm.platforms.includes(account.platform)
      );

      // Prepare data to save
      const postData = {
        businessId: selectedBusiness,
        userId: currentUser.uid,
        contentId: scheduleForm.contentId,
        content: content.content,
        imageUrl: content.imageUrl || null,
        platforms: selectedAccounts.map(acc => ({
          platform: acc.platform,
          accountId: acc.accountId,
          accountName: acc.accountName
        })),
        scheduledTime: scheduledDateTime.toISOString()
      };

      // Save to Firestore
      const result = await schedulePost(postData);

      if (result.success) {
        setSuccess('Post scheduled successfully!');
        loadUpcomingPosts(); // Refresh list
        clearForm();
      } else {
        setError('Failed to schedule post');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cancel a scheduled post
  const handleCancelPost = async (postId) => {
    if (!confirm('Are you sure you want to cancel this post?')) return;

    const result = await cancelScheduledPost(postId);

    if (result.success) {
      setSuccess('Post cancelled successfully');
      loadUpcomingPosts(); // Refresh list
    } else {
      setError('Failed to cancel post');
    }
  };

  // Clear form after successful schedule
  const clearForm = () => {
    setScheduleForm({
      contentId: '',
      platforms: [],
      date: '',
      time: ''
    });
  };

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">
          
          {/* Page Title */}
          <div className="page-header">
            <div>
              <h1>Schedule Posts</h1>
              <p>Plan when your content gets posted to social media</p>
            </div>
          </div>

          {/* Error/Success Messages */}
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

          <div className="scheduler-layout">
            
            {/* LEFT SIDE: Schedule New Post Form */}
            <div className="scheduler-section">
              <h3>📅 Schedule New Post</h3>

              <form onSubmit={handleSchedulePost}>
                
                {/* Select Business */}
                <div className="form-group">
                  <label>Business</label>
                  <select
                    value={selectedBusiness}
                    onChange={(e) => setSelectedBusiness(e.target.value)}
                    required
                  >
                    {businesses.length === 0 ? (
                      <option>No businesses found</option>
                    ) : (
                      businesses.map(biz => (
                        <option key={biz.id} value={biz.id}>
                          {biz.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Select Content */}
                <div className="form-group">
                  <label>Choose Content to Post</label>
                  <select
                    value={scheduleForm.contentId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, contentId: e.target.value })}
                    required
                  >
                    <option value="">-- Select content --</option>
                    {savedContent.map(content => (
                      <option key={content.id} value={content.id}>
                        {content.content.slice(0, 60)}...
                      </option>
                    ))}
                  </select>
                  {savedContent.length === 0 && (
                    <p className="hint-text">No saved content. <a href="/generate">Generate content first</a></p>
                  )}
                </div>

                {/* Select Platforms (Checkboxes) */}
                <div className="form-group">
                  <label>Choose Platforms</label>
                  <div className="platform-list">
                    {connectedAccounts.length === 0 ? (
                      <p className="hint-text">No connected accounts. <a href="/accounts">Connect platforms first</a></p>
                    ) : (
                      connectedAccounts.map(account => (
                        <label key={account.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={scheduleForm.platforms.includes(account.platform)}
                            onChange={() => togglePlatform(account.platform)}
                          />
                          <span>
                            {account.platform.toUpperCase()} - {account.accountName}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Select Date and Time */}
                <div className="form-row">
                  <div className="form-group">
                    <label>📅 Date</label>
                    <input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]} // Can't schedule in the past
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>🕐 Time</label>
                    <input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn-schedule"
                  disabled={loading || connectedAccounts.length === 0 || savedContent.length === 0}
                >
                  <Send size={20} />
                  {loading ? 'Scheduling...' : 'Schedule Post'}
                </button>
              </form>
            </div>

            {/* RIGHT SIDE: Upcoming Scheduled Posts */}
            <div className="scheduler-section">
              <h3>📋 Upcoming Posts</h3>

              {upcomingPosts.length === 0 ? (
                <div className="empty-state-small">
                  <Calendar size={48} />
                  <p>No scheduled posts yet</p>
                  <small>Schedule your first post using the form</small>
                </div>
              ) : (
                <div className="posts-list">
                  {upcomingPosts.map(post => (
                    <div key={post.id} className="post-card">
                      
                      {/* When it will post */}
                      <div className="post-time">
                        <Clock size={16} />
                        <strong>
                          {new Date(post.scheduledTime).toLocaleDateString()} at{' '}
                          {new Date(post.scheduledTime).toLocaleTimeString()}
                        </strong>
                      </div>

                      {/* Content preview */}
                      <p className="post-preview">
                        {post.content.slice(0, 100)}...
                      </p>

                      {/* Which platforms */}
                      <div className="post-platforms">
                        {post.platforms.map((p, index) => (
                          <span key={index} className="platform-badge">
                            {p.platform}
                          </span>
                        ))}
                      </div>

                      {/* Status and Cancel button */}
                      <div className="post-footer">
                        <span className={`status-${post.status}`}>
                          {post.status}
                        </span>
                        
                        {post.status === 'scheduled' && (
                          <button
                            className="btn-cancel-post"
                            onClick={() => handleCancelPost(post.id)}
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default PostScheduler;