// Dashboard.jsx
// Main analytics dashboard with performance metrics

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { getConnectedAccounts } from '../../services/socialMediaService';
import { getMockAnalytics } from '../../services/analyticsService';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Eye, 
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, [currentUser]);

  useEffect(() => {
    if (selectedBusiness) {
      loadAnalytics();
    }
  }, [selectedBusiness]);

  const fetchBusinesses = async () => {
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
      
      if (list.length > 0) {
        setSelectedBusiness(list[0].id);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    
    // For now, use mock data
    // When APIs are connected, fetch real data
    const mockData = getMockAnalytics();
    setAnalytics(mockData);
    
    setLoading(false);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading || !analytics) {
    return (
      <div className="app">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="content-area">
            <div className="loading-dashboard">Loading analytics...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">
          
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1>Analytics Dashboard</h1>
              <p>Track your social media performance across all platforms</p>
            </div>
            
            {businesses.length > 0 && (
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="business-selector"
              >
                {businesses.map(biz => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#EDE9FE' }}>
                <Users size={24} style={{ color: '#8B5CF6' }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Followers</p>
                <h3 className="stat-value">{formatNumber(analytics.totalFollowers)}</h3>
                <span className="stat-change positive">
                  <ArrowUp size={14} />
                  12.5% from last month
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#DBEAFE' }}>
                <MessageCircle size={24} style={{ color: '#3B82F6' }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Engagement</p>
                <h3 className="stat-value">{formatNumber(analytics.totalEngagement)}</h3>
                <span className="stat-change positive">
                  <ArrowUp size={14} />
                  8.2% from last month
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#FEE2E2' }}>
                <Eye size={24} style={{ color: '#EF4444' }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Reach</p>
                <h3 className="stat-value">{formatNumber(analytics.totalReach)}</h3>
                <span className="stat-change positive">
                  <ArrowUp size={14} />
                  15.7% from last month
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#D1FAE5' }}>
                <Calendar size={24} style={{ color: '#10B981' }} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Posts This Month</p>
                <h3 className="stat-value">{analytics.totalPosts}</h3>
                <span className="stat-change negative">
                  <ArrowDown size={14} />
                  3.1% from last month
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            
            {/* Weekly Performance Chart */}
            <div className="chart-card large">
              <div className="chart-header">
                <h3>Weekly Performance</h3>
                <p>Engagement and reach over the past 7 days</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    name="Engagement"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reach" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Reach"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Platform Distribution Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Platform Distribution</h3>
                <p>Followers across platforms</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.platformBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ platform, percent }) => `${platform} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="followers"
                  >
                    {analytics.platformBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Posts Per Day Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Posting Activity</h3>
                <p>Daily posts this week</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="posts" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Breakdown Table */}
          <div className="platform-breakdown">
            <h3>Platform Performance</h3>
            <div className="platform-table">
              <div className="table-header">
                <span>Platform</span>
                <span>Followers</span>
                <span>Engagement</span>
                <span>Reach</span>
              </div>
              {analytics.platformBreakdown.map((platform, index) => (
                <div key={index} className="table-row">
                  <span className="platform-name">
                    <div 
                      className="platform-dot" 
                      style={{ backgroundColor: platform.color }}
                    ></div>
                    {platform.platform}
                  </span>
                  <span>{formatNumber(platform.followers)}</span>
                  <span>{formatNumber(platform.engagement)}</span>
                  <span>{formatNumber(platform.reach)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Posts */}
          <div className="top-posts">
            <h3>Top Performing Posts</h3>
            <div className="posts-list">
              {analytics.topPosts.map((post, index) => (
                <div key={index} className="post-item">
                  <p className="post-content">{post.content}</p>
                  <div className="post-meta">
                    <span className="post-platform">{post.platform}</span>
                    <div className="post-stats">
                      <span>❤️ {post.likes}</span>
                      <span>💬 {post.comments}</span>
                      <span>🔄 {post.shares}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
