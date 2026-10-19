import type { DemoDomain } from "../domain/types";

/** 由展示指派區間扣除照護聯集，不重複扣除重疊的照護事件。 */
export function cameraTimeRows(data: DemoDomain, dateFrom = "", dateTo = ""): (string | number)[][] {
  const rangeStart = dateFrom ? Date.parse(`${dateFrom}T00:00:00+08:00`) : 0;
  const rangeEnd = dateTo ? Date.parse(`${dateTo}T00:00:00+08:00`) + 86_400_000 : Infinity;
  return data.cameraIntervals.flatMap((interval) => {
    const start = Math.max(rangeStart, Date.parse(interval.start)); const end = Math.min(rangeEnd, Date.parse(interval.end ?? data.demoAt), Date.parse(data.demoAt));
    if (end <= start) return [];
    const spans = data.careEvents.filter((event) => event.babyId === interval.babyId).map((event) => [Math.max(start, Date.parse(event.start)), Math.min(end, Date.parse(event.end ?? data.demoAt))]).filter(([from, to]) => to > from).sort((a, b) => a[0] - b[0]);
    let away = 0; let previousEnd = start;
    for (const [from, to] of spans) { away += Math.max(0, to - Math.max(from, previousEnd)); previousEnd = Math.max(previousEnd, to); }
    const binding = data.bindings.find((item) => item.id === interval.bindingId); const subject = data.subjects.find((item) => item.id === interval.babyId);
    return [[`${binding?.motherName ?? ""}／${binding?.room || "托嬰"}`, subject?.name ?? "", data.cameras.find((camera) => camera.id === interval.cameraId)?.code ?? interval.cameraId, new Date(start).toISOString(), new Date(end).toISOString(), Math.round((end - start - away) / 1000), Math.round(away / 1000)]];
  });
}
