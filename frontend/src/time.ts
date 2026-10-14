/* 日本時間の「2026/10/08 11:57:00」形式(伝言の受電日時と同じ形式) */
export function nowJst(): string {

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return (
    `${get("year")}/${get("month")}/${get("day")} ` +
    `${get("hour")}:${get("minute")}:${get("second")}`
  );
}


