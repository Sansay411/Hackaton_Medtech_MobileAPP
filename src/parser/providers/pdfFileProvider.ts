import AdmZip from "adm-zip";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";
import { parsePrice } from "./shared";

/**
 * Generic file parser for uploaded price lists (ZIP, PDF, DOCX, XLSX).
 * Used by LocalFileProvider for manual uploads through AdminHub.
 */
export class PdfFileProvider extends BaseMedicalProvider {
  constructor() {
    super("provider-pdf-file", "Файловый Парсер Прайс-Листов");
  }

  public async ingest(fileBuffer: Buffer, city: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const tariffs: IngestionResult["tariffs"] = [];

    try {
      // Try ZIP first (common format for pricelist archives)
      try {
        const zip = new AdmZip(fileBuffer);
        const zipEntries = zip.getEntries();
        for (const entry of zipEntries) {
          if (tariffs.length > 500) break; // safety limit
          const ext = entry.name.split(".").pop()?.toLowerCase();
          const data = entry.getData();

          if (ext === "pdf") {
            const records = await this.parsePdfBuffer(data, city);
            tariffs.push(...records);
          } else if (ext === "docx" || ext === "doc") {
            const records = await this.parseDocxBuffer(data, city);
            tariffs.push(...records);
          } else if (ext === "xlsx" || ext === "xls") {
            const records = this.parseXlsxBuffer(data, city);
            tariffs.push(...records);
          }
        }
      } catch {
        // Not a ZIP — try direct format detection
        const fileName = "uploaded_file";
        const ext = "pdf"; // default assumption

        if (ext === "pdf") {
          const records = await this.parsePdfBuffer(fileBuffer, city);
          tariffs.push(...records);
        } else if (ext === "docx" || ext === "doc") {
          const records = await this.parseDocxBuffer(fileBuffer, city);
          tariffs.push(...records);
        } else if (ext === "xlsx" || ext === "xls") {
          const records = this.parseXlsxBuffer(fileBuffer, city);
          tariffs.push(...records);
        }
      }

      return {
        sourceName: "Uploaded_PriceList",
        parsedAt: new Date().toISOString(),
        city,
        extractedRecordsCount: tariffs.length,
        tariffs,
        telemetry: {
          ingestDurationMs: Date.now() - startTime,
          fileSizeMb: parseFloat((fileBuffer.length / (1024 * 1024)).toFixed(3)),
          isSuccessful: true,
        },
      };
    } catch (err: any) {
      return {
        sourceName: "Uploaded_PriceList",
        parsedAt: new Date().toISOString(),
        city,
        extractedRecordsCount: 0,
        tariffs: [],
        telemetry: {
          ingestDurationMs: Date.now() - startTime,
          fileSizeMb: parseFloat((fileBuffer.length / (1024 * 1024)).toFixed(3)),
          isSuccessful: false,
          errorMessage: err.message,
        },
      };
    }
  }

  private async parsePdfBuffer(buffer: Buffer, city: string): Promise<IngestionResult["tariffs"]> {
    const pdfParseMod = await import("pdf-parse");
    const pdfParse = (pdfParseMod as any).default || pdfParseMod;
    const data = await pdfParse(buffer);
    return this.extractTariffsFromText(data.text, city);
  }

  private async parseDocxBuffer(buffer: Buffer, city: string): Promise<IngestionResult["tariffs"]> {
    const result = await mammoth.extractRawText({ buffer });
    return this.extractTariffsFromText(result.value, city);
  }

  private parseXlsxBuffer(buffer: Buffer, city: string): IngestionResult["tariffs"] {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const records: IngestionResult["tariffs"] = [];
    for (const row of rows) {
      if (!row || row.length < 2) continue;
      const serviceName = String(row[0] || "").trim();
      const price = parsePrice(String(row[row.length - 1] || "0"));
      if (serviceName && price > 0) {
        records.push({
          clinicName: "Из файла",
          rawServiceName: serviceName,
          priceKzt: price,
          osmsEligible: false,
        });
      }
    }
    return records;
  }

  private extractTariffsFromText(text: string, city: string): IngestionResult["tariffs"] {
    const records: IngestionResult["tariffs"] = [];
    const lines = text.split("\n");
    let currentClinic = "Из файла";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect clinic name lines (common patterns)
      if (
        trimmed.includes("Клиника") ||
        trimmed.includes("Лаборатория") ||
        trimmed.includes("Медицинский") ||
        trimmed.includes("Больница") ||
        trimmed.includes("Поликлиника")
      ) {
        currentClinic = trimmed;
        continue;
      }

      const price = parsePrice(trimmed);
      if (price > 0) {
        const namePart = trimmed
          .replace(/[\d\s,\.]+(?:₸|тг|тенге|\$)/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        if (namePart.length > 4) {
          records.push({
            clinicName: currentClinic,
            rawServiceName: namePart,
            priceKzt: price,
            osmsEligible: false,
          });
        }
      }
    }

    return records;
  }
}
