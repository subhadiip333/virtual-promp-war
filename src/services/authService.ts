import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential
} from "firebase/auth";

// These configs are SAFE to expose in the frontend via environment variables
// Make sure to add them to your .env.local file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-bucket.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456:web:abcd1234"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Service to handle user authentication using Firebase Auth.
 * Includes Google Sign-In and Email/Password flows.
 */
export const authService = {
  /**
   * Signs in the user using a Google popup.
   * @returns A promise resolving to the user credential.
   */
  async loginWithGoogle(): Promise<UserCredential> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      console.error("authService.loginWithGoogle failed:", error);
      throw error;
    }
  },

  /**
   * Signs in the user using email and password.
   * @param email User's email.
   * @param password User's password.
   * @returns A promise resolving to the user credential.
   */
  async loginWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error("authService.loginWithEmail failed:", error);
      throw error;
    }
  },

  /**
   * Registers a new user using email and password.
   * @param email User's email.
   * @param password User's password.
   * @returns A promise resolving to the user credential.
   */
  async registerWithEmail(email: string, password: string): Promise<UserCredential> {
      try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          return result;
      } catch (error) {
          console.error("authService.registerWithEmail failed:", error);
          throw error;
      }
  },

  /**
   * Logs out the current user.
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("authService.logout failed:", error);
      throw error;
    }
  },

  /**
   * Subscribes to authentication state changes.
   * @param callback Function to call when auth state changes.
   * @returns An unsubscribe function.
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};
