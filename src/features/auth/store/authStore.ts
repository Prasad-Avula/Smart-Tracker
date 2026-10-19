import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "../services/authService";
import type {
  User,
  AuthState,
  LoginCredentials,
  SignupCredentials,
} from "../types";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteUser, type User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@firebase-local/index";

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
  updateUserSettings: (settings: Partial<User["settings"]>) => Promise<void>;
}

// AuthProvider and protected routes can initialize at the same time during a
// refresh. Reuse one promise so Firebase only registers one listener and loads
// the user document once.
let initializePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      loading: true,
      error: null,
      initialized: false,

      login: async (credentials: LoginCredentials) => {
        set({ loading: true, error: null });
        try {
          const firebaseUser = await authService.loginUser(
            credentials.email,
            credentials.password,
          );
          // Use getOrCreateUserDocument to ensure user document exists
          const userDoc = await authService.getOrCreateUserDocument(firebaseUser.uid);
          set({ user: userDoc, firebaseUser, loading: false, error: null });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Login failed";
          set({ loading: false, error: message });
          throw error;
        }
      },

      signup: async (credentials: SignupCredentials) => {
        set({ loading: true, error: null });
        try {
          const firebaseUser = await authService.signupUser(
            credentials.email,
            credentials.password,
            credentials.displayName,
          );
          const userDoc = await authService.getUserDocument(firebaseUser.uid);
          set({ user: userDoc, firebaseUser, loading: false, error: null });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Signup failed";
          set({ loading: false, error: message });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await authService.logoutUser();
          set({
            user: null,
            firebaseUser: null,
            loading: false,
            initialized: true,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      deleteAccount: async () => {
        const { user, firebaseUser } = get();
        if (!user || !firebaseUser) throw new Error("Not authenticated");

        set({ loading: true });
        try {
          // Delete user data from Firestore
          await deleteDoc(doc(db, "users", firebaseUser.uid));
          
          // Delete Firebase Auth user
          const currentUser = auth.currentUser;
          if (currentUser && currentUser.uid === firebaseUser.uid) {
            await deleteUser(currentUser);
          }
          
          // Clear local state
          set({
            user: null,
            firebaseUser: null,
            loading: false,
            initialized: true,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      setUser: (user) => set({ user }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      initialize: async () => {
        if (get().initialized) return;

        if (initializePromise) return initializePromise;

        initializePromise = (async () => {
          const { auth } = await import("@firebase-local/index");
          const { onAuthStateChanged } = await import("firebase/auth");

          await new Promise<void>((resolve) => {
            let unsubscribe: (() => void) | null = null;
            unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
              try {
                if (firebaseUser) {
                  const userDoc = await authService.getOrCreateUserDocument(
                    firebaseUser.uid,
                  );
                  set({
                    user: userDoc,
                    firebaseUser,
                    error: null,
                    initialized: true,
                    loading: false,
                  });
                } else {
                  set({
                    user: null,
                    firebaseUser: null,
                    error: null,
                    initialized: true,
                    loading: false,
                  });
                }
              } catch (error) {
                set({
                  user: null,
                  firebaseUser,
                  error: error instanceof Error ? error.message : "Failed to initialize authentication",
                  initialized: true,
                  loading: false,
                });
              } finally {
                unsubscribe?.();
                resolve();
              }
            });
          });
        })().finally(() => {
          initializePromise = null;
        });

        return initializePromise;
      },

      updateUserSettings: async (settings) => {
        const { user, firebaseUser } = get();
        if (!user || !firebaseUser) return;

        try {
          await authService.updateUserSettings(firebaseUser.uid, settings);
          set({
            user: { ...user, settings: { ...user.settings, ...settings } },
          });
        } catch (error) {
          console.error("Failed to update settings:", error);
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
