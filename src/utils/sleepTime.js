// 規則：入睡時間一律在第 1 天（上列），起床時間一律在第 2 天（下列）。
// 所有計算以整數分鐘進行，避免浮點誤差（例如「3小時60分鐘」）。

export const MINUTES_PER_DAY = 24 * 60;

export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const splitMinutes = (totalMinutes) => {
  const abs = Math.abs(totalMinutes);
  return { hours: Math.floor(abs / 60), minutes: abs % 60 };
};

export const formatDuration = (totalMinutes) => {
  const { hours, minutes } = splitMinutes(totalMinutes);
  return `${hours}小時${minutes}分鐘`;
};

// 第 1 天入睡 → 第 2 天起床，範圍 (0, 48h)；同一時刻 = 24 小時
export const sleepDuration = (sleepTime, wakeTime) =>
  MINUTES_PER_DAY - timeToMinutes(sleepTime) + timeToMinutes(wakeTime);

// 正值 = 較晚，負值 = 較早；兩個時間在同一天，直接相減
export const timeDiff = (normalTime, actualTime) =>
  timeToMinutes(actualTime) - timeToMinutes(normalTime);

// 以本地時間解析 YYYY-MM-DD，避免 new Date('YYYY-MM-DD') 被當成 UTC
export const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const toLocalDateString = (date) =>
  [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
