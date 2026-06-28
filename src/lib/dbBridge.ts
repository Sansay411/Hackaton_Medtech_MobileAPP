/** MongoDB HTTP Bridge — эмулирует Firestore API через /api/db/ */
export interface User { uid: string; email: string | null; displayName: string | null; emailVerified: boolean; }

export const auth = {
  currentUser: typeof window !== "undefined" ? (localStorage.getItem("medtariff_user") ? JSON.parse(localStorage.getItem("medtariff_user")!) : null) : null,
  onAuthStateChanged: (cb: any) => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("medtariff_user") ? JSON.parse(localStorage.getItem("medtariff_user")!) : null;
      cb(user);
      const handler = () => { const u = localStorage.getItem("medtariff_user") ? JSON.parse(localStorage.getItem("medtariff_user")!) : null; cb(u); };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }
    cb(null); return () => {};
  }
} as any;

export const googleProvider = {} as any;
export const db = {} as any;

export enum OperationType { CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write' }

export function handleMongoDBError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('[MongoDB Error]', JSON.stringify({ error: error instanceof Error ? error.message : String(error), operationType, path }));
}

async function apiCall(url: string, method: string = "GET", body?: any): Promise<any> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`MongoDB API Error: ${res.statusText}`);
  return res.json();
}

export const signInWithPopup = async (...args: any[]) => {
  const mockUser: User = { uid: "mock-user-123", email: "user@medtariff.kz", displayName: "Казахстан Пациент", emailVerified: true };
  if (typeof window !== "undefined") { localStorage.setItem("medtariff_user", JSON.stringify(mockUser)); window.dispatchEvent(new Event("storage")); }
  return { user: mockUser } as any;
};

export const signOut = async (...args: any[]) => {
  if (typeof window !== "undefined") localStorage.removeItem("medtariff_user");
};

export const onAuthStateChanged = (...args: any[]) => { const cb = args[1]; return auth.onAuthStateChanged(cb); };

export const doc = (...args: any[]) => {
  let path = "default", id = "default-id";
  if (args.length === 2) { path = args[0]?.path || "default"; id = args[1]; }
  else if (args.length >= 3) { path = args[1]; id = args[2]; }
  return { path, id } as any;
};

export const collection = (...args: any[]) => { return { path: args[1] || args[0]?.path || "col" } as any; };
export const query = (colRef: any, ...constraints: any[]) => { return { path: colRef?.path, constraints } as any; };
export const where = (field: string, op: string, value: any) => ({ type: "where", field, op, value } as any);
export const orderBy = (...args: any[]) => ({} as any);
export const limit = (...args: any[]) => ({ type: "limit", value: args[0] } as any);

export const getDocs = async (q: any) => {
  const path = q?.path || "";
  const constraints = q?.constraints || [];
  let url = `/api/db/${path}`;
  const params = new URLSearchParams();
  for (const c of constraints) { if (c?.type === "where" && c?.field && c?.value !== undefined) params.append(c.field, c.value); }
  const queryStr = params.toString();
  if (queryStr) url += `?${queryStr}`;
  const list = await apiCall(url);
  return { empty: list.length === 0, docs: list.map((item: any) => ({ id: item.id || "mock-id", data: () => item, exists: () => true })), forEach: (cb: any) => list.forEach((item: any) => cb({ id: item.id || "mock-id", data: () => item, exists: () => true })) } as any;
};

export const setDoc = async (...args: any[]) => { const docRef = args[0]; const data = args[1]; await apiCall(`/api/db/${docRef?.path}`, "POST", { ...data, id: docRef?.id }); };
export const addDoc = async (...args: any[]) => { const colRef = args[0]; const data = args[1]; const response = await apiCall(`/api/db/${colRef?.path}`, "POST", data); return { id: response.id } as any; };
export const deleteDoc = async (...args: any[]) => { const docRef = args[0]; await apiCall(`/api/db/${docRef?.path}/${docRef?.id}`, "DELETE"); };
export const getDoc = async (...args: any[]) => { const docRef = args[0]; const list = await apiCall(`/api/db/${docRef?.path}?id=${docRef?.id}`); const item = list[0]; return { exists: () => !!item, data: () => item || null, id: docRef?.id } as any; };
export const onSnapshot = (...args: any[]) => { getDocs(args[0]).then(args[1]); return () => {}; };
export const writeBatch = (...args: any[]) => {
  const operations: Array<{ docRef: any; data: any }> = [];
  return {
    set: (docRef: any, data: any) => {
      operations.push({ docRef, data });
    },
    commit: async () => {
      for (const op of operations) {
        await setDoc(op.docRef, op.data);
      }
    }
  } as any;
};
