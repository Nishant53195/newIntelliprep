import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from '../../firebase/firestore/config';
import { db } from '../../db/dexieDb';

const useLoginStore = create((set) => ({
  user: null,
  userProfile: null,
  authInitialized: false,
  profileLoaded: false,

  setUser: (user) => set({ user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setAuthInitialized: (value) => set({ authInitialized: value }),

  fetchUserProfile: async (uid) => {
    if (!uid) {
      set({ userProfile: null, profileLoaded: true });
      return null;
    }

    try {
      // 1. Check Dexie local storage first
      const localData = await db.users.get(uid);
      if (localData) {
        set({ userProfile: localData, profileLoaded: true });
        return localData;
      }

      // 2. Network fallback to Firestore
      const userRef = doc(firestoreDb, 'master_users', uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const profileData = snapshot.data();
        await db.users.put(profileData); // Populate Dexie cache
        set({ userProfile: profileData, profileLoaded: true });
        return profileData;
      } else {
        set({ userProfile: null, profileLoaded: true });
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      set({ userProfile: null, profileLoaded: true });
      return null;
    }
  },

  clearUser: async () => {
    set({
      user: null,
      userProfile: null,
      profileLoaded: false,
    });
  },
}));

export default useLoginStore;