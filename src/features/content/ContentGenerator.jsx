// ContentGenerator.jsx

import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { generateContent, conductResearch } from '../../services/aiService.js';
import { getBrandProfile } from '../../services/brandService.js';
import { uploadFile, validateFile } from '../../services/storageService.js';
import { saveContent } from '../../services/contentService.js';
import { getConnectedAccounts, postToMultiplePlatforms } from '../../services/socialMediaService.js';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { Sparkles, Upload, X, Loader, Copy, Send } from 'lucide-react';
import './ContentGenerator.css';

const PLATFORMS = [
  { key: 'twitter',   label: 'Twitter/X',  icon: '🐦', charLimit: 280  },
  { key: 'linkedin',  label: 'LinkedIn',   icon: '💼', charLimit: 3000 },
  { key: 'instagram', label: 'Instagram',  icon: '📷', charLimit: 2200 },
  { key: 'tiktok',    label: 'TikTok',     icon: '🎵', charLimit: 2200 },
  { key: 'youtube',   label: 'YouTube',    icon: '▶️', charLimit: 5000 },
  { key: 'facebook',  label: 'Facebook',   icon: '📘', charLimit: 63206 },
];

const CONTENT_TYPES = [
  { value: 'social-post', label: 'Social Media Post' },
  { value: 'product-description', label: 'Product Description' },
  { value: 'email-newsletter', label: 'Email Newsletter' },
  { value: 'ad-copy', label: 'Ad Copy' },
  { value: 'blog-post-intro', label: 'Blog Post Intro' },
];

