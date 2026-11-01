import type { CaseRecord } from "../domain/types";
import { shiftDate, todayTaipei } from "../dates";

/** 合約資料優先帶入；未確認實際入住日時，先用預產期準備觀看期間。 */
export function registrationDefaults(record: CaseRecord) {
  const validFrom = record.actualAdmission || record.dueDate || todayTaipei();
  return { motherName: record.name, phone: record.phone, room: record.room, validFrom, validTo: shiftDate(validFrom, record.days + 1) };
}
