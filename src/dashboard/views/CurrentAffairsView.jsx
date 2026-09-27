// src/dashboard/views/CurrentAffairsView.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { firestoreDb } from '../../firebase/firestore/config';
import { db } from '../../db/dexieDb';
import styles from '../Dashboard.module.css';

const ADMIN_EMAIL = 'nishant53195@gmail.com';

const EMPTY_FORM = {
  title: '',
  source: '',
  subjectId: '',
  topicId: '',
};

export default function CurrentAffairsView({ user }) {
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectsList, setSubjectsList] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [recentArticles, setRecentArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const editorRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTaxonomy() {
      try {
        if (db.master_gs_subjects) {
          const list = await db.master_gs_subjects.toArray();
          if (isMounted) {
            setSubjectsList(
              list.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load taxonomy from Dexie:', err);
      }
    }
    loadTaxonomy();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchRecentArticles = async () => {
    setLoadingArticles(true);
    try {
      const q = query(
        collection(firestoreDb, 'master_current_affairs'),
        orderBy('createdAt', 'desc'),
        limit(25)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecentArticles(docs);
    } catch (err) {
      console.error('Error fetching articles from Firestore:', err);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    fetchRecentArticles();
  }, []);

  const availableTopics = useMemo(() => {
    const selected = subjectsList.find((s) => s.id === formData.subjectId);
    if (!selected?.topics) return [];
    return [...selected.topics].sort((a, b) => {
      const seqA = a.sequence ?? a.order ?? 0;
      const seqB = b.sequence ?? b.order ?? 0;
      return seqA - seqB;
    });
  }, [subjectsList, formData.subjectId]);

  const runCommand = (e, command, value = null) => {
    e.preventDefault(); // Prevents editor focus loss on mobile taps
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    const htmlBody = editorRef.current ? editorRef.current.innerHTML.trim() : '';

    if (!formData.title.trim()) {
      setFeedback({ type: 'error', text: 'Title is mandatory.' });
      return;
    }
    if (!htmlBody || htmlBody === '<br>' || htmlBody === '<div><br></div>') {
      setFeedback({ type: 'error', text: 'Article content cannot be empty.' });
      return;
    }
    if (!formData.subjectId) {
      setFeedback({ type: 'error', text: 'Please select a Subject.' });
      return;
    }

    if (!navigator.onLine) {
      setFeedback({
        type: 'error',
        text: 'No internet connection. Please try again when online.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        contentHtml: htmlBody,
        source: formData.source.trim() || 'The Hindu / PIB / Express',
        subjectId: formData.subjectId,
        topicId: formData.topicId || null,
        authorEmail: user?.email || '',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(firestoreDb, 'master_current_affairs'), payload);

      setFeedback({ type: 'success', text: 'Current Affairs article published to Firestore!' });

      setTimeout(() => {
        setFormData(EMPTY_FORM);
        if (editorRef.current) editorRef.current.innerHTML = '';
        setIsModalOpen(false);
        setFeedback({ type: '', text: '' });
        fetchRecentArticles();
      }, 1000);
    } catch (err) {
      console.error('Error saving current affairs:', err);
      setFeedback({
        type: 'error',
        text: 'Failed to write to Firestore. Verify internet and permissions.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={styles.workspaceScroll}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: '1rem 0.5rem 3rem 0.5rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Explicit scoped CSS to force lists to show bullets, numbers, and indentation */}
      <style>{`
        .ca-rich-content ul {
          list-style-type: disc !important;
          margin: 0.6rem 0 !important;
          padding-left: 1.6rem !important;
        }
        .ca-rich-content ol {
          list-style-type: decimal !important;
          margin: 0.6rem 0 !important;
          padding-left: 1.6rem !important;
        }
        .ca-rich-content ul ul {
          list-style-type: circle !important;
          margin: 0.3rem 0 !important;
          padding-left: 1.4rem !important;
        }
        .ca-rich-content ol ol {
          list-style-type: lower-alpha !important;
          margin: 0.3rem 0 !important;
          padding-left: 1.4rem !important;
        }
        .ca-rich-content li {
          display: list-item !important;
          margin-bottom: 0.35rem !important;
          line-height: 1.55 !important;
        }
        .ca-rich-content blockquote {
          border-left: 3px solid #3b82f6 !important;
          margin: 0.6rem 0 !important;
          padding-left: 0.9rem !important;
          color: #94a3b8 !important;
          font-style: italic !important;
        }
        .ca-rich-content h3 {
          font-size: 1.05rem !important;
          color: #60a5fa !important;
          margin: 0.8rem 0 0.4rem 0 !important;
        }
        .touch-toolbar-btn:active {
          transform: scale(0.95);
          background-color: #2563eb !important;
          color: #fff !important;
        }
      `}</style>

      <div style={{ maxWidth: '880px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Header Block */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h2 style={{ color: '#f8fafc', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.3rem 0' }}>
              Current Affairs Hub
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
              Curated daily developments, editorials, and syllabus-linked current affairs.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add Current Affairs
            </button>
          )}
        </div>

        {/* Feed List */}
        {loadingArticles ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Fetching latest current affairs from Firestore...
          </div>
        ) : recentArticles.length === 0 ? (
          <div
            style={{
              background: '#0f1523',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '16px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              color: '#94a3b8',
            }}
          >
            <h3 style={{ color: '#f8fafc', fontSize: '1.05rem', marginBottom: '0.4rem' }}>No Articles Yet</h3>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>
              Published current affairs will appear here linked with micro-syllabus tags.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentArticles.map((article) => (
              <article
                key={article.id}
                style={{
                  background: '#0f1523',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: 'rgba(37, 99, 235, 0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(37, 99, 235, 0.3)',
                        borderRadius: '16px',
                        padding: '0.2rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {article.subjectId}
                    </span>
                    {article.topicId && (
                      <span
                        style={{
                          background: 'rgba(139, 92, 246, 0.15)',
                          color: '#a78bfa',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '16px',
                          padding: '0.2rem 0.65rem',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                      >
                        {article.topicId}
                      </span>
                    )}
                  </div>

                  <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                    {new Date(article.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem', fontWeight: 800 }}>
                  {article.title}
                </h3>

                {/* Styled article body with lists */}
                <div
                  className="ca-rich-content"
                  style={{
                    color: '#cbd5e1',
                    fontSize: '0.86rem',
                    lineHeight: 1.6,
                  }}
                  dangerouslySetInnerHTML={{ __html: article.contentHtml }}
                />

                {article.source && (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.5rem' }}>
                    <span style={{ color: '#64748b', fontSize: '0.74rem' }}>
                      Source: <strong style={{ color: '#94a3b8' }}>{article.source}</strong>
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* Modal Dialog */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '760px',
                maxHeight: '94vh',
                backgroundColor: '#0c111d',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)',
              }}
            >
              {/* Modal Top Bar */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#0f1523',
                  flexShrink: 0,
                }}
              >
                <h3 style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  Publish Current Affairs
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '1.3rem',
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <div
                style={{
                  padding: '1.25rem 1rem',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxSizing: 'border-box',
                }}
              >
                {feedback.text && (
                  <div
                    style={{
                      padding: '0.65rem 0.9rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      background:
                        feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border:
                        feedback.type === 'error'
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : '1px solid rgba(16, 185, 129, 0.3)',
                      color: feedback.type === 'error' ? '#fca5a5' : '#6ee7b7',
                    }}
                  >
                    {feedback.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Title */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>
                      Title <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Monetary Policy Committee Holds Repo Rate at 6.5%"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#070a13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '0.75rem 0.85rem',
                        color: '#f8fafc',
                        fontSize: '0.84rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Taxonomy */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>
                        Subject <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        required
                        value={formData.subjectId}
                        onChange={(e) =>
                          setFormData({ ...formData, subjectId: e.target.value, topicId: '' })
                        }
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          background: '#070a13',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '0.75rem 0.85rem',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          outline: 'none',
                        }}
                      >
                        <option value="">Select Subject (from Dexie)</option>
                        {subjectsList.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} {sub.paper ? `(${sub.paper})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>Topic</label>
                      <select
                        value={formData.topicId}
                        disabled={!formData.subjectId}
                        onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          background: '#070a13',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '0.75rem 0.85rem',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          outline: 'none',
                          opacity: formData.subjectId ? 1 : 0.5,
                        }}
                      >
                        <option value="">Select Topic</option>
                        {availableTopics.map((top) => (
                          <option key={top.id} value={top.id}>
                            {top.name || top.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Rich Text Editor with Mobile-Friendly Touch Toolbar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>
                      Body (Rich Text) <span style={{ color: '#ef4444' }}>*</span>
                    </label>

                    {/* Touch-Friendly Toolbar (Scrollable on small screens) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        background: '#151c2e',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px',
                        padding: '8px',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                    >
                      {[
                        { label: 'B', cmd: 'bold', title: 'Bold', weight: 800 },
                        { label: 'I', cmd: 'italic', title: 'Italic', style: 'italic' },
                        { label: 'H3', cmd: 'formatBlock', val: '<h3>', title: 'Heading' },
                        { label: '• List', cmd: 'insertUnorderedList', title: 'Bullet List' },
                        { label: '1. List', cmd: 'insertOrderedList', title: 'Numbered List' },
                        { label: 'Indent →', cmd: 'indent', title: 'Nested List (Indent)' },
                        { label: '← Outdent', cmd: 'outdent', title: 'Outdent' },
                        { label: '“ Quote', cmd: 'formatBlock', val: '<blockquote>', title: 'Quote' },
                        { label: 'Clear', cmd: 'removeFormat', title: 'Remove Formatting' },
                      ].map((tool, i) => (
                        <button
                          key={i}
                          type="button"
                          className="touch-toolbar-btn"
                          title={tool.title}
                          onMouseDown={(e) => runCommand(e, tool.cmd, tool.val || null)}
                          style={{
                            flexShrink: 0,
                            minHeight: '38px',
                            minWidth: '42px',
                            padding: '0.45rem 0.85rem',
                            background: '#0c111d',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: tool.weight || 600,
                            fontStyle: tool.style || 'normal',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'manipulation',
                          }}
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>

                    {/* Contenteditable Canvas */}
                    <div
                      ref={editorRef}
                      contentEditable
                      className="ca-rich-content"
                      style={{
                        minHeight: '190px',
                        maxHeight: '290px',
                        overflowY: 'auto',
                        background: '#070a13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderTop: 'none',
                        borderBottomLeftRadius: '8px',
                        borderBottomRightRadius: '8px',
                        padding: '0.9rem',
                        color: '#f8fafc',
                        fontSize: '0.86rem',
                        lineHeight: 1.6,
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Source */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>Source / Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. The Hindu / PIB Delhi / Indian Express"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#070a13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '0.75rem 0.85rem',
                        color: '#f8fafc',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      marginTop: '0.4rem',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.85rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                      minHeight: '44px',
                    }}
                  >
                    {saving ? 'Publishing to Firestore...' : 'Publish Current Affairs →'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}