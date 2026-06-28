/** Local storage — saves to JSON + MongoDB */
import fs from "fs";
import path from "path";
import { RawTariffRecord, ParserRunLog, ParserError } from "./types";
import { computeDataHash, isDuplicate } from "./deduplicator";

const DATA_DIR = path.join(process.cwd(), "data", "parser");

function ensureDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
}

function readJson<T>(filename: string): T[] {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

function writeJson<T>(filename: string, data: T[]) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), "utf-8");
}

export class LocalDataLayer {
  async saveRawRecord(record: RawTariffRecord): Promise<boolean> {
    record.dataHash = computeDataHash(record);
    const records = readJson<RawTariffRecord>("rawTariffs.json");

    // Dedup check
    if (isDuplicate(records, record.dataHash, record.parsedAt)) {
      return false;
    }

    record.id = `raw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    records.push(record);
    writeJson("rawTariffs.json", records);
    return true;
  }

  async saveRawRecords(records: RawTariffRecord[]): Promise<number> {
    let count = 0;
    for (const r of records) {
      const saved = await this.saveRawRecord(r);
      if (saved) count++;
    }
    return count;
  }

  async saveRunLog(log: ParserRunLog): Promise<void> {
    const logs = readJson<ParserRunLog>("runLogs.json");
    logs.push(log);
    writeJson("runLogs.json", logs);
  }

  async saveError(error: ParserError): Promise<void> {
    const errors = readJson<ParserError>("errors.json");
    errors.push(error);
    writeJson("errors.json", errors);
  }

  async getRawRecords(opts?: { city?: string; isActive?: boolean; limitCount?: number }): Promise<RawTariffRecord[]> {
    let records = readJson<RawTariffRecord>("rawTariffs.json");
    if (opts?.city) records = records.filter(r => r.city === opts.city);
    if (opts?.isActive !== undefined) records = records.filter(r => r.isActive === opts.isActive);
    if (opts?.limitCount) records = records.slice(0, opts.limitCount);
    return records;
  }

  async getUnmatchedRecords(): Promise<RawTariffRecord[]> {
    return readJson<RawTariffRecord>("rawTariffs.json").filter(r => !r.serviceId);
  }

  async updateNormalization(recordId: string, serviceId: string, serviceName: string): Promise<void> {
    const records = readJson<RawTariffRecord>("rawTariffs.json");
    const idx = records.findIndex(r => r.id === recordId);
    if (idx >= 0) {
      records[idx].serviceId = serviceId;
      records[idx].serviceNameNorm = serviceName;
      writeJson("rawTariffs.json", records);
    }
  }

  async addToUnmatchedQueue(rawRecordId: string, serviceNameRaw: string, price: number, source: string, city: string): Promise<void> {
    try {
      const { getDb } = await import("../lib/mongodb");
      const db = await getDb();
      await db.collection("unmatchedQueue").updateOne(
        { id: rawRecordId },
        {
          $set: {
            id: rawRecordId,
            rawName: serviceNameRaw,
            price,
            source,
            city,
            category: "лаборатория",
            isActive: true,
            parsedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.warn("[LocalDataLayer] Failed to add unmatched record to MongoDB:", err);
    }
  }

  async getRunLogs(maxCount?: number): Promise<ParserRunLog[]> {
    let logs = readJson<ParserRunLog>("runLogs.json");
    if (maxCount) logs = logs.slice(0, maxCount);
    return logs;
  }

  async getErrors(): Promise<ParserError[]> {
    return readJson<ParserError>("errors.json");
  }

  async getRecentRecords(clinicName: string, city: string): Promise<RawTariffRecord[]> {
    const records = readJson<RawTariffRecord>("rawTariffs.json");
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return records.filter(
      r => r.clinicName === clinicName && r.city === city && new Date(r.parsedAt).getTime() > dayAgo
    );
  }

  async bootstrapJsonToMongo(): Promise<{ readCount: number; insertedCount: number; skippedCount: number }> {
    const records = readJson<RawTariffRecord>("rawTariffs.json");
    const { getDb } = await import("../lib/mongodb");
    const db = await getDb();

    const readCount = records.length;
    let insertedCount = 0;
    let skippedCount = 0;

    const existingHashes = new Set(
      (await db.collection("rawTariffs").find({}, { projection: { dataHash: 1 } }).toArray())
        .map((doc: any) => doc.dataHash)
        .filter(Boolean)
    );

    const toInsert: RawTariffRecord[] = [];
    for (const record of records) {
      if (!record.dataHash) record.dataHash = computeDataHash(record);
      if (existingHashes.has(record.dataHash)) { skippedCount++; continue; }
      existingHashes.add(record.dataHash);
      if (!record.id) record.id = `raw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      toInsert.push(record);
      insertedCount++;
    }

    if (toInsert.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        await db.collection("rawTariffs").insertMany(toInsert.slice(i, i + chunkSize));
      }
    }
    return { readCount, insertedCount, skippedCount };
  }
}
