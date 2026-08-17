import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Bot, Loader, MessageSquarePlus, Send, Trash2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import { createThread, deleteThread, getAssistantContext, getThread, getThreads, requestAssistantResponse, updateThread } from '../../services/assistantService.js';
import './Assistant.css';

const SUGGESTIONS = ['Write a proposal for a new client', 'Help me price my services', 'Write a sales script for my product', 'Give me 10 content ideas for this week', 'How can I improve my social media strategy', 'Write a follow up email to a lead'];
const asDate = (value) => value?.toDate?.() || (value ? new Date(value) : null);
const formatTime = (value) => { const date = asDate(value); return date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''; };

const buildSystemPrompt = ({ brand, recentContent, stats }) => {
  const products = Array.isArray(brand.products) ? brand.products.map((item) => typeof item === 'string' ? item : item.name).filter(Boolean).join(', ') : 'Not specified';
  const recentTopics = recentContent.length ? recentContent.map((item) => `- ${String(item.prompt || item.content || 'Content item').slice(0, 140)}`).join('\n') : '- No recent content yet';
  return `You are a smart AI business assistant for ${brand.businessName || 'this business'}, a ${brand.industry || 'growing'} business.

Brand voice: ${brand.tone || 'professional'}, ${brand.languageStyle || 'conversational'}
Target audience: ${brand.audience || brand.targetAudience || 'general customers'}
Products/services: ${products}

Recent content performance:
- ${stats.generated} pieces of content generated
- ${stats.published} posts published
- ${stats.scheduled} posts scheduled
- ${stats.failed} posts failed

Recent content context:
${recentTopics}

You help the business owner with:
- Writing proposals, emails and documents
- Pricing and business strategy advice
- Sales scripts and pitch decks
- Content ideas and marketing strategy
- Understanding their analytics
- Any other business question they have

Always give practical, specific advice tailored to this business. Be conversational and direct.`;
};

function Assistant() {
  const { workspaceId } = useParams(); const bottomRef = useRef(null); const [sidebarOpen, setSidebarOpen] = useState(false); const [threads, setThreads] = useState([]); const [activeId, setActiveId] = useState(null); const [messages, setMessages] = useState([]); const [input, setInput] = useState(''); const [loading, setLoading] = useState(true); const [thinking, setThinking] = useState(false); const [error, setError] = useState('');
  const loadThreads = useCallback(async (selectFirst = false) => { const result = await getThreads(workspaceId); if (!result.success) { setError(result.error); return; } setThreads(result.threads); if (selectFirst && result.threads[0]) { setActiveId(result.threads[0].id); setMessages(result.threads[0].messages || []); } }, [workspaceId]);
  useEffect(() => { setLoading(true); loadThreads(true).finally(() => setLoading(false)); }, [loadThreads]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);
  const selectThread = async (id) => { setError(''); setActiveId(id); const result = await getThread(workspaceId, id); if (result.success) setMessages(result.thread.messages || []); else setError(result.error); };
  const newConversation = () => { setActiveId(null); setMessages([]); setInput(''); setError(''); };
  const removeThread = async (event, id) => { event.stopPropagation(); if (!confirm('Delete this conversation?')) return; const result = await deleteThread(workspaceId, id); if (!result.success) { setError(result.error); return; } if (activeId === id) newConversation(); await loadThreads(false); };
  const sendMessage = async () => {
    const text = input.trim(); if (!text || thinking) return; setInput(''); setError(''); const userMessage = { role: 'user', content: text, timestamp: new Date().toISOString() }; const nextMessages = [...messages, userMessage]; setMessages(nextMessages); setThinking(true);
    let threadId = activeId;
    if (!threadId) { const created = await createThread(workspaceId, text); if (!created.success) { setError(created.error); setThinking(false); return; } threadId = created.threadId; setActiveId(threadId); await loadThreads(false); } else { const saved = await updateThread(workspaceId, threadId, nextMessages); if (!saved.success) setError(saved.error); }
    try { const context = await getAssistantContext(workspaceId); const result = await requestAssistantResponse(buildSystemPrompt(context), nextMessages); if (!result.success) throw new Error(result.error); const assistantMessage = { role: 'assistant', content: result.response, timestamp: new Date().toISOString() }; const completed = [...nextMessages, assistantMessage]; setMessages(completed); const saved = await updateThread(workspaceId, threadId, completed); if (!saved.success) setError(saved.error); await loadThreads(false); } catch (sendError) { setError(sendError.message || 'The assistant could not respond.'); } finally { setThinking(false); }
  };
  const handleKey = (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } };
  return <div className="app"><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="main-content"><Header onMenuClick={() => setSidebarOpen(true)} /><div className="assistant-page">
    <aside className="thread-sidebar"><button className="new-thread" onClick={newConversation}><MessageSquarePlus size={17} />New conversation</button><div className="thread-list">{loading ? <div className="thread-loading"><Loader className="assistant-spin" size={18} />Loading...</div> : threads.length ? threads.map((thread) => { const date = asDate(thread.updatedAt); return <button key={thread.id} className={`thread-item ${activeId === thread.id ? 'active' : ''}`} onClick={() => selectThread(thread.id)}><span><strong>{thread.title || 'Conversation'}</strong><small>{date ? date.toLocaleDateString() : 'Recently'}</small></span><i role="button" tabIndex="0" title="Delete conversation" onClick={(event) => removeThread(event, thread.id)} onKeyDown={(event) => { if (event.key === 'Enter') removeThread(event, thread.id); }}><Trash2 size={14} /></i></button>; }) : <p className="no-threads">Your conversations will appear here.</p>}</div></aside>
    <section className="chat-area"><header className="chat-header"><span><Bot size={20} /></span><div><h1>AI Business Assistant</h1><p>Business advice grounded in your workspace context</p></div></header>{error && <div className="assistant-error"><AlertCircle size={17} />{error}</div>}<div className="message-scroll">{messages.length === 0 ? <div className="assistant-welcome"><span><Bot size={30} /></span><h2>What can I help you work through?</h2><p>Ask about strategy, sales, content, pricing, proposals, or any other business decision.</p><div className="prompt-chips">{SUGGESTIONS.map((prompt) => <button key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}</div></div> : messages.map((message, index) => <div className={`message-row ${message.role}`} key={`${message.timestamp}-${index}`}><div className="message-bubble"><p>{message.content}</p><time>{formatTime(message.timestamp)}</time></div></div>)}{thinking && <div className="message-row assistant"><div className="message-bubble thinking-bubble"><span /><span /><span /></div></div>}<div ref={bottomRef} /></div><div className="chat-input-wrap"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKey} rows="1" placeholder="Ask your business assistant..." disabled={thinking} /><button onClick={sendMessage} disabled={!input.trim() || thinking} title="Send message"><Send size={19} /></button></div></section>
  </div></main></div>;
}
export default Assistant;
