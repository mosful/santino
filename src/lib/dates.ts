/** 表單日期以台灣時間為準，每次開啟新表單時重新取得。 */
export function todayTaipei(at = new Date()) {
  return at.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

export function shiftDate(date: string, days: number) {
  return todayTaipei(new Date(Date.parse(`${date}T00:00:00+08:00`) + days * 86_400_000));
}
