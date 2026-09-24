// src/dashboard/views/MainsPYQView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../db/dexieDb';
import { saveMainsPYQDirect } from '../../services/mainsPyqService';
import styles from '../Dashboard.module.css';

const ADMIN_EMAIL = 'nishant53195@gmail.com';

const MARKS_WORD_MAP = {
  10: 150,
  12.5: 200,
  15: 250,
};

const EMPTY_FORM = {
  questionText: '',
  year: new Date().getFullYear(),
  marks: 10,
  wordLimit: 150,
  paperTag: 'GS1',
  mappings: [], // [{ subjectId, topicId, subtopicId }]
  modelAnswer: '',
};

export default function MainsPYQView({ user }) {
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState('manual'); // 'manual' | 'bulk'

  const [subjectsList, setSubjectsList] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Active Tag Builder (Temporary selections before adding to mappings list)
  const [activeSubjectId, setActiveSubjectId] = useState('');
  const [activeTopicId, setActiveTopicId] = useState('');
  const [activeSubtopicId, setActiveSubtopicId] = useState('');

  // Bulk States
  const [rawJson, setRawJson] = useState('');
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkIndex, setBulkIndex] = useState(0);

  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  // Load master taxonomy from Dexie
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

  // Cascading Dropdown Hierarchies
  const currentSubjectObj = useMemo(() => {
    return subjectsList.find((s) => s.id === activeSubjectId) || null;
  }, [subjectsList, activeSubjectId]);

  const availableTopics = useMemo(() => {
    if (!currentSubjectObj?.topics) return [];
    return [...currentSubjectObj.topics].sort((a, b) => {
      const seqA = a.sequence ?? a.order ?? a.index ?? 0;
      const seqB = b.sequence ?? b.order ?? b.index ?? 0;
      return seqA - seqB;
    });
  }, [currentSubjectObj]);

  const currentTopicObj = useMemo(() => {
    return availableTopics.find((t) => t.id === activeTopicId) || null;
  }, [availableTopics, activeTopicId]);

  const availableSubtopics = useMemo(() => {
    if (!currentTopicObj?.subtopics) return [];
    return [...currentTopicObj.subtopics].sort((a, b) => {
      const seqA = a.sequence ?? a.order ?? a.index ?? 0;
      const seqB = b.sequence ?? b.order ?? b.index ?? 0;
      return seqA - seqB;
    });
  }, [currentTopicObj]);

  // Handle Marks selection with auto word-limit
  const handleMarksChange = (e) => {
    const val = Number(e.target.value);
    setFormData((prev) => ({
      ...prev,
      marks: val,
      wordLimit: MARKS_WORD_MAP[val] || 150,
    }));
  };

  // Add a multidimensional taxonomy mapping tag
  const handleAddMapping = () => {
    if (!activeSubjectId || !activeTopicId || !activeSubtopicId) {
      setFeedback({ type: 'error', text: 'Subject, Topic aur Subtopic teeno select karein.' });
      return;
    }

    const isDuplicate = formData.mappings.some(
      (m) =>
        m.subjectId === activeSubjectId &&
        m.topicId === activeTopicId &&
        m.subtopicId === activeSubtopicId
    );

    if (isDuplicate) {
      setFeedback({ type: 'error', text: 'Yeh subtopic combination pehle se added hai.' });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      mappings: [
        ...prev.mappings,
        {
          subjectId: activeSubjectId,
          topicId: activeTopicId,
          subtopicId: activeSubtopicId,
        },
      ],
    }));

    // Reset active dropdowns
    setActiveSubjectId('');
    setActiveTopicId('');
    setActiveSubtopicId('');
    setFeedback({ type: '', text: '' });
  };

  const handleRemoveMapping = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      mappings: prev.mappings.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Bulk JSON Loader
  const handleLoadJson = () => {
    setFeedback({ type: '', text: '' });
    try {
      const parsed = JSON.parse(rawJson.trim());
      const questions = Array.isArray(parsed) ? parsed : [parsed];

      if (questions.length === 0) {
        setFeedback({ type: 'error', text: 'JSON array empty hai.' });
        return;
      }

      const normalizedQueue = questions.map((item) => {
        const marks = Number(item.marks) || 10;
        const wordLimit = item.wordLimit || MARKS_WORD_MAP[marks] || 150;

        // Support both single mapping or array of mappings
        let mappings = [];
        if (Array.isArray(item.mappings)) {
          mappings = item.mappings;
        } else if (item.subjectId && item.topicId && item.subtopicId) {
          mappings = [{
            subjectId: item.subjectId,
            topicId: item.topicId,
            subtopicId: item.subtopicId,
          }];
        }

        return {
          questionText: item.questionText || '',
          year: item.year || new Date().getFullYear(),
          marks: marks,
          wordLimit: wordLimit,
          paperTag: item.paperTag || 'GS1',
          mappings: mappings,
          modelAnswer: item.modelAnswer || '',
        };
      });

      setBulkQueue(normalizedQueue);
      setBulkIndex(0);
      setFormData(normalizedQueue[0]);
      setFeedback({ type: 'success', text: `${normalizedQueue.length} questions load ho gaye.` });
    } catch (err) {
      setFeedback({ type: 'error', text: 'Invalid JSON format. Check syntax.' });
    }
  };

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

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    if (!formData.questionText.trim()) {
      setFeedback({ type: 'error', text: 'Question text mandatory hai.' });
      return;
    }

    if (formData.mappings.length === 0) {
      setFeedback({ type: 'error', text: 'Kam se kam ek Subject + Topic + Subtopic mapping add karein.' });
      return;
    }

    setSaving(true);
    try {
      await saveMainsPYQDirect({
        questionText: formData.questionText,
        year: Number(formData.year),
        marks: Number(formData.marks),
        wordLimit: Number(formData.wordLimit),
        paperTag: formData.paperTag,
        mappings: formData.mappings,
        modelAnswer: formData.modelAnswer,
      });

      // Dexie cache refresh taaki updated mainspyqcount reflect ho sake
      const updatedTaxonomy = await db.master_gs_subjects.toArray();
      setSubjectsList(updatedTaxonomy);

      if (inputMode === 'bulk' && bulkQueue.length > 0) {
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
        setFeedback({
          type: 'success',
          text: 'Mains question saved & mainspyqcount incremented!',
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
              Mains PYQ Portal
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
              Practice previous year descriptive questions mapped across micro-syllabus dimensions.
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
              <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>+</span> Add Mains PYQ
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.75" style={{ margin: '0 auto 0.75rem auto' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', marginBottom: '0.4rem' }}>Mains Questions Ready</h3>
          <p style={{ fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto' }}>
            Select topics to review multi-dimensional descriptive questions and model answers.
          </p>
        </div>

        {/* Modal Window */}
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
                  Add Mains PYQ
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

              {/* Mode Toggle Chips */}
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

              {/* Form Body */}
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
                      Paste Mains JSON (Single object ya Array):
                    </label>
                    <textarea
                      rows={4}
                      value={rawJson}
                      onChange={(e) => setRawJson(e.target.value)}
                      placeholder='[{"questionText": "...", "year": 2024, "marks": 15}]'
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

                    {/* Pagination */}
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

                {/* Entry Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
                  
                  {/* Question Text */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>
                      Mains Question Text (HTML allowed) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.questionText}
                      onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                      placeholder="Critically examine the impact of..."
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

                  {/* Marks, Word Limit, Year, GS Paper */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', width: '100%' }}>
                    {/* Marks */}
                    <div style={{ flex: '1 1 120px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>Marks</label>
                      <select
                        value={formData.marks}
                        onChange={handleMarksChange}
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
                        <option value={10}>10 Marks</option>
                        <option value={12.5}>12.5 Marks</option>
                        <option value={15}>15 Marks</option>
                      </select>
                    </div>

                    {/* Word Limit */}
                    <div style={{ flex: '1 1 120px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}>Word Limit</label>
                      <input
                        type="number"
                        required
                        value={formData.wordLimit}
                        onChange={(e) => setFormData({ ...formData, wordLimit: e.target.value })}
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

                    {/* Year */}
                    <div style={{ flex: '1 1 120px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
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

                  {/* Multidimensional Taxonomy Selector */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <label style={{ color: '#60a5fa', fontSize: '0.82rem', fontWeight: 700 }}>
                      Add Taxonomy Mapping (Multidimensional)
                    </label>

                    {/* Subject */}
                    <select
                      value={activeSubjectId}
                      onChange={(e) => {
                        setActiveSubjectId(e.target.value);
                        setActiveTopicId('');
                        setActiveSubtopicId('');
                      }}
                      style={{
                        width: '100%',
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
                      <option value="">Select Subject</option>
                      {subjectsList.map((sub, idx) => (
                        <option key={sub.id} value={sub.id}>
                          {idx}. {sub.name} {sub.paper ? `(${sub.paper})` : ''}
                        </option>
                      ))}
                    </select>

                    {/* Topic */}
                    <select
                      value={activeTopicId}
                      onChange={(e) => {
                        setActiveTopicId(e.target.value);
                        setActiveSubtopicId('');
                      }}
                      disabled={!activeSubjectId}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#070a13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.8rem',
                        color: '#f8fafc',
                        fontSize: '0.82rem',
                        outline: 'none',
                        opacity: activeSubjectId ? 1 : 0.5,
                      }}
                    >
                      <option value="">Select Topic</option>
                      {availableTopics.map((top, idx) => (
                        <option key={top.id} value={top.id}>
                          {idx}. {top.name || top.id}
                        </option>
                      ))}
                    </select>

                    {/* Subtopic */}
                    <select
                      value={activeSubtopicId}
                      onChange={(e) => setActiveSubtopicId(e.target.value)}
                      disabled={!activeTopicId}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#070a13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.8rem',
                        color: '#f8fafc',
                        fontSize: '0.82rem',
                        outline: 'none',
                        opacity: activeTopicId ? 1 : 0.5,
                      }}
                    >
                      <option value="">Select Subtopic</option>
                      {availableSubtopics.map((st, idx) => (
                        <option key={st.id} value={st.id}>
                          {idx}. {st.name || st.id} {st.mainspyqcount ? `(${st.mainspyqcount} Mains)` : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddMapping}
                      style={{
                        background: '#1e293b',
                        color: '#60a5fa',
                        border: '1px solid rgba(96, 165, 250, 0.3)',
                        borderRadius: '8px',
                        padding: '0.55rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Add Tag Mapping
                    </button>

                    {/* Active Selected Tags Display */}
                    {formData.mappings.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Mapped Dimensions:</span>
                        {formData.mappings.map((m, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#151c2e',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.78rem',
                              color: '#cbd5e1',
                            }}
                          >
                            <span>
                              <strong style={{ color: '#60a5fa' }}>{m.subjectId}</strong> → {m.topicId} → <em>{m.subtopicId}</em>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMapping(i)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                fontWeight: 700,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
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
                    {saving ? 'Saving to Firestore...' : 'Save Mains Question →'}
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