/** Service name normalizer: rule-based match first, AI fallback second. */

import { SERVICES_CATALOG } from "../data/servicesCatalog";
import { RawTariffRecord, NormalizationResult } from "./types";

export class ServiceNormalizer {
  private _aiFailed = false;
  /**
   * Phase 1: Rule-based matching against the 50-service normalized catalog.
   * Tries exact match → synonym match → partial word match.
   */
  ruleBasedMatch(rawName: string, category?: string): NormalizationResult | null {
    const lowerName = rawName.toLowerCase().trim();

    for (const service of SERVICES_CATALOG) {
      // 1. Exact name match
      if (service.name.toLowerCase() === lowerName) {
        return this.makeMatch(service, 100, "exact");
      }

      // 2. Synonym match
      for (const syn of service.synonyms) {
        const lowerSyn = syn.toLowerCase();
        // Full synonym contained in raw name, or raw name is the synonym
        if (lowerName === lowerSyn || lowerName.includes(lowerSyn)) {
          return this.makeMatch(service, 92, "synonym");
        }
      }

      // 3. Partial word match (service name words appear in raw name)
      const serviceWords = service.name.toLowerCase().split(/[\s,()]+/).filter(w => w.length > 3);
      const matchedWords = serviceWords.filter(w => lowerName.includes(w));
      if (matchedWords.length >= 2 && matchedWords.length >= serviceWords.length * 0.5) {
        return this.makeMatch(service, 70, "synonym");
      }
    }

    return null;
  }

  /**
   * Phase 2: AI-based fallback via Alem AI (OpenAI-compatible API).
   * Требует ALEM_AI_API_KEY в .env
   */
  async aiMatch(rawName: string, category?: string): Promise<NormalizationResult> {
    try {
      // Skip AI normalization if previous attempt failed (rate limiting)
      if (this._aiFailed) {
        return { matched: false, confidence: 0, method: "unmatched" };
      }

      const apiKey = process.env.ALEM_AI_API_KEY;
      const endpoint = process.env.ALEM_AI_ENDPOINT || "https://llm.alem.ai/v1/chat/completions";
      const model = process.env.ALEM_AI_MODEL || "alemllm";

      if (!apiKey) {
        return { matched: false, confidence: 0, method: "unmatched" };
      }

      const catalogList = SERVICES_CATALOG.map(s =>
        `ID: ${s.id} | Название: "${s.name}" | Синонимы: ${s.synonyms.join(", ")} | Категория: ${s.category}`
      ).join("\n");

      const prompt = `Ты нормализатор медицинских услуг Казахстана.
Сопоставь сырое название со справочником.

Сырое: "${rawName}"${category ? `\nКатегория: ${category}` : ""}

Справочник:
${catalogList}

Ответь JSON:
{
  "matchedServiceId": "id или null",
  "matchedServiceName": "название или null",
  "confidence": 0-100,
  "reason": "обоснование"
}`;

      const axios = (await import("axios")).default;
      const response = await axios.post(endpoint, {
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 300,
      }, {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        timeout: 15000,
      });

      const text = response.data?.choices?.[0]?.message?.content || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { matched: false, confidence: 0, method: "unmatched" };

      const result = JSON.parse(jsonMatch[0]);
      if (result.matchedServiceId && result.confidence >= 50) {
        return {
          matched: true,
          matchedServiceId: result.matchedServiceId,
          matchedServiceName: result.matchedServiceName,
          confidence: result.confidence,
          method: "ai",
        };
      }
      return { matched: false, confidence: 0, method: "unmatched" };
    } catch (err: any) {
      this._aiFailed = true;
      console.warn(`[Normalizer] AI normalization disabled after error: ${err.message}`);
      return { matched: false, confidence: 0, method: "unmatched" };
    }
  }

  /** Run full normalization pipeline: rule → AI → unmatched. */
  async normalize(record: RawTariffRecord): Promise<NormalizationResult> {
    // Phase 1: rule-based
    const ruleMatch = this.ruleBasedMatch(record.serviceNameRaw, record.category);
    if (ruleMatch) return ruleMatch;

    // Phase 2: AI fallback (stub for now)
    const aiResult = await this.aiMatch(record.serviceNameRaw, record.category);
    if (aiResult.matched) return aiResult;

    // Phase 3: unmatched
    return { matched: false, confidence: 0, method: "unmatched" };
  }

  private makeMatch(
    service: (typeof SERVICES_CATALOG)[number],
    confidence: number,
    method: NormalizationResult["method"]
  ): NormalizationResult {
    return {
      matched: true,
      matchedServiceId: service.id,
      matchedServiceName: service.name,
      confidence,
      method,
    };
  }
}
