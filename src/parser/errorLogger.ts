/** Error logger — stores errors via MongoDB */
import { ParserError } from "./types";
import { getDb } from "../lib/mongodb";

export class ParserErrorLogger {
  async logError(error: ParserError): Promise<void> {
    try {
      const db = await getDb();
      await db.collection("parserErrors").insertOne({ ...error, loggedAt: new Date().toISOString() });
    } catch (err) {
      console.error("[ParserErrorLogger] Failed:", err);
    }
  }

  async getRecentErrors(sourceId?: string, maxCount: number = 50): Promise<ParserError[]> {
    try {
      const db = await getDb();
      const filter: any = {};
      if (sourceId) filter.sourceId = sourceId;
      const results = await db.collection("parserErrors").find(filter).sort({ timestamp: -1 }).limit(maxCount).toArray();
      return results.map((r: any) => ({ id: r._id?.toString(), ...r })) as any;
    } catch {
      return [];
    }
  }
}
