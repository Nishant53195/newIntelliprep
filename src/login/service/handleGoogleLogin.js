import { doc, getDoc } from "firebase/firestore";
import { firestoreDb } from "../../firebase/firestore/config";
import { loginWithGoogle } from "../../firebase/firestore/auth";
import { db } from "../../db/dexieDb";

export async function handleGoogleLogin({ navigate, setUser, setUserProfile }) {
  try {
    const user = await loginWithGoogle();
    if (!user) return;

    setUser(user);

    // 1. Check local Dexie first
    const localProfile = await db.users.get(user.uid);
    if (localProfile) {
      if (setUserProfile) setUserProfile(localProfile);
      navigate("/dashboard", { replace: true });
      return;
    }

    // 2. Fallback to Firestore[cite: 18]
    const userDocRef = doc(firestoreDb, "master_users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const remoteData = docSnap.data();
      await db.users.put(remoteData);
      if (setUserProfile) setUserProfile(remoteData);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/configure", { replace: true });
    }
  } catch (error) {
    console.error("Login Handler Error:", error);
  }
}