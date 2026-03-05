export function isWithinWorkHours(
  now: Date,
  workStart: string, // "10:00"
  workEnd: string, // "02:00"
  timeZone = "Asia/Tashkent"
) {
  const parseMinutes = (value: string) => {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
  };

  const getMinutesInTimeZone = (value: Date, tz: string) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(value);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return hour * 60 + minute;
  };

  const startMinutes = parseMinutes(workStart);
  const endMinutes = parseMinutes(workEnd);
  if (startMinutes === null || endMinutes === null) return false;

  const nowMinutes = getMinutesInTimeZone(now, timeZone);

  // если конец раньше старта — значит график через ночь
  if (startMinutes > endMinutes) {
    return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
  }
  return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
}
