// src/App.jsx
import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "./firebase/firestore/auth";
import { firestoreDb } from "./firebase/firestore/config";
import { db } from "./db/dexieDb";
import useLoginStore from "./login/store/LoginStore";
import router from "./routes";

function App() {
  const setUser = useLoginStore((state) => state.setUser);
  const setUserProfile = useLoginStore((state) => state.setUserProfile);
  const setAuthInitialized = useLoginStore((state) => state.setAuthInitialized);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function evaluateAndNavigate(authenticatedUser) {
      if (!authenticatedUser?.uid || !isMounted) {
        if (isMounted) setBootstrapping(false);
        return;
      }

      try {
        // Step 1: Dexie check
        const localProfile = await db.users.get(authenticatedUser.uid);
        if (localProfile && isMounted) {
          setUserProfile(localProfile);
          setBootstrapping(false);
          const currentPath = window.location.pathname;
          if (currentPath === "/" || currentPath === "/login" || currentPath === "/configure") {
            router.navigate("/dashboard", { replace: true });
          }
          return;
        }

        // Step 2: Firestore check
        const userDocRef = doc(firestoreDb, "master_users", authenticatedUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (!isMounted) return;

        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          await db.users.put(remoteData);
          setUserProfile(remoteData);
          setBootstrapping(false);
          const currentPath = window.location.pathname;
          if (currentPath === "/" || currentPath === "/login" || currentPath === "/configure") {
            router.navigate("/dashboard", { replace: true });
          }
        } else {
          setBootstrapping(false);
          router.navigate("/configure", { replace: true });
        }
      } catch (err) {
        console.error("Routing resolution error:", err);
        if (isMounted) setBootstrapping(false);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      setUser(currentUser);
      setAuthInitialized(true);

      if (currentUser) {
        await evaluateAndNavigate(currentUser);
      } else {
        setBootstrapping(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setUser, setUserProfile, setAuthInitialized]);

  if (bootstrapping) {
    return (
      <div style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#070a13",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#60a5fa",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: "0.9rem"
      }}>
        Authenticating workspace...
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;