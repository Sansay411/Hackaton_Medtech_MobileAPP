/** Raw data layer — delegates to LocalDataLayer (MongoDB + JSON) */
import { RawTariffRecord, ParserRunLog } from "./types";
import { LocalDataLayer } from "./localDataLayer";

const layer = new LocalDataLayer();

export class RawDataLayer {
  async saveRawRecord(record: RawTariffRecord) { return layer.saveRawRecord(record); }
  async saveRawRecords(records: RawTariffRecord[]) { return layer.saveRawRecords(records); }
  async saveRunLog(log: ParserRunLog) { return layer.saveRunLog(log); }
  async getRawRecords(opts?: any) { return layer.getRawRecords(opts); }
  async getUnmatchedRecords() { return layer.getUnmatchedRecords(); }
  async updateNormalization(id: string, sid: string, name: string) { return layer.updateNormalization(id, sid, name); }
  async addToUnmatchedQueue(...args: any[]) { return layer.addToUnmatchedQueue(args[0], args[1], args[2], args[3], args[4]); }
  async getRunLogs(max: number = 50) { return layer.getRunLogs(max); }
  async getRecentRecords(c: string, city: string) { return layer.getRecentRecords(c, city); }
}
