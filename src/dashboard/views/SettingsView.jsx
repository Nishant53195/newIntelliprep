// src/dashboard/views/SettingsView.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestoreDb } from '../../firebase/firestore/config';
import { db } from '../../db/dexieDb';
import styles from '../Dashboard.module.css';

export default function SettingsView({ user, userProfile, setUserProfile, setActiveNav }) {
  const [optionalList, setOptionalList] = useState([]);
  const [selectedOptional, setSelectedOptional] = useState(
    userProfile?.optionalsubject || userProfile?.optionalSubject || ''
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOptionalSubjects() {
      setLoading(true);
      setErrorMsg('');

      try {
        // 1. Check Dexie cache first if table exists
        if (db.master_optional_subjects) {
          const localList = await db.master_optional_subjects.toArray();
          if (isMounted && localList.length > 0) {
            localList.sort((a, b) => a.name.localeCompare(b.name));
            setOptionalList(localList);
            setLoading(false);
            return;
          }
        }

        // 2. Fetch from Firestore collection: master_optional_subjects
        const colRef = collection(firestoreDb, 'master_optional_subjects');
        const snapshot = await getDocs(colRef);

        const loadedSubjects = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || data['subject name'] || data.subjectName || d.id,
            ...data,
          };
        });

        loadedSubjects.sort((a, b) => a.name.localeCompare(b.name));

        if (isMounted) {
          // Cache in Dexie if table exists
          if (db.master_optional_subjects) {
            await db.master_optional_subjects.bulkPut(loadedSubjects);
          }
          setOptionalList(loadedSubjects);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load optional subjects:', err);
        if (isMounted) {
          setErrorMsg('Unable to load optional subjects. Please check your internet connection.');
          setLoading(false);
        }
      }
    }

    loadOptionalSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedOptional) {
      setErrorMsg('Please select an Optional Subject.');
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
        optionalsubject: selectedOptional,
        updatedAt: new Date().toISOString(),
      };

      // 1. Update Firestore
      await updateDoc(userDocRef, updatePayload);

      // 2. Sync to local Dexie user table
      if (db.users) {
        const localUser = await db.users.get(user.uid);
        if (localUser) {
          await db.users.put({ ...localUser, ...updatePayload });
        }
      }

      // 3. Update store state
      if (setUserProfile) {
        setUserProfile({
          ...userProfile,
          ...updatePayload,
        });
      }

      setSuccessMsg('Optional Subject updated successfully!');
      setTimeout(() => {
        if (setActiveNav) setActiveNav('Dashboard');
      }, 1000);
    } catch (err) {
      console.error('Failed to update optional subject:', err);
      setErrorMsg('Failed to save selection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.workspaceScroll}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '14px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(96, 165, 250, 0.2)',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading Optional Subjects...</span>
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
            Optional Subject Settings
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
            Configure or update your chosen UPSC Mains optional subject.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '0.8rem 1rem',
              color: '#f87171',
              fontSize: '0.82rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '0.8rem 1rem',
              color: '#34d399',
              fontSize: '0.82rem',
            }}
          >
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
              Optional Subject <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <p style={{ color: '#64748b', fontSize: '0.74rem', margin: 0 }}>
              Select the optional discipline registered for your Civil Services Mains exam.
            </p>
            <select
              value={selectedOptional}
              onChange={(e) => setSelectedOptional(e.target.value)}
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
              <option value="" disabled>Select your Optional Subject</option>
              {optionalList.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || !selectedOptional}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.8rem',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: saving || !selectedOptional ? 'not-allowed' : 'pointer',
              opacity: saving || !selectedOptional ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            {saving ? 'Updating Optional Subject...' : 'Save Optional Subject →'}
          </button>
        </form>
      </div>
    </div>
  );
}