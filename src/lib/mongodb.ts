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

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) return { client, db };
  try {
    client = new MongoClient(uri, { connectTimeoutMS: 5000, socketTimeoutMS: 30000 });
    await client.connect();
    db = client.db();
    console.log("[MongoDB] Connected to database:", db.databaseName);
    return { client, db };
  } catch (err: any) {
    console.error("[MongoDB] Connection failed:", err.message);
    throw err;
  }
}

export async function getDb(): Promise<Db> {
  const { db: database } = await connectToDatabase();
  return database;
}
