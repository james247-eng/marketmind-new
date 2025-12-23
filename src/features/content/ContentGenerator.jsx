// ContentGenerator.jsx
// AI-powered content generation with file upload

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { generateContent, conductResearch } from '../../services/aiService';
import { uploadFile, validateFile } from '../../services/storageService';
import { saveContent } from '../../services/contentService';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Sparkles, Upload, X, Loader, Image as ImageIcon } from 'lucide-react';
import './ContentGenerator.css';

function ContentGenerator() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    businessId: '',
    prompt: '',
    tone: 'professional',
    includeResearch: false
  });

  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const [generatedContent, setGeneratedContent] = useState('');
  const [researchInsights, setResearchInsights] = useState('');

  // Fetch user businesses
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
      
      if (businessList.length > 0) {
        setFormData(prev => ({ ...prev, businessId: businessList[0].id }));
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCheckbox = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked
    });
  };

  // File upload handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setUploadedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Generate content
  const handleGenerate = async () => {
    if (!formData.businessId) {
      setError('Please select a business');
      return;
    }

    if (!formData.prompt.trim()) {
      setError('Please enter what you want to create');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setGeneratedContent('');
    setResearchInsights('');

    try {
      const selectedBusiness = businesses.find(b => b.id === formData.businessId);
      const businessContext = `Business: ${selectedBusiness.name}, Industry: ${selectedBusiness.niche}, Target: ${selectedBusiness.targetAudience || 'general audience'}`;

      // Conduct research if requested
      if (formData.includeResearch) {
        const research = await conductResearch(formData.prompt, selectedBusiness.niche);
        if (research.success) {
          setResearchInsights(research.insights);
        }
      }

      // Generate content
      const result = await generateContent(formData.prompt, formData.tone, businessContext);
      
      if (result.success) {
        setGeneratedContent(result.content);
      } else {
        setGeneratedContent(result.content); // Show placeholder
      }

    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Save generated content
  const handleSave = async () => {
    if (!generatedContent) {
      setError('No content to save');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = null;

      // Upload file if exists
      if (uploadedFile) {
        setUploadProgress(50);
        const uploadResult = await uploadFile(
          uploadedFile,
          currentUser.uid,
          formData.businessId
        );

        if (uploadResult.success) {
          imageUrl = uploadResult.url;
          setUploadProgress(100);
        } else {
          throw new Error('File upload failed');
        }
      }

      // Save to Firestore
      const contentData = {
        userId: currentUser.uid,
        businessId: formData.businessId,
        content: generatedContent,
        tone: formData.tone,
        imageUrl: imageUrl,
        researchInsights: researchInsights || null
      };

      const saveResult = await saveContent(contentData);

      if (saveResult.success) {
        setSuccess('Content saved successfully!');
        setTimeout(() => {
          setSuccess('');
          resetForm();
        }, 3000);
      }

    } catch (err) {
      setError('Failed to save content. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      ...formData,
      prompt: '',
      includeResearch: false
    });
    setGeneratedContent('');
    setResearchInsights('');
    removeFile();
  };

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">
          <div className="page-header">
            <div>
              <h1><Sparkles size={32} style={{ display: 'inline', marginRight: '12px' }} />Generate Content</h1>
              <p>Create AI-powered marketing content for your business</p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <div className="generator-container">
            {/* Input Section */}
            <div className="generator-section">
              <h3>Content Details</h3>

              <div className="form-group">
                <label>Select Business</label>
                <select
                  name="businessId"
                  value={formData.businessId}
                  onChange={handleChange}
                  disabled={businesses.length === 0}
                >
                  {businesses.length === 0 ? (
                    <option>No businesses found</option>
                  ) : (
                    businesses.map(business => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>What do you want to create?</label>
                <textarea
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleChange}
                  placeholder="E.g., A post about our new product launch, announcing a special discount, sharing customer testimonials..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Tone</label>
                <select name="tone" value={formData.tone} onChange={handleChange}>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="witty">Witty & Humorous</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="urgent">Urgent & Persuasive</option>
                  <option value="educational">Educational</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="includeResearch"
                    checked={formData.includeResearch}
                    onChange={handleCheckbox}
                  />
                  <span>Include market research insights</span>
                </label>
              </div>

              {/* File Upload */}
              <div className="form-group">
                <label>Add Image/Video (Optional)</label>
                
                {!uploadedFile ? (
                  <div
                    className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput').click()}
                  >
                    <Upload size={32} />
                    <p>Drag & drop or click to upload</p>
                    <span>JPG, PNG, GIF, MP4 (max 10MB for images, 50MB for videos)</span>
                    <input
                      id="fileInput"
                      type="file"
                      accept="image/*,video/mp4"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <div className="file-preview">
                    {uploadedFile.type.startsWith('image/') ? (
                      <img src={filePreview} alt="Preview" />
                    ) : (
                      <video src={filePreview} controls />
                    )}
                    <button className="remove-file" onClick={removeFile}>
                      <X size={20} />
                    </button>
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>

              <button
                className="btn-generate"
                onClick={handleGenerate}
                disabled={loading || businesses.length === 0}
              >
                {loading ? (
                  <>
                    <Loader className="spinner" size={20} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Content
                  </>
                )}
              </button>
            </div>

            {/* Output Section */}
            {(generatedContent || researchInsights) && (
              <div className="generator-section">
                <h3>Generated Content</h3>

                {researchInsights && (
                  <div className="research-box">
                    <h4>Market Insights</h4>
                    <p>{researchInsights}</p>
                  </div>
                )}

                <div className="content-output">
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    rows="10"
                    placeholder="Your generated content will appear here..."
                  />
                </div>

                <div className="output-actions">
                  <button className="btn-secondary" onClick={resetForm}>
                    Clear
                  </button>
                  <button className="btn-primary" onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Content'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ContentGenerator;