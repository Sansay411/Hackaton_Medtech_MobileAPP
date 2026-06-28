import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let uri = (process.env.MONGODB_URI || "").trim().replace(/^["']|["']$/g, "");
if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
  console.warn("[MongoDB] Invalid URI. Using default local URI.");
  uri = "mongodb://127.0.0.1:27017/medtariff";
}

let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<void> | null = null;

// Pre-connect at import time — don't wait for first request
connecting = (async () => {
  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    await client.connect();
    db = client.db();
    // Warm up with cheap query
    await db.collection("rawTariffs").findOne({}, { projection: { _id: 1 } });
    console.log("[MongoDB] Connected to database:", db.databaseName);
  } catch (err: any) {
    console.warn("[MongoDB] Connection failed (will retry on request):", err.message);
    client = null;
    db = null;
  }
})();

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) return { client, db };
  if (connecting) await connecting;
  if (client && db) return { client, db };
  throw new Error("MongoDB unavailable");
}

export async function getDb(): Promise<Db> {
  const { db: database } = await connectToDatabase();
  return database;
}
