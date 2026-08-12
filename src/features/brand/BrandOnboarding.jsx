import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getBrandProfile, saveBrandProfile } from '../../services/brandService.js';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { AlertCircle, CheckCircle } from 'lucide-react';
import './BrandOnboarding.css';

const INDUSTRIES = [
  'Fashion',
  'Health & Fitness',
  'Food & Beverage',
  'Technology',
  'Education',
  'Beauty & Cosmetics',
  'Real Estate',
  'Finance',
  'Retail',
  'Services',
  'Other'
];

const AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'];
const LOCATION_OPTIONS = ['Nigeria only', 'Africa', 'Global'];
const VOICE_TONES = ['Professional', 'Friendly', 'Bold', 'Inspiring', 'Humorous', 'Luxury'];
const LANGUAGE_STYLES = ['Formal', 'Conversational', 'Gen Z / Street'];

const defaultProfile = {
  businessName: '',
  industry: '',
  description: '',
  tagline: '',
  audience: '',
  ageRange: [],
  locationFocus: '',
  tone: '',
  languageStyle: '',
  wordsToAvoid: [],
  primaryColor: '#4f46e5',
  secondaryColor: '#f472b6',
  logoUrl: '',
  products: []
};

function BrandOnboarding() {
  const { workspaceId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '' });

  useEffect(() => {
    const loadProfile = async () => {
      if (!workspaceId || !currentUser) return;
      const result = await getBrandProfile(workspaceId);
      if (result.success && result.profile) {
        setProfile({
          ...defaultProfile,
          ...result.profile,
          ageRange: result.profile.ageRange || [],
          wordsToAvoid: result.profile.wordsToAvoid || [],
          products: result.profile.products || []
        });
      }
      setLoading(false);
    };

    loadProfile();
  }, [currentUser, workspaceId]);

  const validateStep = () => {
    setError('');
    if (activeStep === 1) {
      if (!profile.businessName.trim()) return 'Business name is required.';
      if (!profile.industry) return 'Industry is required.';
      if (!profile.description.trim()) return 'Business description is required.';
      if (profile.description.trim().length > 300) return 'Business description cannot exceed 300 characters.';
    }
    if (activeStep === 2) {
      if (!profile.audience.trim()) return 'Target customer description is required.';
      if (profile.ageRange.length === 0) return 'Please select at least one age range.';
      if (!profile.locationFocus) return 'Location focus is required.';
    }
    if (activeStep === 3) {
      if (!profile.tone) return 'Please select a brand tone.';
      if (!profile.languageStyle) return 'Please select a language style.';
    }
    return '';
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setActiveStep((prev) => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  const handleInput = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAgeRange = (value) => {
    setProfile((prev) => ({
      ...prev,
      ageRange: prev.ageRange.includes(value)
        ? prev.ageRange.filter((item) => item !== value)
        : [...prev.ageRange, value]
    }));
  };

  const toggleWord = (word) => {
    const trimmed = word.trim();
    if (!trimmed) return;
    setProfile((prev) => ({
      ...prev,
      wordsToAvoid: prev.wordsToAvoid.includes(trimmed)
        ? prev.wordsToAvoid
        : [...prev.wordsToAvoid, trimmed]
    }));
  };

  const removeWord = (word) => {
    setProfile((prev) => ({
      ...prev,
      wordsToAvoid: prev.wordsToAvoid.filter((item) => item !== word)
    }));
  };

  const addProduct = () => {
    if (!newProduct.name.trim() || !newProduct.description.trim()) {
      setError('Product name and description are required.');
      return;
    }
    if (profile.products.length >= 5) {
      setError('You can add up to 5 products or services.');
      return;
    }
    setProfile((prev) => ({
      ...prev,
      products: [...prev.products, {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: newProduct.price.trim()
      }]
    }));
    setNewProduct({ name: '', description: '', price: '' });
    setError('');
  };

  const removeProduct = (index) => {
    setProfile((prev) => ({
      ...prev,
      products: prev.products.filter((_, idx) => idx !== index)
    }));
  };

  const handleSave = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    const result = await saveBrandProfile(workspaceId, profile);
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Unable to save brand profile.');
      return;
    }

    setSuccess('Brand profile saved successfully. Redirecting…');
    setTimeout(() => {
      navigate(`/app/${workspaceId}/brand`, { replace: true });
    }, 500);
  };

  if (loading) {
    return (
      <div className="app">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="content-area">
            <div className="loading-state">Loading brand setup…</div>
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
              <h1>Brand Identity Setup</h1>
              <p>Create your brand profile so every generated asset aligns with your business.</p>
            </div>
          </div>

          <div className="brand-onboarding-card">
            <div className="progress-strip">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  className={`progress-step ${activeStep === step ? 'active' : ''} ${activeStep > step ? 'completed' : ''}`}
                >
                  <span>{step}</span>
                </div>
              ))}
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

            <div className="brand-step-content">
              {activeStep === 1 && (
                <div className="form-section">
                  <h2>Business Basics</h2>
                  <div className="form-group">
                    <label htmlFor="businessName">Business name *</label>
                    <input
                      id="businessName"
                      name="businessName"
                      value={profile.businessName}
                      onChange={(e) => handleInput('businessName', e.target.value)}
                      placeholder="E.g., Teamly AI"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="industry">Industry *</label>
                    <select
                      id="industry"
                      value={profile.industry}
                      onChange={(e) => handleInput('industry', e.target.value)}
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Business description *</label>
                    <textarea
                      id="description"
                      value={profile.description}
                      onChange={(e) => handleInput('description', e.target.value)}
                      maxLength={300}
                      rows={4}
                    />
                    <small>{profile.description.length}/300</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tagline">Tagline</label>
                    <input
                      id="tagline"
                      value={profile.tagline}
                      onChange={(e) => handleInput('tagline', e.target.value)}
                      placeholder="Optional tagline"
                    />
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="form-section">
                  <h2>Your Audience</h2>
                  <div className="form-group">
                    <label htmlFor="audience">Target customer *</label>
                    <textarea
                      id="audience"
                      value={profile.audience}
                      onChange={(e) => handleInput('audience', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label>Age range *</label>
                    <div className="chip-grid">
                      {AGE_RANGES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`chip ${profile.ageRange.includes(option) ? 'selected' : ''}`}
                          onClick={() => toggleAgeRange(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="locationFocus">Location focus *</label>
                    <select
                      id="locationFocus"
                      value={profile.locationFocus}
                      onChange={(e) => handleInput('locationFocus', e.target.value)}
                    >
                      <option value="">Select location focus</option>
                      {LOCATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="form-section">
                  <h2>Brand Voice</h2>
                  <div className="form-group">
                    <label>Tone *</label>
                    <div className="card-grid">
                      {VOICE_TONES.map((tone) => (
                        <button
                          key={tone}
                          type="button"
                          className={`option-card ${profile.tone === tone ? 'selected' : ''}`}
                          onClick={() => handleInput('tone', tone)}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="languageStyle">Language style *</label>
                    <select
                      id="languageStyle"
                      value={profile.languageStyle}
                      onChange={(e) => handleInput('languageStyle', e.target.value)}
                    >
                      <option value="">Select language style</option>
                      {LANGUAGE_STYLES.map((style) => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="wordsToAvoid">Words to avoid</label>
                    <div className="words-input-row">
                      <input
                        id="wordsToAvoid"
                        type="text"
                        value={profile.wordsToAvoidInput || ''}
                        onChange={(e) => handleInput('wordsToAvoidInput', e.target.value)}
                        placeholder="Add a word and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            toggleWord(profile.wordsToAvoidInput || '');
                            handleInput('wordsToAvoidInput', '');
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          toggleWord(profile.wordsToAvoidInput || '');
                          handleInput('wordsToAvoidInput', '');
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div className="chip-grid">
                      {profile.wordsToAvoid.map((word) => (
                        <div key={word} className="chip chip-remove">
                          {word}
                          <button type="button" onClick={() => removeWord(word)}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="form-section">
                  <h2>Brand Identity</h2>
                  <div className="form-group">
                    <label htmlFor="primaryColor">Primary color *</label>
                    <input
                      id="primaryColor"
                      type="color"
                      value={profile.primaryColor}
                      onChange={(e) => handleInput('primaryColor', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="secondaryColor">Secondary color *</label>
                    <input
                      id="secondaryColor"
                      type="color"
                      value={profile.secondaryColor}
                      onChange={(e) => handleInput('secondaryColor', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="logoUpload">Logo upload</label>
                    <input
                      id="logoUpload"
                      type="url"
                      placeholder="Logo URL (optional)"
                      value={profile.logoUrl}
                      onChange={(e) => handleInput('logoUrl', e.target.value)}
                    />
                    <small>Enter an image URL if you don't want to upload a file.</small>
                  </div>
                </div>
              )}

              {activeStep === 5 && (
                <div className="form-section">
                  <h2>Products or Services</h2>
                  <div className="product-form-grid">
                    <div className="form-group">
                      <label htmlFor="productName">Name</label>
                      <input
                        id="productName"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Product or service name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="productDescription">Description</label>
                      <input
                        id="productDescription"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Short description"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="productPrice">Price</label>
                      <input
                        id="productPrice"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                        placeholder="Optional price"
                      />
                    </div>
                  </div>

                  <div className="form-actions product-actions">
                    <button type="button" className="btn-secondary" onClick={addProduct}>
                      Add Product
                    </button>
                  </div>

                  {profile.products.length > 0 && (
                    <div className="product-list">
                      {profile.products.map((product, index) => (
                        <div key={`${product.name}-${index}`} className="product-card">
                          <div>
                            <strong>{product.name}</strong>
                            <p>{product.description}</p>
                          </div>
                          <div className="product-card-footer">
                            <span>{product.price || 'No price set'}</span>
                            <button type="button" className="btn-secondary" onClick={() => removeProduct(index)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeStep === 6 && (
                <div className="form-section">
                  <h2>Review & Confirm</h2>
                  <div className="summary-grid">
                    <section>
                      <h3>Business Basics</h3>
                      <p><strong>Name:</strong> {profile.businessName}</p>
                      <p><strong>Industry:</strong> {profile.industry}</p>
                      <p><strong>Description:</strong> {profile.description}</p>
                      <p><strong>Tagline:</strong> {profile.tagline || '—'}</p>
                    </section>

                    <section>
                      <h3>Your Audience</h3>
                      <p><strong>Target customer:</strong> {profile.audience}</p>
                      <p><strong>Age range:</strong> {profile.ageRange.join(', ')}</p>
                      <p><strong>Location:</strong> {profile.locationFocus}</p>
                    </section>

                    <section>
                      <h3>Brand Voice</h3>
                      <p><strong>Tone:</strong> {profile.tone}</p>
                      <p><strong>Language:</strong> {profile.languageStyle}</p>
                      <p><strong>Words to avoid:</strong> {profile.wordsToAvoid.join(', ') || 'None'}</p>
                    </section>

                    <section>
                      <h3>Brand Identity</h3>
                      <p><strong>Primary color:</strong> <span className="color-swatch" style={{ backgroundColor: profile.primaryColor }} /></p>
                      <p><strong>Secondary color:</strong> <span className="color-swatch" style={{ backgroundColor: profile.secondaryColor }} /></p>
                      <p><strong>Logo URL:</strong> {profile.logoUrl || 'None'}</p>
                    </section>

                    <section>
                      <h3>Products / Services</h3>
                      {profile.products.length === 0 ? (
                        <p>None added yet.</p>
                      ) : (
                        <ul className="product-summary-list">
                          {profile.products.map((product, index) => (
                            <li key={`${product.name}-${index}`}>
                              <strong>{product.name}</strong> — {product.description} {product.price && `(${product.price})`}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={handleBack} disabled={activeStep === 1 || saving}>
                Back
              </button>
              {activeStep < 6 ? (
                <button type="button" className="btn-primary" onClick={handleNext}>
                  Next
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Brand Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BrandOnboarding;
