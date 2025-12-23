// BusinessList.jsx
// Displays list of user's businesses

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Plus, Building2, Globe, MapPin } from 'lucide-react';
import './BusinessList.css';

function BusinessList() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, [currentUser]);

  const fetchBusinesses = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'businesses'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const businessList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBusinesses(businessList);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
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
              <h1>My Businesses</h1>
              <p>Manage your business profiles</p>
            </div>
            <button 
              className="btn-primary"
              onClick={() => navigate('/businesses/create')}
            >
              <Plus size={20} />
              Add Business
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading businesses...</div>
          ) : businesses.length === 0 ? (
            <div className="empty-state">
              <Building2 size={64} className="empty-icon" />
              <h2>No businesses yet</h2>
              <p>Create your first business to start generating content</p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/businesses/create')}
              >
                <Plus size={20} />
                Create Business
              </button>
            </div>
          ) : (
            <div className="business-grid">
              {businesses.map((business) => (
                <div key={business.id} className="business-card">
                  <div className="business-header">
                    <Building2 size={24} className="business-icon" />
                    <h3>{business.name}</h3>
                  </div>
                  <div className="business-info">
                    <div className="info-item">
                      <Globe size={16} />
                      <span>{business.niche}</span>
                    </div>
                    <div className="info-item">
                      <MapPin size={16} />
                      <span>{business.country}</span>
                    </div>
                  </div>
                  <div className="business-footer">
                    <span className="presence-badge">{business.presenceType}</span>
                    <button className="btn-view">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default BusinessList;