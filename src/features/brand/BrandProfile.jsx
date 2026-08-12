import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getBrandProfile, updateBrandProfile } from '../../services/brandService.js';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { AlertCircle, CheckCircle } from 'lucide-react';
import './BrandOnboarding.css';

function BrandProfile() {
  const { workspaceId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [brandProfile, setBrandProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      if (!workspaceId || !currentUser) return;
      const result = await getBrandProfile(workspaceId);
      if (result.success) {
        setBrandProfile(result.profile);
      } else {
        setError(result.error || 'Unable to load brand profile.');
      }
      setLoading(false);
    };

    loadProfile();
  }, [currentUser, workspaceId]);

  useEffect(() => {
    if (!editingSection || !brandProfile) return;
    setFormData({ ...brandProfile });
  }, [editingSection, brandProfile]);

  const startEdit = (section) => {
    setError('');
    setSuccess('');
    setEditingSection(section);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setFormData({});
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    setError('');
    setSaving(true);
    const updates = { ...formData };
    const result = await updateBrandProfile(workspaceId, updates);
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Unable to update brand profile.');
      return;
    }

    setBrandProfile((prev) => ({ ...prev, ...updates }));
    setSuccess('Brand profile updated successfully.');
    setEditingSection(null);
  };

  if (loading) {
    return (
      <div className="app">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="content-area">
            <div className="loading-state">Loading brand profile…</div>
          </div>
        </main>
      </div>
    );
  }

  if (!brandProfile) {
    return (
      <div className="app">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="content-area">
            <div className="page-header">
              <h1>Brand Profile</h1>
              <p>No brand profile found for this workspace.</p>
            </div>
            <button className="btn-primary" onClick={() => navigate(`/app/${workspaceId}/brand/setup`)}>
              Create Brand Profile
            </button>
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
              <h1>Brand Profile</h1>
              <p>Review and update your brand identity details.</p>
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="success-banner">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          <div className="brand-profile-grid">
            <section className="brand-card">
              <div className="section-header">
                <h2>Business Basics</h2>
                <button className="btn-secondary" onClick={() => startEdit('basics')}>
                  Edit
                </button>
              </div>
              <p><strong>Name:</strong> {brandProfile.businessName}</p>
              <p><strong>Industry:</strong> {brandProfile.industry}</p>
              <p><strong>Description:</strong> {brandProfile.description}</p>
              <p><strong>Tagline:</strong> {brandProfile.tagline || 'None'}</p>
            </section>

            <section className="brand-card">
              <div className="section-header">
                <h2>Audience</h2>
                <button className="btn-secondary" onClick={() => startEdit('audience')}>
                  Edit
                </button>
              </div>
              <p><strong>Target customer:</strong> {brandProfile.audience}</p>
              <p><strong>Age range:</strong> {(brandProfile.ageRange || []).join(', ')}</p>
              <p><strong>Location focus:</strong> {brandProfile.locationFocus}</p>
            </section>

            <section className="brand-card">
              <div className="section-header">
                <h2>Voice</h2>
                <button className="btn-secondary" onClick={() => startEdit('voice')}>
                  Edit
                </button>
              </div>
              <p><strong>Tone:</strong> {brandProfile.tone}</p>
              <p><strong>Language style:</strong> {brandProfile.languageStyle}</p>
              <p><strong>Words to avoid:</strong> {(brandProfile.wordsToAvoid || []).join(', ') || 'None'}</p>
            </section>

            <section className="brand-card">
              <div className="section-header">
                <h2>Identity</h2>
                <button className="btn-secondary" onClick={() => startEdit('identity')}>
                  Edit
                </button>
              </div>
              <div className="color-row">
                <div>
                  <strong>Primary color</strong>
                  <div className="color-swatch" style={{ backgroundColor: brandProfile.primaryColor }} />
                  <span>{brandProfile.primaryColor}</span>
                </div>
                <div>
                  <strong>Secondary color</strong>
                  <div className="color-swatch" style={{ backgroundColor: brandProfile.secondaryColor }} />
                  <span>{brandProfile.secondaryColor}</span>
                </div>
              </div>
              <p><strong>Logo URL:</strong> {brandProfile.logoUrl || 'None'}</p>
            </section>

            <section className="brand-card">
              <div className="section-header">
                <h2>Products / Services</h2>
                <button className="btn-secondary" onClick={() => startEdit('products')}>
                  Edit
                </button>
              </div>
              {brandProfile.products && brandProfile.products.length > 0 ? (
                <ul className="product-summary-list">
                  {brandProfile.products.map((product, index) => (
                    <li key={`${product.name}-${index}`}>
                      <strong>{product.name}</strong> — {product.description} {product.price && `(${product.price})`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No products or services added.</p>
              )}
            </section>
          </div>

          {editingSection && (
            <div className="edit-modal">
              <div className="edit-panel">
                <div className="section-header">
                  <h2>Edit {editingSection}</h2>
                </div>
                <div className="form-section">
                  {editingSection === 'basics' && (
                    <>
                      <div className="form-group">
                        <label>Business name</label>
                        <input value={formData.businessName || ''} onChange={(e) => handleChange('businessName', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Industry</label>
                        <select value={formData.industry || ''} onChange={(e) => handleChange('industry', e.target.value)}>
                          <option value="">Select industry</option>
                          {INDUSTRIES.map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={4} />
                      </div>
                      <div className="form-group">
                        <label>Tagline</label>
                        <input value={formData.tagline || ''} onChange={(e) => handleChange('tagline', e.target.value)} />
                      </div>
                    </>
                  )}

                  {editingSection === 'audience' && (
                    <>
                      <div className="form-group">
                        <label>Target customer</label>
                        <textarea value={formData.audience || ''} onChange={(e) => handleChange('audience', e.target.value)} rows={4} />
                      </div>
                      <div className="form-group">
                        <label>Age range</label>
                        <div className="chip-grid">
                          {AGE_RANGES.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`chip ${formData.ageRange?.includes(option) ? 'selected' : ''}`}
                              onClick={() => {
                                const selected = formData.ageRange || [];
                                const next = selected.includes(option)
                                  ? selected.filter((item) => item !== option)
                                  : [...selected, option];
                                handleChange('ageRange', next);
                              }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Location focus</label>
                        <select value={formData.locationFocus || ''} onChange={(e) => handleChange('locationFocus', e.target.value)}>
                          <option value="">Select location focus</option>
                          {LOCATION_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {editingSection === 'voice' && (
                    <>
                      <div className="form-group">
                        <label>Tone</label>
                        <select value={formData.tone || ''} onChange={(e) => handleChange('tone', e.target.value)}>
                          <option value="">Select tone</option>
                          {VOICE_TONES.map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Language style</label>
                        <select value={formData.languageStyle || ''} onChange={(e) => handleChange('languageStyle', e.target.value)}>
                          <option value="">Select language style</option>
                          {LANGUAGE_STYLES.map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Words to avoid</label>
                        <textarea value={(formData.wordsToAvoid || []).join(', ')} onChange={(e) => handleChange('wordsToAvoid', e.target.value.split(',').map((word) => word.trim()).filter(Boolean))} rows={3} />
                        <small>Comma-separated list of words to avoid.</small>
                      </div>
                    </>
                  )}

                  {editingSection === 'identity' && (
                    <>
                      <div className="form-group">
                        <label>Primary color</label>
                        <input type="color" value={formData.primaryColor || '#4f46e5'} onChange={(e) => handleChange('primaryColor', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Secondary color</label>
                        <input type="color" value={formData.secondaryColor || '#f472b6'} onChange={(e) => handleChange('secondaryColor', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Logo URL</label>
                        <input value={formData.logoUrl || ''} onChange={(e) => handleChange('logoUrl', e.target.value)} />
                      </div>
                    </>
                  )}

                  {editingSection === 'products' && (
                    <div className="form-group">
                      <label>Products / Services</label>
                      <textarea value={(formData.products || []).map((item) => `${item.name} | ${item.description} | ${item.price || 'N/A'}`).join('\n')} onChange={(e) => {
                        const lines = e.target.value.split('\n').map((line) => line.trim()).filter(Boolean);
                        const products = lines.map((line) => {
                          const [name, description, price] = line.split('|').map((part) => part.trim());
                          return { name: name || '', description: description || '', price: price || '' };
                        }).filter((item) => item.name && item.description);
                        handleChange('products', products);
                      }} rows={6} />
                      <small>One product per line: name | description | price</small>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                  <button type="button" className="btn-primary" onClick={handleUpdate} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default BrandProfile;
