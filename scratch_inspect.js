import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
  try {
    await client.connect();
    const db = client.db();
    const clinics = await db.collection("clinics").find({}).limit(50).toArray();
    console.log("Clinics count in DB:", clinics.length);
    console.log(JSON.stringify(clinics.map(c => ({ id: c.id, name: c.name, city: c.city, address: c.address, lat: c.lat, lng: c.lng })), null, 2));
  } catch (err) {
    console.error("Failed running script:", err);
  } finally {
    await client.close();
  }
}

run();
