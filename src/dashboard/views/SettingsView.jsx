import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestoreDb } from '../../firebase/firestore/config';
import { db } from '../../db/dexieDb';
import styles from '../Dashboard.module.css';

export default function SettingsView({ user, userProfile, setUserProfile, setActiveNav }) {
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [primarySubject, setPrimarySubject] = useState(userProfile?.ongoingsubject1 || '');
  const [secondarySubject, setSecondarySubject] = useState(userProfile?.ongoingsubject2 || '');

  useEffect(() => {
    let isMounted = true;

    async function loadSubjects() {
      setLoading(true);
      setErrorMsg('');

      try {
        // 1. Instant check from Dexie local database[cite: 24, 25]
        const localSubjects = await db.master_gs_subjects.toArray();
        if (isMounted && localSubjects.length > 0) {
          setSubjectsList(localSubjects);
          setLoading(false);
          return;
        }

        // 2. Fallback to Firestore if background fetch is still in progress[cite: 24]
        const subjectsColRef = collection(firestoreDb, 'master_gs_subjects');
        const subjectsSnapshot = await getDocs(subjectsColRef);

        const completeSubjectsData = await Promise.all(
          subjectsSnapshot.docs.map(async (subjectDoc) => {
            const subjectData = subjectDoc.data();
            const subjectId = subjectDoc.id;

            const topicsColRef = collection(firestoreDb, 'master_gs_subjects', subjectId, 'topics');
            const topicsSnapshot = await getDocs(topicsColRef);

            let totalSubtopicsCount = 0;

            const topicsWithSubtopics = await Promise.all(
              topicsSnapshot.docs.map(async (topicDoc) => {
                const topicData = topicDoc.data();
                const topicId = topicDoc.id;

                const subtopicsColRef = collection(
                  firestoreDb,
                  'master_gs_subjects',
                  subjectId,
                  'topics',
                  topicId,
                  'subtopics'
                );
                const subtopicsSnapshot = await getDocs(subtopicsColRef);

                const subtopics = subtopicsSnapshot.docs.map((subDoc) => ({
                  id: subDoc.id,
                  ...subDoc.data(),
                }));

                totalSubtopicsCount += subtopics.length;

                return {
                  id: topicId,
                  ...topicData,
                  subtopicsCount: subtopics.length,
                  subtopics: subtopics,
                };
              })
            );

            return {
              id: subjectId,
              ...subjectData,
              name: subjectData.name || subjectId,
              paper: subjectData.paper || '',
              type: subjectData.type || '',
              totalTopics: topicsWithSubtopics.length,
              totalSubtopics: totalSubtopicsCount,
              topics: topicsWithSubtopics,
            };
          })
        );

        if (isMounted) {
          await db.master_gs_subjects.bulkPut(completeSubjectsData);
          setSubjectsList(completeSubjectsData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load master GS subjects:', err);
        if (isMounted) {
          setErrorMsg('Unable to load syllabus subjects. Please check your internet connection.');
          setLoading(false);
        }
      }
    }

    loadSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const secondaryOptions = useMemo(() => {
    return subjectsList.filter((s) => s.id !== primarySubject);
  }, [subjectsList, primarySubject]);

  const handlePrimaryChange = (e) => {
    const selectedId = e.target.value;
    setPrimarySubject(selectedId);
    if (secondarySubject === selectedId) {
      setSecondarySubject('');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!primarySubject) {
      setErrorMsg('Selecting a Primary Subject is mandatory.');
      return;
    }

    if (!user?.uid) {
      setErrorMsg('User authentication session not found.');
      return;
    }

    setSaving(true);
    try {
      const userDocRef = doc(firestoreDb, 'master_users', user.uid);
      const updatePayload = {
        ongoingsubject1: primarySubject,
        ongoingsubject2: secondarySubject || null,
        updatedAt: new Date().toISOString(),
      };

      // 1. Update Firestore[cite: 24]
      await updateDoc(userDocRef, updatePayload);

      // 2. Sync updated user profile to Dexie[cite: 25]
      const currentLocal = await db.users.get(user.uid);
      if (currentLocal) {
        await db.users.put({ ...currentLocal, ...updatePayload });
      }

      // 3. Update Zustand Store[cite: 24]
      if (setUserProfile) {
        setUserProfile({
          ...userProfile,
          ...updatePayload,
        });
      }

      setSuccessMsg('Preparation track updated successfully! Redirecting...');
      setTimeout(() => {
        if (setActiveNav) setActiveNav('Dashboard');
      }, 1000);
    } catch (err) {
      console.error('Failed to update user subjects:', err);
      setErrorMsg('Failed to save your selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.workspaceScroll}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '14px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(96, 165, 250, 0.2)',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading GS Syllabus Structure...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workspaceScroll}>
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ color: '#f8fafc', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
            Preparation Track Settings
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
            Configure your active study sequence from the civil services micro-syllabus.
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '0.8rem 1rem',
            color: '#f87171',
            fontSize: '0.82rem',
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '0.8rem 1rem',
            color: '#34d399',
            fontSize: '0.82rem',
          }}>
            {successMsg}
          </div>
        )}

        <form
          onSubmit={handleUpdate}
          style={{
            background: '#0f1523',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '16px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.4rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: '#f8fafc', fontSize: '0.84rem', fontWeight: 600 }}>
              Primary Subject <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <p style={{ color: '#64748b', fontSize: '0.74rem', margin: 0 }}>
              Mandatory base subject required to anchor daily goals and diagnostic tests.
            </p>
            <select
              value={primarySubject}
              onChange={handlePrimaryChange}
              required
              style={{
                background: '#151c2e',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                color: '#ffffff',
                fontSize: '0.84rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>Select a mandatory primary subject</option>
              {subjectsList.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} {sub.paper ? `(${sub.paper})` : ''} — {sub.totalTopics} Topics • {sub.totalSubtopics} Subtopics
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: '#f8fafc', fontSize: '0.84rem', fontWeight: 600 }}>
              Secondary Subject <span style={{ color: '#64748b', fontWeight: 400 }}>(Optional)</span>
            </label>
            <p style={{ color: '#64748b', fontSize: '0.74rem', margin: 0 }}>
              Optional companion subject for parallel study schedules.
            </p>
            <select
              value={secondarySubject}
              onChange={(e) => setSecondarySubject(e.target.value)}
              disabled={!primarySubject}
              style={{
                background: '#151c2e',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                color: '#ffffff',
                fontSize: '0.84rem',
                outline: 'none',
                cursor: primarySubject ? 'pointer' : 'not-allowed',
                opacity: primarySubject ? 1 : 0.6,
              }}
            >
              <option value="">None (Leave as Single Track)</option>
              {secondaryOptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} {sub.paper ? `(${sub.paper})` : ''} — {sub.totalTopics} Topics • {sub.totalSubtopics} Subtopics
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ color: '#fca5a5', fontSize: '0.76rem', lineHeight: 1.4 }}>
              Discipline constraint: Selected subjects lock your micro-syllabus recall engine.
            </span>
          </div>

          <button
            type="submit"
            disabled={saving || !primarySubject}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.8rem',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: saving || !primarySubject ? 'not-allowed' : 'pointer',
              opacity: saving || !primarySubject ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            {saving ? 'Updating Preparation Track...' : 'Save & Update Subjects →'}
          </button>
        </form>
      </div>
    </div>
  );
}