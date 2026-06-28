/** SHA-256 hash-based deduplication for parsed tariff records. */
import { createHash } from "crypto";
import { RawTariffRecord } from "./types";

export function computeDataHash(record: Partial<RawTariffRecord>): string {
  const canonical = JSON.stringify({
    clinicName: (record.clinicName || "").toLowerCase().trim(),
    serviceNameRaw: (record.serviceNameRaw || "").toLowerCase().trim(),
    priceKzt: record.priceKzt || 0,
    city: (record.city || "").toLowerCase().trim(),
  });
  return createHash("sha256").update(canonical, "utf-8").digest("hex");
}

/**
 * Check if a candidate is a duplicate of any existing record within 24h window.
 * Same hash + parsed within last day = duplicate.
 */
export function isDuplicate(
  existing: RawTariffRecord[],
  candidateHash: string,
  candidateParsedAt: string
): boolean {
  const candidateTime = new Date(candidateParsedAt).getTime();
  return existing.some(
    (r) =>
      r.dataHash === candidateHash &&
      Math.abs(new Date(r.parsedAt).getTime() - candidateTime) < 24 * 60 * 60 * 1000
  );
}
