/**
 * Firebase Authentication & User Service
 *
 * FIREBASE ONLY — Auth + Firestore
 * Handles: register, login, logout, user profile, roles, logs
 *
 * Firestore Collections:
 *   /users/{uid}  → user profile + role
 *   /logs/{id}    → activity logs
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db as offlineDB } from './offlinedb';

// ─── Firebase Init ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyCxkB2aPIybTm7b9aOM0UQUPXSsL6hOiQs',
  authDomain: 'invoice-hub-3d29e.firebaseapp.com',
  projectId: 'invoice-hub-3d29e',
  storageBucket: 'invoice-hub-3d29e.firebasestorage.app',
  messagingSenderId: '636801097999',
  appId: '1:636801097999:web:ca04f4feb52e5b48481e7a',
  measurementId: 'G-3HQDB82V4P',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'business' | 'user';
  createdAt: string;
}

export interface ActivityLog {
  id?: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

// ─── Internal: Write log to Firestore ────────────────────────────────────────
const writeLog = async (log: Omit<ActivityLog, 'id'>): Promise<void> => {
  try {
    await addDoc(collection(firestore, 'logs'), {
      ...log,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Firebase] Log write failed:', err);
  }
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  role: User['role'] = 'business'
): Promise<{ user: User | null; error: string | null }> => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });

    const newUser: User = {
      uid: credential.user.uid,
      email,
      displayName,
      role,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    await setDoc(doc(firestore, 'users', newUser.uid), newUser);

    // Cache offline
    await offlineDB.users.put(newUser);

    await writeLog({
      userId: newUser.uid,
      action: 'REGISTER',
      details: `User registered: ${email}, role: ${role}`,
      timestamp: new Date().toISOString(),
    });

    return { user: newUser, error: null };
  } catch (err: any) {
    const msg =
      err.code === 'auth/email-already-in-use'
        ? 'Email already registered'
        : err.message ?? 'Registration failed';
    return { user: null, error: msg };
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(firestore, 'users', credential.user.uid));

    let user: User;
    if (snap.exists()) {
      user = snap.data() as User;
    } else {
      user = {
        uid: credential.user.uid,
        email: credential.user.email!,
        displayName: credential.user.displayName ?? email,
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(firestore, 'users', user.uid), user);
    }

    // Cache offline
    await offlineDB.users.put(user);

    await writeLog({
      userId: user.uid,
      action: 'LOGIN',
      details: `User logged in: ${email}`,
      timestamp: new Date().toISOString(),
    });

    return { user, error: null };
  } catch (err: any) {
    if (!navigator.onLine) {
      const cached = await offlineDB.users.where('email').equals(email).first();
      if (cached) return { user: cached, error: null };
    }
    const msg =
      err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
        ? 'Invalid email or password'
        : err.message ?? 'Login failed';
    return { user: null, error: msg };
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const logoutUser = async (): Promise<void> => {
  const fbUser = auth.currentUser;
  if (fbUser) {
    await writeLog({
      userId: fbUser.uid,
      action: 'LOGOUT',
      details: `User logged out: ${fbUser.email}`,
      timestamp: new Date().toISOString(),
    });
  }
  await signOut(auth);
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
export const getCurrentUser = (): Promise<User | null> =>
  new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      unsub();
      if (!fbUser) return resolve(null);
      try {
        const snap = await getDoc(doc(firestore, 'users', fbUser.uid));
        resolve(snap.exists() ? (snap.data() as User) : null);
      } catch {
        const cached = await offlineDB.users.get(fbUser.uid);
        resolve(cached ?? null);
      }
    });
  });

// ─── GET ALL USERS (Admin) ────────────────────────────────────────────────────
export const getUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(collection(firestore, 'users'));
    const users = snapshot.docs.map((d) => d.data() as User);
    await Promise.all(users.map((u) => offlineDB.users.put(u)));
    return users;
  } catch {
    return offlineDB.users.toArray();
  }
};

// ─── UPDATE USER ROLE ─────────────────────────────────────────────────────────
export const updateUserRole = async (
  userId: string,
  newRole: User['role']
): Promise<{ success: boolean; error: string | null }> => {
  try {
    await updateDoc(doc(firestore, 'users', userId), { role: newRole });
    await offlineDB.users.where('uid').equals(userId).modify({ role: newRole });
    await writeLog({
      userId,
      action: 'ROLE_UPDATE',
      details: `Role updated to: ${newRole}`,
      timestamp: new Date().toISOString(),
    });
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// ─── DELETE USER ACCOUNT ──────────────────────────────────────────────────────
export const deleteUserAccount = async (
  userId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    await deleteDoc(doc(firestore, 'users', userId));
    await offlineDB.users.delete(userId);
    await writeLog({
      userId,
      action: 'USER_DELETED',
      details: `User account deleted: ${userId}`,
      timestamp: new Date().toISOString(),
    });
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// ─── LOGIN AS ADMIN (Demo) ────────────────────────────────────────────────────
export const loginAsAdmin = async (): Promise<{ user: User | null; error: string | null }> => {
  return loginUser('admin@invoicechain.com', 'admin123456');
};

// ─── ROLE HELPERS ─────────────────────────────────────────────────────────────
export const hasRole = async (role: User['role']): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.role === role;
};

export const isAdmin = async (): Promise<boolean> => hasRole('admin');

// ─── GET ACTIVITY LOGS ────────────────────────────────────────────────────────
export const getActivityLogs = async (userId?: string): Promise<ActivityLog[]> => {
  try {
    const ref = collection(firestore, 'logs');
    const q = userId
      ? query(ref, where('userId', '==', userId), orderBy('timestamp', 'desc'))
      : query(ref, orderBy('timestamp', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        action: data.action,
        details: data.details,
        timestamp:
          data.timestamp instanceof Timestamp
            ? data.timestamp.toDate().toISOString()
            : data.timestamp,
      } as ActivityLog;
    });
  } catch {
    return [];
  }
};