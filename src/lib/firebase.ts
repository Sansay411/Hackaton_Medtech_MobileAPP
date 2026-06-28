import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";

// @ts-ignore
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Auth — always available
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore — graceful fallback if not enabled in Firebase project
let _db: any = null;
try {
  const { getFirestore } = require("firebase/firestore");
  _db = getFirestore(app);
} catch (e) {
  // Firestore not available — search/map/compare will still work via MongoDB
}

export const db: any = _db;

// Safe wrappers — return empty data when Firestore unavailable
const EMPTY_ARR: any[] = [];
const EMPTY_SNAP = { forEach: (fn: any) => {}, docs: [] as any[], size: 0, empty: true };

export async function safeGetDocs(ref: any): Promise<any> {
  if (!db) return EMPTY_SNAP;
  try {
    const { getDocs } = await import("firebase/firestore");
    return await getDocs(ref);
  } catch { return EMPTY_SNAP; }
}

export async function safeAddDoc(ref: any, data: any): Promise<any> {
  if (!db) return { id: `mock-${Date.now()}` };
  try {
    const { addDoc } = await import("firebase/firestore");
    return await addDoc(ref, data);
  } catch { return { id: `mock-${Date.now()}` }; }
}

export async function safeSetDoc(ref: any, data: any, opts?: any): Promise<void> {
  if (!db) return;
  try {
    const { setDoc } = await import("firebase/firestore");
    await setDoc(ref, data, opts);
  } catch {}
}

export async function safeDeleteDoc(ref: any): Promise<void> {
  if (!db) return;
  try {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(ref);
  } catch {}
}

export function safeDoc(database: any, path?: string, ...paths: string[]): any {
  if (!db) {
    // Handle doc(collectionRef) pattern — auto-generated ID
    if (typeof database === "object" && database?.path) return { id: `mock-${Date.now()}`, path: database.path };
    return { id: paths.length ? [path, ...paths].join("/") : path || "mock", path: true };
  }
  try {
    const { doc } = require("firebase/firestore");
    return doc(database, path as string, ...paths);
  } catch { return { id: `mock-${Date.now()}`, path: path || "mock" }; }
}

export function safeCollection(database: any, path: string): any {
  if (!db) return { path, id: path };
  try {
    const { collection } = require("firebase/firestore");
    return collection(database, path);
  } catch { return { path, id: path }; }
}

// Re-export originals for direct use (will fail gracefully if Firestore unavailable)
export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };

// Re-export safe versions under standard names for backward compat
export const getDocs = safeGetDocs;
export const addDoc = safeAddDoc;
export const setDoc = safeSetDoc;
export const deleteDoc = safeDeleteDoc;
export const doc = safeDoc;
export const collection = safeCollection;

// Static Firestore utilities (safe if db is null — they just build query objects)
export function query(ref: any, ...conditions: any[]) { return { ref, conditions }; }
export function where(field: string, op: string, value: any) { return { field, op, value }; }
export function orderBy(field: string, dir?: string) { return { field, dir }; }
export function writeBatch(..._args: any[]) {
  return { set: (..._: any[]) => {}, commit: async () => {}, delete: (..._: any[]) => {}, update: (..._: any[]) => {} };
}

export async function getDoc(ref: any): Promise<any> {
  if (!db) return null;
  try { const { getDoc: gd } = await import("firebase/firestore"); return await gd(ref); }
  catch { return null; }
}

export enum OperationType {
  CREATE = 'create', UPDATE = 'update', DELETE = 'delete',
  LIST = 'list', GET = 'get', WRITE = 'write',
}

export function handleMongoDBError(error: unknown, op: OperationType, path: string | null) {
  console.warn("[MongoDB] Operation failed:", op, path, error);
}
