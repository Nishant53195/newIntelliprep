import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup
} from "firebase/auth";
import { firebaseApp } from "./config";

export const auth = getAuth(firebaseApp);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ 
  prompt: 'select_account' 
});

export async function loginWithGoogle() {
  try {
    // Direct popup chalega - mobile Chrome/Safari touch event me popup allow karte hain
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Popup Error:", error);
    throw error;
  }
}