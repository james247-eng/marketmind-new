import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader, Send } from 'lucide-react';
import { getBrandProfile } from '../../services/brandService.js';
import { createLead } from '../../services/leadService.js';
import './LeadCapturePage.css';

const initialForm = { name: '', email: '', phone: '', interest: '' };

function LeadCapturePage() {
  const { workspaceId } = useParams(); const [brand, setBrand] = useState(null); const [brandLoading, setBrandLoading] = useState(true); const [form, setForm] = useState(initialForm); const [submitting, setSubmitting] = useState(false); const [submitted, setSubmitted] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (!workspaceId) return; getBrandProfile(workspaceId).then((result) => { if (result.success) setBrand(result.profile); }).finally(() => setBrandLoading(false)); }, [workspaceId]);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); setError(''); if (!form.name.trim() || !form.email.trim()) { setError('Please enter your name and email address.'); return; } setSubmitting(true); const result = await createLead(workspaceId, { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null, interest: form.interest.trim(), source: 'capture-page', status: 'new', score: 5 }); setSubmitting(false); if (result.success) { setSubmitted(true); setForm(initialForm); } else setError(result.error || 'Your details could not be submitted. Please try again.'); };
  const primary = brand?.primaryColor || '#6d28d9'; const secondary = brand?.secondaryColor || '#ede9fe'; const businessName = brand?.businessName || 'Teamly AI Business';
  return <main className="capture-page" style={{ '--capture-primary': primary, '--capture-secondary': secondary }}><div className="capture-glow capture-glow-one" /><div className="capture-glow capture-glow-two" /><section className="capture-card">
    <header className="capture-brand">{brand?.logoUrl ? <img src={brand.logoUrl} alt={`${businessName} logo`} /> : <span>{businessName.charAt(0).toUpperCase()}</span>}<div><small>Connect with</small><h1>{brandLoading ? 'Loading...' : businessName}</h1></div></header>
    {submitted ? <div className="capture-thanks"><CheckCircle2 size={54} /><h2>Thank you for reaching out!</h2><p>Your details have been received. {businessName} will be in touch soon.</p></div> : <><div className="capture-intro"><h2>Let’s start a conversation</h2><p>Tell us a little about what you need and we’ll get back to you.</p></div>{error && <div className="capture-error"><AlertCircle size={17} />{error}</div>}<form onSubmit={submit}><label>Full name <span>*</span><input name="name" value={form.name} onChange={change} required autoComplete="name" placeholder="Your full name" /></label><label>Email address <span>*</span><input type="email" name="email" value={form.email} onChange={change} required autoComplete="email" placeholder="you@example.com" /></label><label>Phone number <small>Optional</small><input type="tel" name="phone" value={form.phone} onChange={change} autoComplete="tel" placeholder="Your phone number" /></label><label>What are you interested in?<textarea name="interest" value={form.interest} onChange={change} rows="5" placeholder="Tell us how we can help..." /></label><button type="submit" disabled={submitting}>{submitting ? <><Loader size={18} className="capture-spin" />Submitting...</> : <><Send size={18} />Submit details</>}</button></form></>}
    <footer>Powered by Teamly AI</footer>
  </section></main>;
}
export default LeadCapturePage;
