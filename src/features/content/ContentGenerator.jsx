// ContentGenerator.jsx
// AI-powered content generation with per-platform display

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { generateContent, conductResearch } from '../../services/aiService';
import { uploadFile, validateFile } from '../../services/storageService';
import { saveContent } from '../../services/contentService';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Sparkles, Upload, X, Loader, Copy, CheckCircle } from 'lucide-react';
import './ContentGenerator.css';

// Platform display config — order controls tab order
const PLATFORMS = [
  { key: 'twitter',   label: 'Twitter/X',  icon: '🐦', charLimit: 280  },
  { key: 'linkedin',  label: 'LinkedIn',   icon: '💼', charLimit: 3000 },
  { key: 'instagram', label: 'Instagram',  icon: '📷', charLimit: 2200 },
  { key: 'tiktok',    label: 'TikTok',     icon: '🎵', charLimit: 2200 },
  { key: 'youtube',   label: 'YouTube',    icon: '▶️', charLimit: 5000 },
];

// Safely parse the JSON string Gemini returns.
// Returns an object with platform keys, or null if parsing fails.
const parseGeneratedContent = (raw) => {
  if (!raw) return null;
  try {
    // Strip markdown code fences Gemini sometimes adds
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);
    // Make sure at least one expected key exists
    if (PLATFORMS.some(p => parsed[p.key])) return parsed;
    return null;
  } catch {
    return null;
  }
};

