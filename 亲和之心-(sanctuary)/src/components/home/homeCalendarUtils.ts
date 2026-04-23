export const WEEK_LABELS_MON_FIRST = ['一', '二', '三', '四', '五', '六', '日'];

export function daysInMonth(year: number, month0: number) {
  return new Date(year, month0 + 1, 0).getDate();
}

export function startWeekdayMon0(year: number, month0: number) {
  const wd = new Date(year, month0, 1).getDay();
  return wd === 0 ? 6 : wd - 1;
}
