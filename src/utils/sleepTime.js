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

// ---- 下一晚建議（調時差）----
// 建議以「時鐘上最近的方向」計算差距（±12 小時），
// 讓過了午夜才睡（例如 01:00）被視為晚睡，而不是早睡 22 小時。

export const SHIFT_STEP_MINUTES = 60; // 每天最多調整 1 小時

export const minutesToTime = (totalMinutes) => {
  const m = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

// 從 fromTime 到 toTime 的最短時鐘差，範圍 [-720, 720)；正值 = toTime 較晚
export const clockDiff = (fromTime, toTime) => {
  const d = timeToMinutes(toTime) - timeToMinutes(fromTime);
  return ((((d + 720) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY) - 720;
};

// 往目標時間移動，最多 step 分鐘；差距在 step 以內就直接到目標
export const stepToward = (actualTime, targetTime, step = SHIFT_STEP_MINUTES) => {
  const d = clockDiff(actualTime, targetTime);
  if (Math.abs(d) <= step) return targetTime;
  return minutesToTime(timeToMinutes(actualTime) + Math.sign(d) * step);
};

export const suggestNextNight = (normalSleep, normalWake, actualSleep, actualWake) => {
  const sleep = stepToward(actualSleep, normalSleep);
  const wake = stepToward(actualWake, normalWake);
  return {
    sleep,
    wake,
    sleepShift: clockDiff(actualSleep, sleep), // 正值 = 延後，負值 = 提早
    wakeShift: clockDiff(actualWake, wake),
    alreadyNormal: actualSleep === normalSleep && actualWake === normalWake,
    reachesNormal: sleep === normalSleep && wake === normalWake,
  };
};

// ---- 今天→今天（凌晨入睡）----
// 實際入睡與起床都在第 2 天（今天）；正常作息仍是第 1 天入睡 → 第 2 天起床。

// 起床必須晚於入睡，相等（0 小時）也視為錯誤
export const isValidSameDay = (sleepTime, wakeTime) => timeToMinutes(wakeTime) > timeToMinutes(sleepTime);

export const sameDaySleepDuration = (sleepTime, wakeTime) => timeToMinutes(wakeTime) - timeToMinutes(sleepTime);

// 正常入睡在第 1 天、實際入睡在第 2 天；正值 = 晚睡
export const sameDaySleepDiff = (normalSleepTime, actualSleepTime) =>
  MINUTES_PER_DAY + timeToMinutes(actualSleepTime) - timeToMinutes(normalSleepTime);
