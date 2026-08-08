// EditBusiness.jsx
// Form to edit an existing business profile

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.js';
import COLLECTIONS from '../../lib/schema.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { Building2, AlertCircle } from 'lucide-react';
import './CreateBusiness.css';

function EditBusiness() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    niche: '',
    presenceType: 'both',
    country: '',
    description: '',
    targetAudience: '',
    brandVoice: 'professional'
  });

  useEffect(() => {
    fetchBusiness();
  }, [id, currentUser]);

  const fetchBusiness = async () => {
    if (!currentUser || !id) return;

    try {
      const docRef = doc(db, COLLECTIONS.workspaces, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure user owns this business
        if (data.userId === currentUser.uid) {
          setFormData({
            name: data.name || '',
            niche: data.niche || '',
            presenceType: data.presenceType || 'both',
            country: data.country || '',
            description: data.description || '',
            targetAudience: data.targetAudience || '',
            brandVoice: data.brandVoice || 'professional'
          });
        } else {
          setError('You do not have permission to edit this business.');
        }
      } else {
        setError('Business not found.');
      }
    } catch (err) {
      setError('Failed to load business details.');
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const docRef = doc(db, COLLECTIONS.workspaces, id);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      navigate('/businesses');
    } catch (err) {
      setError('Failed to update business. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="app">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="content-area">
            <div className="loading">Loading business details...</div>
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
          <div className="page-header">
            <div>
              <h1>Edit Business</h1>
              <p>Update your business profile information</p>
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-container">
            <form onSubmit={handleSubmit} className="business-form">
              <div className="form-section">
                <h3>Basic Information</h3>

                <div className="form-group">
                  <label htmlFor="name">Business Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Acme Digital Solutions"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="niche">Niche/Industry *</label>
                  <input
                    type="text"
                    id="niche"
                    name="niche"
                    value={formData.niche}
                    onChange={handleChange}
                    placeholder="e.g., Digital Marketing, E-commerce, SaaS"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="presenceType">Business Presence *</label>
                  <select
                    id="presenceType"
                    name="presenceType"
                    value={formData.presenceType}
                    onChange={handleChange}
                    required
                  >
                    <option value="online">Online Only</option>
                    <option value="physical">Physical Location Only</option>
                    <option value="both">Both Online & Physical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g., United States, Nigeria, UK"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Brand Details</h3>

                <div className="form-group">
                  <label htmlFor="description">Business Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description of what your business does..."
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="targetAudience">Target Audience</label>
                  <input
                    type="text"
                    id="targetAudience"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleChange}
                    placeholder="e.g., Small business owners, Tech startups, Young professionals"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="brandVoice">Brand Voice *</label>
                  <select
                    id="brandVoice"
                    name="brandVoice"
                    value={formData.brandVoice}
                    onChange={handleChange}
                    required
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual & Friendly</option>
                    <option value="witty">Witty & Humorous</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/businesses')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EditBusiness;
