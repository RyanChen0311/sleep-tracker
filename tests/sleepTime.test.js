import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  formatDuration,
  sleepDuration,
  timeDiff,
  parseLocalDate,
  toLocalDateString,
} from '../src/utils/sleepTime.js';

const hh = (h, m = 0) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

// 長條圖：上列從入睡畫到 24:00，下列從 00:00 畫到起床
const chartMinutes = (sleep, wake) => (24 * 60 - timeToMinutes(sleep)) + timeToMinutes(wake);

test('576 種整點組合：時長與長條圖總長一致', () => {
  for (let s = 0; s < 24; s++) {
    for (let w = 0; w < 24; w++) {
      const d = sleepDuration(hh(s), hh(w));
      assert.equal(d, chartMinutes(hh(s), hh(w)), `${hh(s)} → ${hh(w)}`);
      assert.ok(d > 0 && d < 48 * 60);
    }
  }
});

test('576 種整點組合：晚睡/晚起差值與長條圖位置一致', () => {
  for (let s = 0; s < 24; s++) {
    for (let w = 0; w < 24; w++) {
      // 同一列上，實際點在正常點右邊 = 晚
      assert.equal(timeDiff('23:00', hh(s)), (s - 23) * 60);
      assert.equal(timeDiff('07:00', hh(w)), (w - 7) * 60);
    }
  }
});

test('具體案例', () => {
  assert.equal(sleepDuration('02:00', '08:30'), 30 * 60 + 30);
  assert.equal(sleepDuration('23:00', '07:00'), 8 * 60);
  assert.equal(sleepDuration('07:00', '07:00'), 24 * 60);
  assert.equal(timeDiff('23:00', '02:00'), -21 * 60);
  assert.equal(timeDiff('07:00', '20:00'), 13 * 60);
  assert.equal(timeDiff('23:00', '23:00'), 0);
});

test('逐分鐘組合不會出現 60 分鐘', () => {
  for (let a = 0; a < 1440; a++) {
    for (let b = 0; b < 1440; b += 7) {
      const d = sleepDuration(hh(Math.floor(a / 60), a % 60), hh(Math.floor(b / 60), b % 60));
      assert.doesNotMatch(formatDuration(d), /60分鐘/);
    }
  }
  assert.equal(formatDuration(sleepDuration('00:05', '04:05')), '28小時0分鐘');
});

test('日期以本地時間解析', () => {
  const d = parseLocalDate('2026-10-03');
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate()], [2026, 9, 3]);
  assert.equal(toLocalDateString(new Date(2026, 9, 3, 2, 0)), '2026-10-03');
});
