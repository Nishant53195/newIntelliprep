// src/dashboard/views/PrelimsPYQView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../db/dexieDb';
import { savePrelimsPYQDirect } from '../../services/pyqService';
import styles from '../Dashboard.module.css';

const ADMIN_EMAIL = 'nishant53195@gmail.com';

const EMPTY_FORM = {
  questionText: '',
  optA: '',
  optB: '',
  optC: '',
  optD: '',
  correctAnswerIndex: 0,
  year: new Date().getFullYear(),
  subjectId: '',
  topicId: '',
  subtopicId: '',
  explanation: '',
};

export default function PrelimsPYQView({ user }) {
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState('manual');

  const [subjectsList, setSubjectsList] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [rawJson, setRawJson] = useState('');
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkIndex, setBulkIndex] = useState(0);

  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  // Dexie se master subjects taxonomy load karein
  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const cached = await db.master_gs_subjects.toArray();
        setSubjectsList(cached);
      } catch (err) {
        console.error('Dexie taxonomy load error:', err);
      }
    }
    loadTaxonomy();
  }, []);

  const currentSubjectObj = useMemo(() => {
    return subjectsList.find((s) => s.id === formData.subjectId) || null;
  }, [subjectsList, formData.subjectId]);

  // Topics: sequence field ke mutabik ascending sort
  const availableTopics = useMemo(() => {
    if (!currentSubjectObj?.topics) return [];
    return [...currentSubjectObj.topics].sort((a, b) => {
      const seqA = a.sequence ?? a.order ?? a.index ?? 0;
      const seqB = b.sequence ?? b.order ?? b.index ?? 0;
      return seqA - seqB;
    });
  }, [currentSubjectObj]);

  const currentTopicObj = useMemo(() => {
    return availableTopics.find((t) => t.id === formData.topicId) || null;
  }, [availableTopics, formData.topicId]);

  // Subtopics: sequence field ke mutabik ascending sort
  const availableSubtopics = useMemo(() => {
    if (!currentTopicObj?.subtopics) return [];
    return [...currentTopicObj.subtopics].sort((a, b) => {
      const seqA = a.sequence ?? a.order ?? a.index ?? 0;
      const seqB = b.sequence ?? b.order ?? b.index ?? 0;
      return seqA - seqB;
    });
  }, [currentTopicObj]);

  const handleSubjectChange = (e) => {
    const sId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      subjectId: sId,
      topicId: '',
      subtopicId: '',
    }));
  };

  const handleTopicChange = (e) => {
    const tId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      topicId: tId,
      subtopicId: '',
    }));
  };

  // Bulk JSON Parser aur Form Hydration
  const handleLoadJson = () => {
    setFeedback({ type: '', text: '' });
    try {
      const parsed = JSON.parse(rawJson.trim());
      const questions = Array.isArray(parsed) ? parsed : [parsed];

      if (questions.length === 0) {
        setFeedback({ type: 'error', text: 'JSON array empty hai.' });
        return;
      }

      // Fields normalize karein taaki mapping miss na ho
      const normalizedQueue = questions.map((item) => {
        const opts = item.options || [];
        return {
          questionText: item.questionText || '',
          optA: opts[0] || '',
          optB: opts[1] || '',
          optC: opts[2] || '',
          optD: opts[3] || '',
          correctAnswerIndex: item.correctAnswerIndex ?? 0,
          explanation: item.explanation || '',
          year: item.year || new Date().getFullYear(),
          subjectId: item.subjectTag || item.subjectId || '',
          topicId: item.topicTag || item.topicId || '',
          subtopicId: item.subtopicTag || item.subtopicId || '',
        };
      });

      setBulkQueue(normalizedQueue);
      setBulkIndex(0);
      setFormData(normalizedQueue[0]);
      setFeedback({ type: 'success', text: `${normalizedQueue.length} questions load ho gaye.` });
    } catch (err) {
      setFeedback({ type: 'error', text: 'JSON format galat hai. Kripya syntax check karein.' });
    }
  };

  // Navigations se pehle active edits save karein
  const syncActiveQuestionToMemory = () => {
    if (!bulkQueue[bulkIndex]) return;
    const updated = [...bulkQueue];
    updated[bulkIndex] = { ...formData };
    setBulkQueue(updated);
  };

  const handlePrevQuestion = () => {
    if (bulkIndex > 0) {
      syncActiveQuestionToMemory();
      const prevIdx = bulkIndex - 1;
      setBulkIndex(prevIdx);
      setFormData(bulkQueue[prevIdx]);
    }
  };

  const handleNextQuestion = () => {
    if (bulkIndex < bulkQueue.length - 1) {
      syncActiveQuestionToMemory();
      const nextIdx = bulkIndex + 1;
      setBulkIndex(nextIdx);
      setFormData(bulkQueue[nextIdx]);
    }
  };

  // Question Submission (Direct Firestore + Count increment in Firestore & Dexie)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    if (!formData.questionText.trim()) {
      setFeedback({ type: 'error', text: 'Question text mandatory hai.' });
      return;
    }
    if (!formData.subjectId) {
      setFeedback({ type: 'error', text: 'Subject select karna zaroori hai.' });
      return;
    }

    setSaving(true);
    try {
      await savePrelimsPYQDirect({
        questionText: formData.questionText,
        options: [formData.optA, formData.optB, formData.optC, formData.optD],
        correctAnswerIndex: Number(formData.correctAnswerIndex),
        year: Number(formData.year),
        subjectId: formData.subjectId,
        topicId: formData.topicId,
        subtopicId: formData.subtopicId,
        explanation: formData.explanation,
      });

      // Dexie me cached counts refresh karein
      const updatedTaxonomy = await db.master_gs_subjects.toArray();
      setSubjectsList(updatedTaxonomy);

      if (inputMode === 'bulk' && bulkQueue.length > 0) {
        // Saved question ko queue se drop karein
        const remaining = bulkQueue.filter((_, idx) => idx !== bulkIndex);

        if (remaining.length > 0) {
          const nextIndex = bulkIndex >= remaining.length ? remaining.length - 1 : bulkIndex;
          setBulkQueue(remaining);
          setBulkIndex(nextIndex);
          setFormData(remaining[nextIndex]);
          setFeedback({
            type: 'success',
            text: `Question saved! ${remaining.length} bache hue hain.`,
          });
        } else {
          // Sabhi questions successfully save ho gaye
          setBulkQueue([]);
          setRawJson('');
          setFormData(EMPTY_FORM);
          setFeedback({ type: 'success', text: 'Saare bulk questions save ho gaye!' });
          setTimeout(() => {
            setIsModalOpen(false);
            setFeedback({ type: '', text: '' });
          }, 1200);
        }
      } else {
        // Manual mode single save
        setFeedback({
          type: 'success',
          text: 'Question Firestore me save ho gaya aur count increment hua!',
        });
        setTimeout(() => {
          setFormData(EMPTY_FORM);
          setIsModalOpen(false);
          setFeedback({ type: '', text: '' });
        }, 1200);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Connection problem hai. Internet aane ke baad dubara try karein.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.workspaceScroll}>
      <div style={{ maxWidth: '860px', margin: '0 auto', width: '100%', padding: '0 0.5rem', boxSizing: 'border-box' }}>
        
        {/* Header Block */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ color: '#f8fafc', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.3rem 0' }}>
              Prelims PYQ Portal
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
              Practice previous year questions mapped to micro-syllabus topics.
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
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>+</span> Add Prelims PYQ
            </button>
          )}
        </div>

        {/* Banner */}
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.75" style={{ margin: '0 auto 0.75rem auto' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', marginBottom: '0.4rem' }}>Questions View Ready</h3>
          <p style={{ fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto' }}>
            Select a subject from your syllabus to practice targeted PYQs or add new questions using the action button above.
          </p>
        </div>

        {/* Modal Dialog */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                maxWidth: '680px',
                maxHeight: '92vh',
                backgroundColor: '#0c111d',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
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
                <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Add Prelims PYQ
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Mode Switch Chips */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '0.75rem 1.25rem',
                  background: '#070a13',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: inputMode === 'manual' ? '1px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: inputMode === 'manual' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    color: inputMode === 'manual' ? '#60a5fa' : '#94a3b8',
                  }}
                >
                  Manual Input
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('bulk')}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: inputMode === 'bulk' ? '1px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: inputMode === 'bulk' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    color: inputMode === 'bulk' ? '#60a5fa' : '#94a3b8',
                  }}
                >
                  Bulk Input
                </button>
              </div>

              {/* Scrollable Container */}
              <div
                style={{
                  padding: '1.25rem 1rem',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              >
                {/* Feedback Alerts */}
                {feedback.text && (
                  <div
                    style={{
                      padding: '0.65rem 0.9rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border: feedback.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                      color: feedback.type === 'error' ? '#fca5a5' : '#6ee7b7',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {feedback.text}
                  </div>
                )}

                {/* Bulk Section */}
                {inputMode === 'bulk' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>
                      Paste JSON (Single object ya Array):
                    </label>
                    <textarea
                      rows={4}
                      value={rawJson}
                      onChange={(e) => setRawJson(e.target.value)}
                      placeholder='[{"questionText": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "year": 2024}]'
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#070a13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '0.76rem',
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleLoadJson}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#1e293b',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Load JSON Questions
                    </button>

                    {/* Pagination Bar */}
                    {bulkQueue.length > 1 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '0.5rem 0.8rem',
                          marginTop: '0.4rem',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <button
                          type="button"
                          onClick={handlePrevQuestion}
                          disabled={bulkIndex === 0}
                          style={{
                            background: '#151c2e',
                            color: bulkIndex === 0 ? '#475569' : '#fff',
                            border: 'none',
                            padding: '0.35rem 0.8rem',
                            borderRadius: '6px',
                            cursor: bulkIndex === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '0.76rem',
                          }}
                        >
                          ← Prev
                        </button>
                        <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>
                          Question <strong>{bulkIndex + 1}</strong> of <strong>{bulkQueue.length}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          disabled={bulkIndex === bulkQueue.length - 1}
                          style={{
                            background: '#151c2e',
                            color: bulkIndex === bulkQueue.length - 1 ? '#475569' : '#fff',
                            border: 'none',
                            padding: '0.35rem 0.8rem',
                            borderRadius: '6px',
                            cursor: bulkIndex === bulkQueue.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.76rem',
                          }}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Question Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
                  
                  {/* Question Text */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>
                      Question Text (HTML allowed) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.questionText}
                      onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                      placeholder="Consider the following statements regarding..."
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#070a13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '0.84rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>Options</label>
                    {['A', 'B', 'C', 'D'].map((letter) => {
                      const key = `opt${letter}`;
                      return (
                        <div key={letter} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                          <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.82rem', width: '16px', flexShrink: 0 }}>
                            {letter}
                          </span>
                          <input
                            type="text"
                            required
                            placeholder={`Option ${letter}`}
                            value={formData[key]}
                            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                            style={{
                              width: '100%',
                              minWidth: 0,
                              boxSizing: 'border-box',
                              background: '#070a13',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '8px',
                              padding: '0.65rem 0.85rem',
                              color: '#f8fafc',
                              fontSize: '0.82rem',
                              outline: 'none',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Correct Option & Year */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', width: '100%' }}>
                    <div style={{ flex: '1 1 140px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>Correct Option</label>
                      <select
                        value={formData.correctAnswerIndex}
                        onChange={(e) => setFormData({ ...formData, correctAnswerIndex: e.target.value })}
                        style={{
                          width: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          background: '#070a13',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '0.65rem 0.8rem',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          outline: 'none',
                        }}
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>

                    <div style={{ flex: '1 1 140px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>Exam Year</label>
                      <input
                        type="number"
                        min="1995"
                        max="2035"
                        required
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        style={{
                          width: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          background: '#070a13',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '0.65rem 0.8rem',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Taxonomy Dropdowns: Mobile Safe Vertical Layout */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                    
                    {/* Subject Dropdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>
                        Subject <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        required
                        value={formData.subjectId}
                        onChange={handleSubjectChange}
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          background: '#070a13',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '0.65rem 0.8rem',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          outline: 'none',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      >
                        <option value="">Select Subject from Dexie</option>
                        {subjectsList.map((sub, idx) => (
                          <option key={sub.id} value={sub.id}>
                            {idx}. {sub.name} {sub.paper ? `(${sub.paper})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Topic Dropdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>Topic</label>
                      <select
                        value={formData.topicId}
                        onChange={handleTopicChange}
                        disabled={!formData.subjectId}
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          background: '#070a13',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '0.65rem 0.8rem',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          outline: 'none',
                          opacity: formData.subjectId ? 1 : 0.5,
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      >
                        <option value="">Select Topic</option>
                        {availableTopics.map((top, idx) => (
                          <option key={top.id} value={top.id}>
                            {idx}. {top.name || top.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subtopic Dropdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>Subtopic</label>
                      <select
                        value={formData.subtopicId}
                        onChange={(e) => setFormData({ ...formData, subtopicId: e.target.value })}
                        disabled={!formData.topicId}
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          background: '#070a13',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '0.65rem 0.8rem',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          outline: 'none',
                          opacity: formData.topicId ? 1 : 0.5,
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      >
                        <option value="">Select Subtopic</option>
                        {availableSubtopics.map((st, idx) => (
                          <option key={st.id} value={st.id}>
                            {idx}. {st.name || st.id} {st.prelimspyqcount ? `(${st.prelimspyqcount} PYQs)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      marginTop: '0.5rem',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.8rem',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? 'Saving to Firestore...' : 'Save Question →'}
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