function ContentGenerator() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser }               = useAuth();
  const [businesses, setBusinesses]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const [formData, setFormData] = useState({
    businessId:      '',
    prompt:          '',
    tone:            'professional',
    includeResearch: false,
  });

  const [uploadedFile,    setUploadedFile]    = useState(null);
  const [filePreview,     setFilePreview]     = useState(null);
  const [uploadProgress,  setUploadProgress]  = useState(0);
  const [dragActive,      setDragActive]      = useState(false);

  // Raw JSON string from Gemini
  const [rawContent,       setRawContent]       = useState('');
  // Parsed { twitter, linkedin, instagram, tiktok, youtube }
  const [parsedContent,    setParsedContent]    = useState(null);
  // Which platform tab is active in the output section
  const [activeTab,        setActiveTab]        = useState('twitter');
  // Per-platform edited text (user can tweak before saving)
  const [editedContent,    setEditedContent]    = useState({});
  // Which platform copy button just fired
  const [copiedPlatform,   setCopiedPlatform]   = useState(null);

  const [researchInsights, setResearchInsights] = useState('');

  // ─── Fetch businesses ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'businesses'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBusinesses(list);
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, businessId: list[0].id }));
        }
      } catch (err) {
        console.error('Error fetching businesses:', err);
      }
    })();
  }, [currentUser]);

  // ─── Form handlers ──────────────────────────────────────────────────────────

  const handleChange   = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCheckbox = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked });

  // ─── File handlers ──────────────────────────────────────────────────────────

  const processFile = (file) => {
    const v = validateFile(file);
    if (!v.valid) { setError(v.error); return; }
    setUploadedFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => { if (e.target.files[0]) processFile(e.target.files[0]); };
  const removeFile       = ()  => { setUploadedFile(null); setFilePreview(null); };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  // ─── Generate ───────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!formData.businessId) { setError('Please select a business'); return; }
    if (!formData.prompt.trim()) { setError('Please enter what you want to create'); return; }

    setLoading(true);
    setError('');
    setSuccess('');
    setRawContent('');
    setParsedContent(null);
    setEditedContent({});
    setResearchInsights('');

    try {
      const biz             = businesses.find(b => b.id === formData.businessId);
      const businessContext = `Business: ${biz.name}, Industry: ${biz.niche}, Target: ${biz.targetAudience || 'general audience'}`;

      // Optional research
      if (formData.includeResearch) {
        const research = await conductResearch(formData.prompt, biz.niche);
        if (research.success) setResearchInsights(research.insights);
      }

      // Generate content
      const result = await generateContent(formData.prompt, formData.tone, businessContext);

      if (result.success) {
        setRawContent(result.content);

        const parsed = parseGeneratedContent(result.content);
        if (parsed) {
          setParsedContent(parsed);
          // Seed editedContent with Gemini's output so user can tweak
          const initial = {};
          PLATFORMS.forEach(p => { initial[p.key] = parsed[p.key] || ''; });
          setEditedContent(initial);
          setActiveTab('twitter');
        } else {
          // Gemini didn't return valid JSON — show raw in a fallback textarea
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

  // ─── Copy platform content ──────────────────────────────────────────────────

  const handleCopy = async (platformKey) => {
    const text = editedContent[platformKey] || '';
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlatform(platformKey);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch {
      setError('Failed to copy to clipboard.');
    }
  };

  // ─── Save ────────────────────────────────────────────────────────────────────
  // Saves the full edited content object as a JSON string so ContentHistory
  // can display it per-platform too.

  const handleSave = async () => {
    if (!parsedContent && !rawContent) { setError('No content to save'); return; }

    setLoading(true);
    setError('');

    try {
      let imageUrl = null;

      if (uploadedFile) {
        setUploadProgress(50);
        const up = await uploadFile(uploadedFile, currentUser.uid, formData.businessId);
        if (up.success) { imageUrl = up.url; setUploadProgress(100); }
        else throw new Error('File upload failed');
      }

      // Save the edited per-platform content (or raw if parsing failed)
      const contentToSave = parsedContent
        ? JSON.stringify(editedContent)
        : rawContent;

      const saveResult = await saveContent({
        userId:           currentUser.uid,
        businessId:       formData.businessId,
        prompt:           formData.prompt,
        tone:             formData.tone,
        content:          contentToSave,
        imageUrl,
        researchInsights: researchInsights || null,
      });

      if (saveResult.success) {
        setSuccess('Content saved! View it in Content History.');
        setTimeout(() => { setSuccess(''); resetForm(); }, 3000);
      }
    } catch (err) {
      setError('Failed to save content. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // ─── Reset ───────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData(prev => ({ ...prev, prompt: '', includeResearch: false }));
    setRawContent('');
    setParsedContent(null);
    setEditedContent({});
    setResearchInsights('');
    removeFile();
    setError('');
    setSuccess('');
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const hasOutput = parsedContent || rawContent;

  const charCount     = (key) => (editedContent[key] || '').length;
  const isOverLimit   = (key) => {
    const p = PLATFORMS.find(p => p.key === key);
    return p ? charCount(key) > p.charLimit : false;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">

          <div className="page-header">
            <div>
              <h1>
                <Sparkles size={28} style={{ display: 'inline', marginRight: 10 }} />
                Generate Content
              </h1>
              <p>Create AI-powered marketing content for your business</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="generator-container">

            {/* ── LEFT: Input form ── */}
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
                  {businesses.length === 0
                    ? <option>No businesses found</option>
                    : businesses.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                </select>
              </div>

              <div className="form-group">
                <label>What do you want to create?</label>
                <textarea
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleChange}
                  placeholder="E.g., A post about our new product launch, announcing a special discount..."
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

              {/* File upload */}
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
                    <span>JPG, PNG, GIF, MP4 (max 10MB images, 50MB videos)</span>
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
                    {uploadedFile.type.startsWith('image/')
                      ? <img src={filePreview} alt="Preview" />
                      : <video src={filePreview} controls />}
                    <button className="remove-file" onClick={removeFile}>
                      <X size={20} />
                    </button>
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>

              <button
                className="btn-generate"
                onClick={handleGenerate}
                disabled={loading || businesses.length === 0}
              >
                {loading
                  ? <><Loader className="spinner" size={20} /> Generating...</>
                  : <><Sparkles size={20} /> Generate Content</>}
              </button>
            </div>

            {/* ── RIGHT: Output ── */}
            {hasOutput && (
              <div className="generator-section">
                <h3>Generated Content</h3>

                {/* Research insights */}
                {researchInsights && (
                  <details className="research-box" open>
                    <summary><strong>Market Research Insights</strong></summary>
                    <p style={{ marginTop: 8 }}>{researchInsights}</p>
                  </details>
                )}

                {/* Per-platform tabs */}
                {parsedContent ? (
                  <>
                    <div className="platform-tabs">
                      {PLATFORMS.map(p => (
                        <button
                          key={p.key}
                          className={`platform-tab ${activeTab === p.key ? 'active' : ''}`}
                          onClick={() => setActiveTab(p.key)}
                        >
                          {p.icon} {p.label}
                        </button>
                      ))}
                    </div>

                    {PLATFORMS.map(p => activeTab === p.key && (
                      <div key={p.key} className="platform-content">
                        <div className="platform-content-header">
                          <span className={`char-count ${isOverLimit(p.key) ? 'over-limit' : ''}`}>
                            {charCount(p.key)} / {p.charLimit} chars
                          </span>
                          <button
                            className="btn-copy"
                            onClick={() => handleCopy(p.key)}
                            title="Copy to clipboard"
                          >
                            {copiedPlatform === p.key
                              ? <><CheckCircle size={15} /> Copied!</>
                              : <><Copy size={15} /> Copy</>}
                          </button>
                        </div>
                        <textarea
                          className={`platform-textarea ${isOverLimit(p.key) ? 'over-limit' : ''}`}
                          value={editedContent[p.key] || ''}
                          onChange={(e) =>
                            setEditedContent(prev => ({ ...prev, [p.key]: e.target.value }))
                          }
                          rows="8"
                          placeholder={`${p.label} content will appear here...`}
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  /* Fallback: Gemini didn't return valid JSON */
                  <div className="content-output">
                    <textarea
                      value={rawContent}
                      onChange={(e) => setRawContent(e.target.value)}
                      rows="12"
                      placeholder="Generated content..."
                    />
                  </div>
                )}

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