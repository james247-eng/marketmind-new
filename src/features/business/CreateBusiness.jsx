// CreateBusiness.jsx
// Form to create a new business profile

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Building2, AlertCircle } from 'lucide-react';
import './CreateBusiness.css';

function CreateBusiness() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
      await addDoc(collection(db, 'businesses'), {
        ...formData,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        postsGenerated: 0
      });
      navigate('/businesses');
    } catch (err) {
      setError('Failed to create business. Please try again.');
      console.error(err);
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
              <h1>Create Business</h1>
              <p>Add a new business profile to start generating content</p>
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
                  {loading ? 'Creating...' : 'Create Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreateBusiness;