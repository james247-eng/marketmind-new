// ContentGenerator.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { generateContent, conductResearch } from '../services/aiService';
import { uploadFile, validateFile } from '../services/storageService';
import { saveContent } from '../services/contentService';
import { getConnectedAccounts, postToMultiplePlatforms } from '../services/socialMediaService';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Sparkles, Upload, X, Loader, Copy, CheckCircle, Send } from 'lucide-react';
import './ContentGenerator.css';

const PLATFORMS = [
  { key: 'twitter',   label: 'Twitter/X',  icon: '🐦', charLimit: 280  },
  { key: 'linkedin',  label: 'LinkedIn',   icon: '💼', charLimit: 3000 },
  { key: 'instagram', label: 'Instagram',  icon: '📷', charLimit: 2200 },
  { key: 'tiktok',    label: 'TikTok',     icon: '🎵', charLimit: 2200 },
  { key: 'youtube',   label: 'YouTube',    icon: '▶️', charLimit: 5000 },
  { key: 'facebook',  label: 'Facebook',   icon: '📘', charLimit: 63206 },
];

// Robust JSON parser — handles Groq preamble text and markdown fences
const parseGeneratedContent = (raw) => {
  if (!raw) return null;
  const attempts = [
    () => raw.trim(),
    () => raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim(),
    () => { const m = raw.match(/\{[\s\S]*\}/); return m ? m[0] : null; },
  ];
  for (const attempt of attempts) {
    try {
      const cleaned = attempt();
      if (!cleaned) continue;
      const parsed = JSON.parse(cleaned);
      if (PLATFORMS.some(p => parsed[p.key])) return parsed;
    } catch { continue; }
  }
  return null;
};

