/**
 * Parser Engine — main orchestrator.
 * Iterates through sources, runs providers, saves raw data, normalizes.
 */

import { BaseMedicalProvider, IngestionResult } from "../lib/providers";
import { PARSER_SOURCES, getActiveSources } from "./sources";
import { SourceConfig, RawTariffRecord, ParserRunResult } from "./types";
import { LocalDataLayer } from "./localDataLayer";
import { ServiceNormalizer } from "./normalizer";
import { ParserErrorLogger } from "./errorLogger";
import {
  KdlProvider,
  InvitroProvider,
  HelixProvider,
  OlympProvider,
  DoqProvider,
  MedelProvider,
  AksaiClinicProvider,
  MckProvider,
  PdfFileProvider,
  TopdocProvider,
  DgisProvider,
  FirecrawlProvider,
} from "./providers/index";

export class ParserEngine {
  private localDataLayer: LocalDataLayer;
  private normalizer: ServiceNormalizer;
  private errorLogger: ParserErrorLogger;

  private static isLocked = false;

  constructor() {
    this.localDataLayer = new LocalDataLayer();
    this.normalizer = new ServiceNormalizer();
    this.errorLogger = new ParserErrorLogger();
  }

  /** Get the appropriate provider instance for a source config. */
  getProvider(source: SourceConfig): BaseMedicalProvider {
    const providerMap: Record<string, new (...args: any[]) => BaseMedicalProvider> = {
      KdlProvider,
      InvitroProvider,
      HelixProvider,
      OlympProvider,
      DoqProvider,
      MedelProvider,
      AksaiClinicProvider,
      MckProvider,
      TopdocProvider,
      DgisProvider,
      FirecrawlProvider,
    };
    const ProviderClass = providerMap[source.providerClass];
    if (!ProviderClass) {
      throw new Error(`Unknown provider class: ${source.providerClass}`);
    }
    return new ProviderClass();
  }

  /** Run a single source through the full pipeline. */
  async runSource(source: SourceConfig): Promise<ParserRunResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const errors: ParserRunResult["errors"] = [];

    try {
      // Step 1: Run the provider to extract data
      const provider = this.getProvider(source);
      const result: IngestionResult = await provider.ingest(source.url, source.city);

      // Step 2: Save each record to raw layer (with dedup)
      let recordsNew = 0;
      const newRecords: RawTariffRecord[] = [];

      for (const tariff of result.tariffs) {
        const record: RawTariffRecord = {
          clinicId: `clinic-${tariff.clinicName
            .toLowerCase()
            .replace(/[^a-zа-яё0-9]/g, "-")}`,
          clinicName: tariff.clinicName,
          city: source.city,
          address: tariff.address,
          phone: tariff.phone,
          sourceUrl: source.url,
          serviceNameRaw: tariff.rawServiceName,
          priceKzt: tariff.priceKzt,
          currency: "KZT",
          osmsEligible: tariff.osmsEligible,
          parsedAt: new Date().toISOString(), // Enforced server-side generation
          isActive: true,
          dataHash: "",
          lat: tariff.lat,
          lng: tariff.lng,
        };

        const saved = await this.localDataLayer.saveRawRecord(record);
        if (saved) {
          recordsNew++;
          newRecords.push({ ...record, dataHash: "" });
        }
      }

      // Step 3: Normalize new records
      let recordsNormalized = 0;
      let recordsUnmatched = 0;

      for (const record of newRecords) {
        try {
          const normResult = await this.normalizer.normalize(record);
          if (normResult.matched && record.id) {
            await this.localDataLayer.updateNormalization(
              record.id,
              normResult.matchedServiceId!,
              normResult.matchedServiceName!
            );
            recordsNormalized++;
          } else if (!normResult.matched) {
            await this.localDataLayer.addToUnmatchedQueue(
              record.id || "unknown",
              record.serviceNameRaw,
              record.priceKzt,
              source.name,
              source.city
            );
            recordsUnmatched++;
          }
        } catch (normErr: any) {
          errors.push({
            sourceId: source.id,
            errorType: "parse",
            message: `Normalization failed: ${normErr.message}`,
            timestamp: new Date().toISOString(),
            retryCount: 0,
          });
        }
      }

      // Step 4: Save run log
      const runResult: ParserRunResult = {
        sourceId: source.id,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        recordsExtracted: result.extractedRecordsCount,
        recordsNew,
        recordsNormalized,
        recordsUnmatched,
        errors,
        isSuccessful: result.telemetry.isSuccessful,
      };

      await this.localDataLayer.saveRunLog({
        sourceId: runResult.sourceId,
        startedAt: runResult.startedAt,
        completedAt: runResult.completedAt,
        durationMs: runResult.durationMs,
        recordsExtracted: runResult.recordsExtracted,
        recordsNew: runResult.recordsNew,
        recordsNormalized: runResult.recordsNormalized,
        recordsUnmatched: runResult.recordsUnmatched,
        errorCount: runResult.errors.length,
        isSuccessful: runResult.isSuccessful,
      });

      return runResult;
    } catch (err: any) {
      const error: ParserRunResult["errors"][number] = {
        sourceId: source.id,
        errorType: "unknown",
        message: err.message,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };
      errors.push(error);
      await this.errorLogger.logError({
        ...error,
        errorType: "unknown",
      });

      return {
        sourceId: source.id,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        recordsExtracted: 0,
        recordsNew: 0,
        recordsNormalized: 0,
        recordsUnmatched: 0,
        errors,
        isSuccessful: false,
      };
    }
  }

  /** Run all active sources sequentially. Errors in one don't stop others. */
  async runAllSources(): Promise<ParserRunResult[]> {
    if (ParserEngine.isLocked) {
      console.warn("[ParserEngine] Mutex lock active. Preventing overlapping runs.");
      throw new Error("Parser is already running. Please wait for the current run to finish.");
    }
    ParserEngine.isLocked = true;
    try {
      const results: ParserRunResult[] = [];
      const sources = getActiveSources();

      console.log(`[ParserEngine] Starting run for ${sources.length} sources...`);

      for (const source of sources) {
        try {
          console.log(`[ParserEngine] Running source: ${source.id} (${source.name})`);
          const result = await this.runSource(source);
          results.push(result);
          console.log(
            `[ParserEngine] ${source.id}: ${result.recordsNew} new records, ` +
              `${result.recordsNormalized} normalized, ${result.recordsUnmatched} unmatched`
          );
        } catch (err: any) {
          console.error(`[ParserEngine] Fatal error in source ${source.id}:`, err.message);
          results.push({
            sourceId: source.id,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: 0,
            recordsExtracted: 0,
            recordsNew: 0,
            recordsNormalized: 0,
            recordsUnmatched: 0,
            errors: [
              {
                sourceId: source.id,
                errorType: "unknown",
                message: err.message,
                timestamp: new Date().toISOString(),
                retryCount: 0,
              },
            ],
            isSuccessful: false,
          });
        }
      }

      console.log(`[ParserEngine] Completed. ${results.filter((r) => r.isSuccessful).length}/${sources.length} successful.`);
      return results;
    } finally {
      ParserEngine.isLocked = false;
    }
  }

  /** Run a single source by ID. */
  async runSourceById(sourceId: string): Promise<ParserRunResult | null> {
    const source = PARSER_SOURCES.find((s) => s.id === sourceId);
    if (!source) return null;
    return this.runSource(source);
  }

  /** Process an uploaded price-list file. */
  async processUploadedFile(fileBuffer: Buffer, city: string): Promise<IngestionResult> {
    const fileProvider = new PdfFileProvider();
    return fileProvider.ingest(fileBuffer, city);
  }
}
