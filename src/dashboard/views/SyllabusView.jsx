// src/dashboard/views/SyllabusView.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../db/dexieDb';
import styles from '../Dashboard.module.css';

const CHIPS = [
  { id: 'GS1', label: 'GS I', type: 'gs', paperTag: 'GS1' },
  { id: 'GS2', label: 'GS II', type: 'gs', paperTag: 'GS2' },
  { id: 'GS3', label: 'GS III', type: 'gs', paperTag: 'GS3' },
  { id: 'GS4', label: 'GS IV', type: 'gs', paperTag: 'GS4' },
  { id: 'OPTIONAL', label: 'Optional', type: 'optional' },
];

export default function SyllabusView({ user, userProfile, setActiveNav }) {
  const [activeChip, setActiveChip] = useState('GS1');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userOptionalId, setUserOptionalId] = useState(
    userProfile?.optionalsubject || userProfile?.optionalSubject || ''
  );
  const [optionalData, setOptionalData] = useState(null);

  useEffect(() => {
    async function checkUserOptional() {
      if (!userOptionalId && user?.uid && db.users) {
        const localUser = await db.users.get(user.uid);
        if (localUser?.optionalsubject) {
          setUserOptionalId(localUser.optionalsubject);
        }
      }
    }
    checkUserOptional();
  }, [user?.uid, userOptionalId]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const selected = CHIPS.find((c) => c.id === activeChip);

        if (selected.type === 'gs') {
          const allGsSubjects = await db.master_gs_subjects.toArray();
          const filtered = allGsSubjects
            .filter((sub) => {
              const paper = (sub.paper || '').toUpperCase().replace(/\s+/g, '');
              const target = selected.paperTag.toUpperCase();
              return paper === target || paper.includes(target);
            })
            .sort((a, b) => {
              const seqA = a.sequence ?? a.order ?? 0;
              const seqB = b.sequence ?? b.order ?? 0;
              return seqA - seqB;
            });

          if (isMounted) setSubjects(filtered);
        } else if (selected.type === 'optional') {
          if (!userOptionalId) {
            if (isMounted) {
              setOptionalData(null);
              setSubjects([]);
            }
          } else if (db.master_optional_subjects) {
            const matchedOptional = await db.master_optional_subjects.get(userOptionalId);
            if (isMounted) {
              setOptionalData(matchedOptional || null);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching syllabus from Dexie:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeChip, userOptionalId]);

  const gridContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '0.85rem',
    width: '100%',
    boxSizing: 'border-box',
  };

  const renderSubjectCard = (sub, idx) => {
    const topicsCount = Array.isArray(sub.topics) ? sub.topics.length : (sub.totalTopics || 0);
    const subtopicsCount = Array.isArray(sub.topics)
      ? sub.topics.reduce((acc, t) => acc + (Array.isArray(t.subtopics) ? t.subtopics.length : (t.subtopicsCount || 0)), 0)
      : (sub.totalSubtopics || 0);

    return (
      <div
        key={sub.id || idx}
        style={{
          background: '#0f1523',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0, flex: 1 }}>
          <h4
            style={{
              margin: 0,
              color: '#f8fafc',
              fontSize: '0.9rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={sub.name || sub['subject name'] || sub.id}
          >
            {sub.name || sub['subject name'] || sub.id}
          </h4>
          <span style={{ color: '#64748b', fontSize: '0.74rem' }}>
            ID: <code style={{ color: '#94a3b8' }}>{sub.id}</code>
            {` • ${topicsCount} Topics • ${subtopicsCount} Subtopics`}
          </span>
        </div>

        <span
          style={{
            background: 'rgba(37, 99, 235, 0.15)',
            color: '#60a5fa',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            borderRadius: '20px',
            padding: '0.25rem 0.65rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {sub.paper || activeChip}
        </span>
      </div>
    );
  };

  const renderTopicCard = (topic, idx, paperLabel) => (
    <div
      key={topic.id || idx}
      style={{
        background: '#0f1523',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0, flex: 1 }}>
        <h4
          style={{
            margin: 0,
            color: '#f8fafc',
            fontSize: '0.9rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={topic.name || topic.id}
        >
          {topic.name || topic.id}
        </h4>
        <span style={{ color: '#64748b', fontSize: '0.74rem' }}>
          ID: <code style={{ color: '#94a3b8' }}>{topic.id}</code>
          {Array.isArray(topic.subtopics) ? ` • ${topic.subtopics.length} Subtopics` : ''}
        </span>
      </div>

      <span
        style={{
          background: 'rgba(139, 92, 246, 0.15)',
          color: '#a78bfa',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '20px',
          padding: '0.25rem 0.65rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {paperLabel}
      </span>
    </div>
  );

  return (
    /* Outer container: takes available height and handles vertical scroll independently */
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
      <div style={{ maxWidth: '860px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.3rem 0' }}>
            Syllabus Explorer
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
            Browse micro-syllabus topics and modules categorized by papers.
          </p>
        </div>

        {/* Filter Chips */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1.25rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            flexShrink: 0,
          }}
        >
          {CHIPS.map((chip) => {
            const isActive = activeChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveChip(chip.id)}
                style={{
                  flexShrink: 0,
                  padding: '0.45rem 1.1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isActive ? '1px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.2)' : '#0f1523',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Content Section */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Loading syllabus structure from local database...
          </div>
        ) : activeChip === 'OPTIONAL' ? (
          <div>
            {!userOptionalId ? (
              <div
                style={{
                  background: '#0f1523',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f87171',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>

                <div>
                  <h3 style={{ color: '#f8fafc', fontSize: '1.05rem', margin: '0 0 0.3rem 0', fontWeight: 700 }}>
                    No Optional Subject Selected
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                    You have not configured your Optional Subject yet. Please select your optional subject in Settings to view its complete syllabus.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveNav && setActiveNav('Settings')}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem 1.4rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  Go to Settings →
                </button>
              </div>
            ) : !optionalData ? (
              <div
                style={{
                  background: '#0f1523',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.84rem',
                }}
              >
                Subject <code>{userOptionalId}</code> is selected, but syllabus is downloading or not found in local cache.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '0.2rem 0' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Current Optional:</span>
                  <h3 style={{ color: '#f8fafc', margin: '0.2rem 0 0 0', fontSize: '1.15rem', fontWeight: 800 }}>
                    {optionalData.name || optionalData.id}
                  </h3>
                </div>

                <div>
                  <h4 style={{ color: '#60a5fa', fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
                    Paper I ({optionalData.paper1Topics?.length || 0} Modules)
                  </h4>
                  {(!optionalData.paper1Topics || optionalData.paper1Topics.length === 0) ? (
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>No modules found for Paper 1.</div>
                  ) : (
                    <div style={gridContainerStyle}>
                      {optionalData.paper1Topics.map((top, idx) => renderTopicCard(top, idx, 'Paper 1'))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ color: '#60a5fa', fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
                    Paper II ({optionalData.paper2Topics?.length || 0} Modules)
                  </h4>
                  {(!optionalData.paper2Topics || optionalData.paper2Topics.length === 0) ? (
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>No modules found for Paper 2.</div>
                  ) : (
                    <div style={gridContainerStyle}>
                      {optionalData.paper2Topics.map((top, idx) => renderTopicCard(top, idx, 'Paper 2'))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {subjects.length === 0 ? (
              <div
                style={{
                  background: '#0f1523',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '12px',
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.84rem',
                }}
              >
                No subjects found for {activeChip} in local database.
              </div>
            ) : (
              <div style={gridContainerStyle}>
                {subjects.map(renderSubjectCard)}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}