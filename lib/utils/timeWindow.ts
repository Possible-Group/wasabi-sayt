export function isWithinWorkHours(
  now: Date,
  workStart: string, // "10:00"
  workEnd: string    // "02:00"
) {
  const [sh, sm] = workStart.split(":").map(Number);
  const [eh, em] = workEnd.split(":").map(Number);

  const start = new Date(now);
  start.setHours(sh, sm, 0, 0);

  const end = new Date(now);
  end.setHours(eh, em, 0, 0);

  // если конец раньше старта — значит график через ночь
  if (end <= start) {
    // рабочее: [start..23:59] U [00:00..end]
    const endNext = new Date(end);
    endNext.setDate(endNext.getDate() + 1);
    const nowOrNext = new Date(now);
    // если сейчас после полуночи, считаем как следующий день интервала
    if (now < start) nowOrNext.setDate(nowOrNext.getDate() + 1);
    return nowOrNext >= start && nowOrNext <= endNext;
  }

  return now >= start && now <= end;
}