const SOCIAL_PLATFORMS = PLATFORMS.filter(({ key }) => ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'].includes(key));

const parseVariants = (raw) => {
  if (!raw) return [];
  try {
    const cleaned = typeof raw === 'string'
      ? raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      : raw;
    const parsed = typeof cleaned === 'string' ? JSON.parse(cleaned) : cleaned;
    return Array.isArray(parsed.variants)
      ? parsed.variants.filter((variant) => typeof variant === 'string' && variant.trim()).slice(0, 3)
      : [];
  } catch {
    return [];
  }
};

// Robust JSON parser — handles Groq preamble text and markdown fences
const parseGeneratedContent = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  
  // More aggressive cleaning attempts
  const attempts = [
    // Try direct parse first
    () => JSON.parse(raw.trim()),
    // Remove markdown fences
    () => JSON.parse(raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()),
    // Extract JSON object from text
    () => {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('No JSON object found');
    },
    // Try to find and parse any valid JSON substring
    () => {
      // Look for platform keys to identify valid content
      const platforms = ['twitter', 'linkedin', 'instagram', 'tiktok', 'youtube', 'facebook'];
      for (const platform of platforms) {
        const regex = new RegExp(`"${platform}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'i');
        const match = raw.match(regex);
        if (match) {
          // Found at least one platform, try to extract the whole JSON
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}') + 1;
          if (start !== -1 && end > start) {
            const jsonStr = raw.substring(start, end);
            return JSON.parse(jsonStr);
          }
        }
      }
      throw new Error('No platform content found');
    },
    // Last resort: try to construct from raw text if it contains platform mentions
    () => {
      const platforms = ['twitter', 'linkedin', 'instagram', 'tiktok', 'youtube', 'facebook'];
      const result = {};
      let foundAny = false;
      
      for (const platform of platforms) {
        const regex = new RegExp(`${platform}[^}]*?([^{}]*?)(?=${platforms.join('|')}|$)`, 'gi');
        const match = raw.match(regex);
        if (match && match[0]) {
          // Extract content after platform name
          const content = match[0].replace(new RegExp(`${platform}\\s*:\\s*`, 'i'), '').trim();
          if (content) {
            result[platform] = content.replace(/^["']|["']$/g, ''); // Remove quotes
            foundAny = true;
          }
        }
      }
      
      if (foundAny && Object.keys(result).length > 0) {
        return result;
      }
      throw new Error('Could not extract platform content');
    }
  ];
  
  for (const attempt of attempts) {
    try {
      const parsed = attempt();
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        // Validate that we have at least some platform content
        const platforms = ['twitter', 'linkedin', 'instagram', 'tiktok', 'youtube', 'facebook'];
        const hasPlatformContent = platforms.some(p => parsed[p] && typeof parsed[p] === 'string' && parsed[p].trim().length > 0);
        if (hasPlatformContent) {
          return parsed;
        }
      }
    } catch (e) {
      // Continue to next attempt
      continue;
    }
  }
  
  return null;
};

function ContentGenerator() {
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const { currentUser }                   = useAuth();
  const { workspaceId }                   = useParams();
  const [brandProfile, setBrandProfile]   = useState(null);
  const [brandLoading, setBrandLoading]   = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [posting, setPosting]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');

  const [formData, setFormData] = useState({
    prompt: '', contentType: 'social-post', platform: 'instagram', includeResearch: false,
  });

  const [uploadedFile,   setUploadedFile]   = useState(null);
  const [filePreview,    setFilePreview]    = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive,     setDragActive]     = useState(false);
  const [savedImageUrl,  setSavedImageUrl]  = useState(null);

  const [rawContent,     setRawContent]     = useState('');
  const [researchInsights, setResearchInsights] = useState('');
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [editorContent, setEditorContent] = useState('');

  // Selected accounts to post to
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [postResults,      setPostResults]      = useState([]);

  // Ref tracking to verify component state mounts safely across concurrent async flows
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (!currentUser || !workspaceId) {
      setBrandLoading(false);
      return;
    }

    (async () => {
      try {
        setBrandLoading(true);
        const result = await getBrandProfile(workspaceId);
        if (!isMounted.current) return;
        if (!result.success) throw new Error(result.error || 'Unable to load brand profile');
        setBrandProfile(result.profile);
        if (!result.profile) setError('Complete your brand profile before generating brand-aware content.');
      } catch (err) {
        setError(err.message || 'Unable to load the active brand.');
      } finally {
        if (isMounted.current) setBrandLoading(false);
      }
    })();

    return () => {
      isMounted.current = false;
    };
  }, [currentUser, workspaceId]);

  useEffect(() => {
    if (!currentUser || !workspaceId) return;
    getConnectedAccounts(currentUser.uid, workspaceId).then((result) => {
      if (result?.success) setConnectedAccounts(result.accounts || []);
    }).catch((err) => console.error('Error fetching accounts:', err));
  }, [currentUser, workspaceId]);

  const handleChange   = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCheckbox = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked });

  const processFile = (file) => {
    const v = validateFile(file);
    if (!v.valid) { setError(v.error); return; }
    setUploadedFile(file); setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      if (isMounted.current) setFilePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => { if (e.target.files[0]) processFile(e.target.files[0]); };
  const removeFile = () => { setUploadedFile(null); setFilePreview(null); };
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  // Fetch recent posts from connected accounts to use as style examples
  const fetchRecentPosts = async () => {
    const examples = [];
    for (const account of connectedAccounts.slice(0, 3)) {
      try {
        if (account.platform === 'facebook') {
          const res = await fetch(
            `https://graph.facebook.com/v18.0/${account.accountId}/posts?fields=message&limit=5&access_token=${account.accessToken}`
          );
          const data = await res.json();
          if (data.data?.length) {
            examples.push({
              platform: 'facebook',
              posts: data.data.map(p => p.message).filter(Boolean).slice(0, 3),
            });
          }
        } else if (account.platform === 'instagram') {
          const res = await fetch(
            `https://graph.facebook.com/v18.0/${account.accountId}/media?fields=caption&limit=5&access_token=${account.accessToken}`
          );
          const data = await res.json();
          if (data.data?.length) {
            examples.push({
              platform: 'instagram',
              posts: data.data.map(p => p.caption).filter(Boolean).slice(0, 3),
            });
          }
        } else if (account.platform === 'twitter') {
          const res = await fetch(
            `https://api.twitter.com/2/users/${account.accountId}/tweets?max_results=5`,
            { headers: { Authorization: `Bearer ${account.accessToken}` } }
          );
          const data = await res.json();
          if (data.data?.length) {
            examples.push({
              platform: 'twitter',
              posts: data.data.map(t => t.text).slice(0, 3),
            });
          }
        }
      } catch (err) {
        console.warn(`Could not fetch ${account.platform} posts:`, err.message);
      }
    }
    return examples;
  };

  const handleGenerate = async () => {
    if (!workspaceId) { setError('No workspace is selected.'); return; }
    if (!brandProfile) { setError('Complete your brand profile before generating content.'); return; }
    if (!formData.prompt.trim()) { setError('Please enter what you want to create'); return; }
    setLoading(true); setError(''); setSuccess('');
    setRawContent('');
    setResearchInsights(''); setPostResults([]); setVariants([]);
    setSelectedVariant(null); setEditorContent('');

    try {
      // Fetch recent posts from connected accounts as style examples
      const recentPostExamples = await fetchRecentPosts();

      if (formData.includeResearch) {
        const research = await conductResearch(workspaceId, formData.prompt, brandProfile.industry || 'business');
        if (research && research.success && isMounted.current) {
          setResearchInsights(research.insights || '');
        }
      }

      const result = await generateContent(
        workspaceId,
        {
          prompt: formData.prompt,
          contentType: formData.contentType,
          platform: formData.contentType === 'social-post' ? formData.platform : null,
          brandProfile,
          recentPostExamples,
        }
      );

      if (!isMounted.current) return;

      if (result && result.success) {
        setRawContent(result.content || '');
        const generatedVariants = parseVariants(result.content);
        if (generatedVariants.length === 3) {
          setVariants(generatedVariants);
        } else {
          setError('Content was generated but the three variants could not be read. Please try again.');
        }
      } else {
        setError(result?.error || 'Failed to generate content.');
      }
    } catch (err) {
      if (isMounted.current) setError('Failed to generate content. Please try again.');
      console.error(err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const toggleAccount = (accountId) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]
    );
  };

  // Upload image if present, then post to selected platforms
  const handlePostNow = async () => {
    if (selectedAccounts.length === 0) { setError('Select at least one platform to post to'); return; }
    if (!editorContent.trim()) { setError('Choose and review a variant before posting.'); return; }

    setPosting(true); setError(''); setPostResults([]);

    try {
      let imageUrl = savedImageUrl;

      // Upload file if not already uploaded
      if (uploadedFile && !imageUrl) {
        setUploadProgress(50);
        const up = await uploadFile(uploadedFile, currentUser.uid, workspaceId);
        if (up && up.success) { 
          imageUrl = up.url; 
          setSavedImageUrl(imageUrl); 
          setUploadProgress(100); 
        } else {
          throw new Error('File upload failed');
        }
      }

      const accountsToPost = connectedAccounts.filter(a => selectedAccounts.includes(a.id) && a.platform === formData.platform);
      const platformContent = { [formData.platform]: editorContent };
      const results        = await postToMultiplePlatforms(accountsToPost, platformContent, imageUrl);

      if (!isMounted.current) return;
      setPostResults(results || []);
      const allOk = results && results.every(r => r.success);
      setSuccess(allOk ? '✅ Posted successfully to all platforms!' : '⚠️ Posted with some errors. See results below.');
    } catch (err) {
      if (isMounted.current) setError('Failed to post content: ' + err.message);
    } finally {
      if (isMounted.current) {
        setPosting(false); 
        setUploadProgress(0);
      }
    }
  };

  const handleSave = async () => {
    if (selectedVariant === null || !editorContent.trim()) { setError('Choose a variant before saving.'); return; }
    setLoading(true); setError('');
    try {
      let imageUrl = savedImageUrl;
      if (uploadedFile && !imageUrl) {
        setUploadProgress(50);
        const up = await uploadFile(uploadedFile, currentUser.uid, workspaceId);
        if (up && up.success) { 
          imageUrl = up.url; 
          setSavedImageUrl(imageUrl); 
          setUploadProgress(100); 
        } else {
          throw new Error('File upload failed');
        }
      }
      const saveResult = await saveContent({
        userId: currentUser.uid,
        workspaceId,
        businessId: workspaceId,
        prompt: formData.prompt,
        contentType: formData.contentType,
        platform: formData.contentType === 'social-post' ? formData.platform : null,
        brandProfileVersion: brandProfile.updatedAt || null,
        variants,
        selectedVariant: editorContent,
        selectedVariantIndex: selectedVariant,
        content: editorContent,
        imageUrl, researchInsights: researchInsights || null,
      });
      if (saveResult && saveResult.success && isMounted.current) {
        setSuccess('Content saved! View it in Content History.');
        setTimeout(() => { 
          if (isMounted.current) {
            setSuccess(''); 
            resetForm(); 
          }
        }, 3000);
      }
    } catch (err) {
      if (isMounted.current) setError('Failed to save content.');
    } finally {
      if (isMounted.current) {
        setLoading(false); 
        setUploadProgress(0);
      }
    }
  };

  const resetForm = () => {
    setFormData(prev => ({ ...prev, prompt: '', includeResearch: false }));
    setRawContent('');
    setVariants([]); setSelectedVariant(null); setEditorContent('');
    setResearchInsights(''); setSavedImageUrl(null); setPostResults([]);
    setSelectedAccounts([]); removeFile(); setError(''); setSuccess('');
  };

  const useVariant = (variant, index) => {
    setSelectedVariant(index);
    setEditorContent(variant);
    setError('');
  };

  const hasOutput = variants.length > 0 || editorContent;

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">
          <div className="page-header">
            <div>
              <h1><Sparkles size={28} style={{ display: 'inline', marginRight: 10 }} />Generate Content</h1>
              <p>Create AI-powered marketing content for your business</p>
            </div>
          </div>

          {brandLoading ? (
            <div className="brand-context-card">Loading active brand profile...</div>
          ) : brandProfile && (
            <div className="brand-context-card">
              <span>Active brand</span>
              <strong>{brandProfile.businessName || 'Unnamed brand'}</strong>
              <span className="brand-tone-badge">{brandProfile.tone || 'Default tone'}</span>
            </div>
          )}

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="generator-container">

            {/* ── LEFT: Input ── */}
            <div className="generator-section">
              <h3>Content Details</h3>

              <div className="form-group">
                <label>Content Type</label>
                <select name="contentType" value={formData.contentType} onChange={handleChange}>
                  {CONTENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>

              {formData.contentType === 'social-post' && (
                <div className="form-group">
                  <label>Platform</label>
                  <select name="platform" value={formData.platform} onChange={handleChange}>
                    {SOCIAL_PLATFORMS.map((platform) => <option key={platform.key} value={platform.key}>{platform.label}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>What do you want to create?</label>
                <textarea name="prompt" value={formData.prompt} onChange={handleChange}
                  placeholder="E.g., A post about our new product launch..." rows="4" />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" name="includeResearch" checked={formData.includeResearch} onChange={handleCheckbox} />
                  <span>Include market research insights</span>
                </label>
              </div>

              <div className="form-group">
                <label>Add Image/Video (Optional)</label>
                {!uploadedFile ? (
                  <div className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput').click()}>
                    <Upload size={32} />
                    <p>Drag & drop or click to upload</p>
                    <span>JPG, PNG, GIF, MP4 (max 10MB images, 50MB videos)</span>
                    <input id="fileInput" type="file" accept="image/*,video/mp4" onChange={handleFileSelect} style={{ display: 'none' }} />
                  </div>
                ) : (
                  <div className="file-preview">
                    {uploadedFile.type.startsWith('image/') ? <img src={filePreview} alt="Preview" /> : <video src={filePreview} controls />}
                    <button className="remove-file" onClick={removeFile}><X size={20} /></button>
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
                )}
              </div>

              <button className="btn-generate" onClick={handleGenerate} disabled={loading || brandLoading || !brandProfile}>
                {loading ? <><Loader className="spinner" size={20} /> Generating...</> : <><Sparkles size={20} /> Generate Content</>}
              </button>
            </div>

            {/* ── RIGHT: Output ── */}
            {hasOutput && (
              <div className="generator-section">
                <h3>Generated Content</h3>

                {researchInsights && (
                  <details className="research-box" open>
                    <summary><strong>Market Research Insights</strong></summary>
                    <p style={{ marginTop: 8 }}>{researchInsights}</p>
                  </details>
                )}

                <div className="variant-grid">
                  {variants.map((variant, index) => (
                    <article key={index} className={`variant-card ${selectedVariant === index ? 'selected' : ''}`}>
                      <div className="variant-card-header"><strong>Variant {index + 1}</strong>{selectedVariant === index && <span>Selected</span>}</div>
                      <p>{variant}</p>
                      <button className="btn-secondary" onClick={() => useVariant(variant, index)}>Use This</button>
                    </article>
                  ))}
                </div>
                {selectedVariant !== null && (
                  <div className="content-output">
                    <label htmlFor="content-editor"><strong>Final review</strong></label>
                    <textarea id="content-editor" value={editorContent} onChange={(e) => setEditorContent(e.target.value)} rows="12" />
                    <div className="platform-content-header">
                      <span className="char-count">{editorContent.length} characters</span>
                      <button className="btn-copy" onClick={() => navigator.clipboard.writeText(editorContent)}><Copy size={15} /> Copy</button>
                    </div>
                  </div>
                )}

                {/* ── Post Now section ── */}
                {formData.contentType === 'social-post' && connectedAccounts.some(account => account.platform === formData.platform) && (
                  <div className="post-now-section">
                    <h4>Post Now</h4>
                    <p className="post-now-hint">Select accounts to post to immediately:</p>
                    <div className="account-checkboxes">
                      {connectedAccounts.filter(account => account.platform === formData.platform).map(account => (
                        <label key={account.id} className="account-checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedAccounts.includes(account.id)}
                            onChange={() => toggleAccount(account.id)}
                          />
                          <span className="account-platform-icon">
                            {PLATFORMS.find(p => p.key === account.platform)?.icon || '🔗'}
                          </span>
                          <span>{account.platform.toUpperCase()} — {account.accountName}</span>
                        </label>
                      ))}
                    </div>
                    <button className="btn-post-now" onClick={handlePostNow} disabled={posting || selectedAccounts.length === 0 || !editorContent}>
                      {posting ? <><Loader className="spinner" size={18} /> Posting...</> : <><Send size={18} /> Post Now</>}
                    </button>
                  </div>
                )}

                {formData.contentType === 'social-post' && !connectedAccounts.some(account => account.platform === formData.platform) && (
                  <p className="no-accounts-hint">
                    <Link to={workspaceId ? `/app/${workspaceId}/social` : '/app'}>Connect social accounts</Link> to post directly from here.
                  </p>
                )}

                {/* Post results */}
                {postResults.length > 0 && (
                  <div className="post-results">
                    {postResults.map((r, i) => (
                      <div key={i} className={`post-result ${r.success ? 'success' : 'error'}`}>
                        {r.success ? '✅' : '❌'} {r.platform} — {r.accountName}: {r.success ? 'Posted!' : r.error}
                      </div>
                    ))}
                  </div>
                )}

                <div className="output-actions">
                  <button className="btn-secondary" onClick={resetForm}>Clear</button>
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
