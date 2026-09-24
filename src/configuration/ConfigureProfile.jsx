import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestoreDb } from '../firebase/firestore/config';
import useLoginStore from '../login/store/LoginStore';
import { db } from '../db/dexieDb';
import styles from './ConfigureProfile.module.css';

export default function ConfigureProfile() {
  const user = useLoginStore((state) => state.user);
  const setUserProfile = useLoginStore((state) => state.setUserProfile);
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyExistingProfile() {
      if (!user?.uid) return;

      try {
        // Check Dexie first
        const localProfile = await db.users.get(user.uid);
        if (isMounted && localProfile) {
          setUserProfile(localProfile);
          navigate('/dashboard', { replace: true });
          return;
        }

        // Check Firestore fallback
        const userDocRef = doc(firestoreDb, 'master_users', user.uid);
        const docSnap = await getDoc(userDocRef);

        if (isMounted && docSnap.exists()) {
          const profileData = docSnap.data();
          await db.users.put(profileData);
          setUserProfile(profileData);
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error checking configuration:', error);
      }
    }

    verifyExistingProfile();

    if (user) {
      setDisplayName(user.displayName || '');
    }

    return () => {
      isMounted = false;
    };
  }, [user, navigate, setUserProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const userRef = doc(firestoreDb, 'master_users', user.uid);
      const profilePayload = {
        uid: user.uid,
        email: user.email,
        displayName: displayName.trim(),
        photoURL: user.photoURL || '',
        configuredAt: new Date().toISOString(),
        subscription: false,
        onboarding: true,
        ongoingsubject1: null,
        ongoingsubject2: null,
        optionalsubject: null,
      };

      // 1. Write to Firestore first
      await setDoc(userRef, profilePayload, { merge: true });

      // 2. Only if Firestore write succeeds, save to Dexie
      await db.users.put(profilePayload);

      // 3. Update global state and navigate
      setUserProfile(profilePayload);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Failed to configure profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.auroraGlowOne} />
      <div className={styles.auroraGlowTwo} />
      <div className={styles.gridOverlay} />

      <div className={styles.configContainer}>
        <div className={styles.header}>
          <div className={styles.avatarWrapper}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarFallback}>
                {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <h1>Set up your Study Profile</h1>
          <p>Personalize your aspirant profile to calibrate your study plan</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="displayName">Aspirant Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={saving || !displayName.trim()}>
            {saving ? 'Initializing Workspace...' : 'Enter UPSC IntelliPrep →'}
          </button>
        </form>
      </div>
    </div>
  );
}