function ContentGenerator() {
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const { currentUser }                   = useAuth();
  const [businesses, setBusinesses]       = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [posting, setPosting]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');

  const [formData, setFormData] = useState({
    businessId: '', prompt: '', tone: 'professional', includeResearch: false,
  });

  const [uploadedFile,   setUploadedFile]   = useState(null);
  const [filePreview,    setFilePreview]    = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive,     setDragActive]     = useState(false);
  const [savedImageUrl,  setSavedImageUrl]  = useState(null);

  const [rawContent,     setRawContent]     = useState('');
  const [parsedContent,  setParsedContent]  = useState(null);
  const [activeTab,      setActiveTab]      = useState('twitter');
  const [editedContent,  setEditedContent]  = useState({});
  const [copiedPlatform, setCopiedPlatform] = useState(null);
  const [researchInsights, setResearchInsights] = useState('');

  // Selected accounts to post to
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [postResults,      setPostResults]      = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    // Fetch businesses
    (async () => {
      try {
        const q = query(collection(db, 'businesses'), where('userId', '==', currentUser.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBusinesses(list);
        if (list.length > 0) setFormData(prev => ({ ...prev, businessId: list[0].id }));
      } catch (err) { console.error('Error fetching businesses:', err); }
    })();
    // Fetch connected social accounts
    (async () => {
      try {
        const result = await getConnectedAccounts(currentUser.uid);
        if (result.success) setConnectedAccounts(result.accounts);
      } catch (err) { console.error('Error fetching accounts:', err); }
    })();
  }, [currentUser]);

  const handleChange   = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCheckbox = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked });

  const processFile = (file) => {
    const v = validateFile(file);
    if (!v.valid) { setError(v.error); return; }
    setUploadedFile(file); setError('');
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target.result);
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

  const handleGenerate = async () => {
    if (!formData.businessId) { setError('Please select a business'); return; }
    if (!formData.prompt.trim()) { setError('Please enter what you want to create'); return; }
    setLoading(true); setError(''); setSuccess('');
    setRawContent(''); setParsedContent(null); setEditedContent({});
    setResearchInsights(''); setPostResults([]);

    try {
      const biz = businesses.find(b => b.id === formData.businessId);
      const businessContext = `Business: ${biz.name}, Industry: ${biz.niche}, Target: ${biz.targetAudience || 'general audience'}`;

      if (formData.includeResearch) {
        const research = await conductResearch(formData.prompt, biz.niche);
        if (research.success) setResearchInsights(research.insights);
      }

      const result = await generateContent(formData.prompt, formData.tone, businessContext);

      if (result.success) {
        setRawContent(result.content);
        const parsed = parseGeneratedContent(result.content);
        if (parsed) {
          // Add facebook copy from twitter if not present
          if (!parsed.facebook && parsed.twitter) parsed.facebook = parsed.twitter;
          setParsedContent(parsed);
          const initial = {};
          PLATFORMS.forEach(p => { initial[p.key] = parsed[p.key] || ''; });
          setEditedContent(initial);
          setActiveTab('twitter');
        } else {
          setError('Content generated but could not be split by platform. Edit below.');
        }
      } else {
        setError(result.error || 'Failed to generate content.');
      }
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (platformKey) => {
    try {
      await navigator.clipboard.writeText(editedContent[platformKey] || '');
      setCopiedPlatform(platformKey);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch { setError('Failed to copy.'); }
  };

  const toggleAccount = (accountId) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]
    );
  };

  // Upload image if present, then post to selected platforms
  const handlePostNow = async () => {
    if (selectedAccounts.length === 0) { setError('Select at least one platform to post to'); return; }
    if (!parsedContent && !rawContent) { setError('No content to post'); return; }

    setPosting(true); setError(''); setPostResults([]);

    try {
      let imageUrl = savedImageUrl;

      // Upload file if not already uploaded
      if (uploadedFile && !imageUrl) {
        setUploadProgress(50);
        const up = await uploadFile(uploadedFile, currentUser.uid, formData.businessId);
        if (up.success) { imageUrl = up.url; setSavedImageUrl(imageUrl); setUploadProgress(100); }
        else throw new Error('File upload failed');
      }

      const accountsToPost = connectedAccounts.filter(a => selectedAccounts.includes(a.id));
      const contentToPost  = parsedContent ? editedContent : rawContent;
      const results        = await postToMultiplePlatforms(accountsToPost, contentToPost, imageUrl);

      setPostResults(results);
      const allOk = results.every(r => r.success);
      setSuccess(allOk ? '✅ Posted successfully to all platforms!' : '⚠️ Posted with some errors. See results below.');
    } catch (err) {
      setError('Failed to post content: ' + err.message);
    } finally {
      setPosting(false); setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!parsedContent && !rawContent) { setError('No content to save'); return; }
    setLoading(true); setError('');
    try {
      let imageUrl = savedImageUrl;
      if (uploadedFile && !imageUrl) {
        setUploadProgress(50);
        const up = await uploadFile(uploadedFile, currentUser.uid, formData.businessId);
        if (up.success) { imageUrl = up.url; setSavedImageUrl(imageUrl); setUploadProgress(100); }
        else throw new Error('File upload failed');
      }
      const saveResult = await saveContent({
        userId: currentUser.uid, businessId: formData.businessId,
        prompt: formData.prompt, tone: formData.tone,
        content: parsedContent ? JSON.stringify(editedContent) : rawContent,
        imageUrl, researchInsights: researchInsights || null,
      });
      if (saveResult.success) {
        setSuccess('Content saved! View it in Content History.');
        setTimeout(() => { setSuccess(''); resetForm(); }, 3000);
      }
    } catch (err) {
      setError('Failed to save content.');
    } finally {
      setLoading(false); setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData(prev => ({ ...prev, prompt: '', includeResearch: false }));
    setRawContent(''); setParsedContent(null); setEditedContent({});
    setResearchInsights(''); setSavedImageUrl(null); setPostResults([]);
    setSelectedAccounts([]); removeFile(); setError(''); setSuccess('');
  };

  const hasOutput = parsedContent || rawContent;
  const charCount   = (key) => (editedContent[key] || '').length;
  const isOverLimit = (key) => { const p = PLATFORMS.find(p => p.key === key); return p ? charCount(key) > p.charLimit : false; };

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

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="generator-container">

            {/* ── LEFT: Input ── */}
            <div className="generator-section">
              <h3>Content Details</h3>

              <div className="form-group">
                <label>Select Business</label>
                <select name="businessId" value={formData.businessId} onChange={handleChange} disabled={businesses.length === 0}>
                  {businesses.length === 0
                    ? <option>No businesses found</option>
                    : businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>What do you want to create?</label>
                <textarea name="prompt" value={formData.prompt} onChange={handleChange}
                  placeholder="E.g., A post about our new product launch..." rows="4" />
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

              <button className="btn-generate" onClick={handleGenerate} disabled={loading || businesses.length === 0}>
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

                {parsedContent ? (
                  <>
                    <div className="platform-tabs">
                      {PLATFORMS.map(p => (
                        <button key={p.key} className={`platform-tab ${activeTab === p.key ? 'active' : ''}`} onClick={() => setActiveTab(p.key)}>
                          {p.icon} {p.label}
                        </button>
                      ))}
                    </div>
                    {PLATFORMS.map(p => activeTab === p.key && (
                      <div key={p.key} className="platform-content">
                        <div className="platform-content-header">
                          <span className={`char-count ${isOverLimit(p.key) ? 'over-limit' : ''}`}>{charCount(p.key)} / {p.charLimit} chars</span>
                          <button className="btn-copy" onClick={() => handleCopy(p.key)}>
                            {copiedPlatform === p.key ? <><CheckCircle size={15} /> Copied!</> : <><Copy size={15} /> Copy</>}
                          </button>
                        </div>
                        <textarea
                          className={`platform-textarea ${isOverLimit(p.key) ? 'over-limit' : ''}`}
                          value={editedContent[p.key] || ''}
                          onChange={(e) => setEditedContent(prev => ({ ...prev, [p.key]: e.target.value }))}
                          rows="8"
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="content-output">
                    <textarea value={rawContent} onChange={(e) => setRawContent(e.target.value)} rows="12" />
                  </div>
                )}

                {/* ── Post Now section ── */}
                {connectedAccounts.length > 0 && (
                  <div className="post-now-section">
                    <h4>Post Now</h4>
                    <p className="post-now-hint">Select accounts to post to immediately:</p>
                    <div className="account-checkboxes">
                      {connectedAccounts.map(account => (
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
                    <button className="btn-post-now" onClick={handlePostNow} disabled={posting || selectedAccounts.length === 0}>
                      {posting ? <><Loader className="spinner" size={18} /> Posting...</> : <><Send size={18} /> Post Now</>}
                    </button>
                  </div>
                )}

                {connectedAccounts.length === 0 && (
                  <p className="no-accounts-hint">
                    <a href="/accounts">Connect social accounts</a> to post directly from here.
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