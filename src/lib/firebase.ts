import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  query, 
  orderBy,
  Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalEntry } from '../types';

// Initialize Firebase App instance safely (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore with specified databaseId if present
export const db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Strict Undefined-Stripping Utility
 * Production Directive: Clean Payloads & Zero-Crash Payload Hygiene.
 * Recursively strips undefined fields from objects before passing to Firestore SDK.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Sign in using Google OAuth popup
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Save or update a journal interaction document in the user's isolated subcollection.
 * Path: /users/{userId}/interactions/{interactionId}
 */
export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Authentication required to save entry');
  }
  if (auth.currentUser.uid !== entry.userId) {
    throw new Error('Security violation: Attempted to save entry for a different user ID');
  }

  const userInteractionRef = doc(db, 'users', entry.userId, 'interactions', entry.id);
  const cleanPayload = stripUndefined({
    ...entry,
    updatedAt: Date.now(),
  });

  await setDoc(userInteractionRef, cleanPayload, { merge: true });
}

/**
 * Fetch all journal interactions for the authenticated user in isolated path.
 */
export async function getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized access to user entries');
  }

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  const entries: JournalEntry[] = [];
  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data() as JournalEntry;
    entries.push({
      ...data,
      id: docSnapshot.id,
    });
  });

  return entries;
}

/**
 * Delete a journal entry belonging to the authenticated user.
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized delete request');
  }

  const userInteractionRef = doc(db, 'users', userId, 'interactions', entryId);
  await deleteDoc(userInteractionRef);
}
