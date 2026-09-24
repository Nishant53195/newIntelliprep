import {
  onAuthStateChanged,
  getAuth,
} from "firebase/auth";

import {
  firebaseApp,
} from "../../firebase/firestore/config";

import useLoginStore from "../store/loginStore";

const auth =
  getAuth(firebaseApp);

export function hydrateLogin() {
  onAuthStateChanged(
    auth,
    (user) => {
      const store =
        useLoginStore.getState();

      store.setUser(user);

      store.setAuthInitialized(
        true
      );
    }
  );
}