import React, { useState } from 'react';
import { Moon, Sun, Coffee, Calendar, ArrowRight } from 'lucide-react';
import {
  timeToMinutes,
  formatDuration,
  splitMinutes,
  sleepDuration,
  timeDiff,
  parseLocalDate,
  toLocalDateString,
  suggestNextNight,
} from '../utils/sleepTime';

// 圖表配色：時間點圖示與控制面板一致（月亮、太陽、紅杯子、綠杯子）
const COLORS = {
  normalBar: '#bbf7d0', // green-200
  actualBar: '#2563eb', // blue-600
  normalSleep: '#9333ea', // purple-600
  normalWake: '#f97316', // orange-500
  actualSleep: '#ef4444', // red-500
  actualWake: '#16a34a', // green-600
  normalSleepText: '#7e22ce', // purple-700
  normalWakeText: '#c2410c', // orange-700
  actualSleepText: '#b91c1c', // red-700
  actualWakeText: '#15803d', // green-700
};

// 圖表分層排版（相對於每一列的頂端），各層互不重疊：
// 正常圖示+時間 → 正常長條 → 實際長條 → 軸線 → 刻度數字 → 實際圖示+時間
const LAYOUT = {
  normalLane: 10, // 圖示中心 y
  normalBarTop: 28,
  actualBarTop: 44,
  barHeight: 12,
  axis: 62,
  majorTickEnd: 74,
  minorTickEnd: 68,
  hourText: 86,
  actualLane: 114,
  rowHeight: 140, // 含與下一天之間的間距
};
const CHART_LEFT = 80;
const CHART_RIGHT = 820;
const ICON_SIZE = 14;
// 輔助線：從圖示垂直延伸，對準時間位置
const GuideLine = ({ cx, y1, y2, color }) => (
  <line x1={cx} y1={y1} x2={cx} y2={y2} stroke={color} strokeWidth="1" strokeDasharray="2,3" opacity="0.6" />
);

// 時間點：圖示中心在 (cx, cy)，時間標在圖示右邊
const TimeMarker = ({ cx, cy, color, textColor, Icon, label }) => (
  <g>
    <Icon x={cx - ICON_SIZE / 2} y={cy - ICON_SIZE / 2} size={ICON_SIZE} color={color} strokeWidth={2.5} />
    <text x={cx + ICON_SIZE / 2 + 4} y={cy + 4} fontSize="11" fill={textColor}>
      {label}
    </text>
  </g>
);

const CARD_STYLES = {
  red: { bg: 'bg-red-50', title: 'text-red-700', text: 'text-red-600' },
  purple: { bg: 'bg-purple-50', title: 'text-purple-700', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', title: 'text-orange-700', text: 'text-orange-600' },
  teal: { bg: 'bg-teal-50', title: 'text-teal-700', text: 'text-teal-600' },
  gray: { bg: 'bg-gray-50', title: 'text-gray-700', text: 'text-gray-600' },
};

const SinglePeriodSleepAnalysis = () => {
  const [selectedDate, setSelectedDate] = useState(toLocalDateString(new Date()));
  const [timePeriod, setTimePeriod] = useState('today-tomorrow');
  const [normalSleepTime, setNormalSleepTime] = useState('23:00');
  const [normalWakeTime, setNormalWakeTime] = useState('07:00');
  const [actualSleepTime, setActualSleepTime] = useState('23:30');
  const [actualWakeTime, setActualWakeTime] = useState('07:30');

  // 清空欄位會得到空字串，忽略它以免計算出 NaN
  const keepIfFilled = (setter) => (e) => {
    if (e.target.value) setter(e.target.value);
  };

  const timeToHours = (timeStr) => timeToMinutes(timeStr) / 60;

  const formatDate = (dateStr, offset = 0) => {
    const date = parseLocalDate(dateStr);
    date.setDate(date.getDate() + offset);
    return {
      full: date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      }),
      short: date.toLocaleDateString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
      }),
    };
  };

  const generateTimeMarks = (top) => {
    const axisY = top + LAYOUT.axis;
    const marks = [];
    for (let i = 0; i < 24; i += 2) {
      const x = getXPosition(i);
      marks.push(
        <g key={`${top}-${i}`}>
          <line x1={x} y1={axisY} x2={x} y2={top + LAYOUT.majorTickEnd} stroke="#6b7280" strokeWidth="1" />
          <text x={x} y={top + LAYOUT.hourText} textAnchor="middle" fontSize="11" fill="#6b7280" stroke="white" strokeWidth="3" paintOrder="stroke">
            {i.toString().padStart(2, '0')}
          </text>
        </g>
      );
    }
    for (let i = 1; i < 24; i += 2) {
      const x = getXPosition(i);
      marks.push(
        <line key={`${top}-${i}-minor`} x1={x} y1={axisY} x2={x} y2={top + LAYOUT.minorTickEnd} stroke="#9ca3af" strokeWidth="1" />
      );
    }
    return marks;
  };

  const getXPosition = (hours) => CHART_LEFT + (hours * (CHART_RIGHT - CHART_LEFT)) / 24;
  const timeX = (timeStr) => getXPosition(timeToHours(timeStr));

  // 一列 = 一天：入睡在第 1 天（長條畫到 24:00），起床在第 2 天（長條從 00:00 開始）
  const renderDayRow = ({ top, dayLabel, dayShort, normal, actual }) => {
    const iconHalf = ICON_SIZE / 2 + 2;
    const normalBarTop = top + LAYOUT.normalBarTop;
    return (
      <g key={top}>
        <text x="25" y={top + LAYOUT.axis - 4} fontSize="13" fontWeight="bold" fill="#374151">{dayLabel}</text>
        <text x="25" y={top + LAYOUT.axis + 12} fontSize="11" fill="#6b7280">{dayShort}</text>
        <text x="25" y={top + LAYOUT.axis + 26} fontSize="11" fill={actual.marker.textColor}>{actual.marker.label}</text>

        <GuideLine cx={normal.marker.cx} y1={top + LAYOUT.normalLane + iconHalf} y2={normalBarTop} color={normal.marker.color} />
        {/* 實際的輔助線從藍色長條底部畫到圖示；刻度數字有白框，經過時不會被切斷 */}
        <GuideLine cx={actual.marker.cx} y1={top + LAYOUT.actualBarTop + LAYOUT.barHeight} y2={top + LAYOUT.actualLane - iconHalf} color={actual.marker.color} />

        <rect x={normal.barStart} y={normalBarTop} width={normal.barEnd - normal.barStart} height={LAYOUT.barHeight} fill={COLORS.normalBar} rx="2" />
        <rect x={actual.barStart} y={top + LAYOUT.actualBarTop} width={actual.barEnd - actual.barStart} height={LAYOUT.barHeight} fill={COLORS.actualBar} rx="2" />

        <line x1={CHART_LEFT} y1={top + LAYOUT.axis} x2={CHART_RIGHT} y2={top + LAYOUT.axis} stroke="#374151" strokeWidth="2" />
        {generateTimeMarks(top)}

        <TimeMarker cy={top + LAYOUT.normalLane} {...normal.marker} />
        <TimeMarker cy={top + LAYOUT.actualLane} {...actual.marker} />
      </g>
    );
  };

  const getDateInfo = () => {
    if (timePeriod === 'yesterday-today') {
      return {
        firstDay: formatDate(selectedDate, -1),
        secondDay: formatDate(selectedDate, 0),
        firstDayLabel: '昨天',
        secondDayLabel: '今天',
      };
    }
    return {
      firstDay: formatDate(selectedDate, 0),
      secondDay: formatDate(selectedDate, 1),
      firstDayLabel: '今天',
      secondDayLabel: '明天',
    };
  };

  const dateInfo = getDateInfo();
  const sleepDiff = timeDiff(normalSleepTime, actualSleepTime);
  const wakeDiff = timeDiff(normalWakeTime, actualWakeTime);
  const actualSleepDuration = sleepDuration(actualSleepTime, actualWakeTime);
  const normalSleepDuration = sleepDuration(normalSleepTime, normalWakeTime);
  const durationDiff = actualSleepDuration - normalSleepDuration;

  // 差值為 0 時顯示「準時」，不歸類為晚或早
  const diffCard = (diff, lateLabel, earlyLabel, lateColor, earlyColor) => {
    if (diff === 0) return { label: '準時', color: 'gray', text: '與正常相同' };
    return diff > 0
      ? { label: lateLabel, color: lateColor, text: formatDuration(diff) }
      : { label: earlyLabel, color: earlyColor, text: formatDuration(diff) };
  };
  // 下一晚建議：每天最多往正常作息調整 1 小時
  const suggestion = suggestNextNight(normalSleepTime, normalWakeTime, actualSleepTime, actualWakeTime);
  const describeShift = (minutes) => {
    if (minutes === 0) return '不變';
    const { hours, minutes: mins } = splitMinutes(minutes);
    const amount = [hours && `${hours}小時`, mins && `${mins}分鐘`].filter(Boolean).join('');
    return `${minutes > 0 ? '延後' : '提早'}${amount}`;
  };
  const suggestionText = (() => {
    if (suggestion.alreadyNormal) return `維持 ${normalSleepTime} 睡、${normalWakeTime} 起`;
    const plan = `下一晚（${dateInfo.secondDay.short}）${suggestion.sleep} 睡、${suggestion.wake} 起`;
    if (suggestion.reachesNormal) return `${plan}，即可回到正常作息`;
    return `${plan}（睡覺${describeShift(suggestion.sleepShift)}、起床${describeShift(suggestion.wakeShift)}，逐步回到正常作息）`;
  })();

  const sleepCard = diffCard(sleepDiff, '晚睡時間', '早睡時間', 'red', 'purple');
  const wakeCard = diffCard(wakeDiff, '晚起時間', '早起時間', 'orange', 'teal');

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
          <Calendar className="text-blue-600" />
          睡眠時間分析圖表
        </h1>
        <p className="text-gray-600">分析單一時間段的睡眠模式</p>
      </div>

      {/* 控制面板 */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <ArrowRight size={16} />
              時間段選擇
            </h3>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="yesterday-today">昨天→今天</option>
              <option value="today-tomorrow">今天→明天</option>
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Calendar size={16} />
              基準日期
            </h3>
            <input
              type="date"
              value={selectedDate}
              onChange={keepIfFilled(setSelectedDate)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">正常作息時間</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Moon className="text-purple-600" size={16} />
                <label className="text-sm text-gray-700 w-12">睡覺:</label>
                <input
                  type="time"
                  value={normalSleepTime}
                  onChange={keepIfFilled(setNormalSleepTime)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Sun className="text-orange-500" size={16} />
                <label className="text-sm text-gray-700 w-12">起床:</label>
                <input
                  type="time"
                  value={normalWakeTime}
                  onChange={keepIfFilled(setNormalWakeTime)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">實際睡眠時間</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coffee className="text-red-500" size={16} />
                <label className="text-sm text-gray-700 w-12">睡覺:</label>
                <input
                  type="time"
                  value={actualSleepTime}
                  onChange={keepIfFilled(setActualSleepTime)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Coffee className="text-green-600" size={16} />
                <label className="text-sm text-gray-700 w-12">起床:</label>
                <input
                  type="time"
                  value={actualWakeTime}
                  onChange={keepIfFilled(setActualWakeTime)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 時間軸圖表 */}
      <div className="bg-white rounded-lg p-6 shadow-md overflow-x-auto">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {dateInfo.firstDayLabel} ({dateInfo.firstDay.short}) → {dateInfo.secondDayLabel} ({dateInfo.secondDay.short})
          </h3>
        </div>

        <svg width="900" height={10 + LAYOUT.rowHeight + LAYOUT.actualLane + 12} className="mx-auto">
          {renderDayRow({
            top: 10,
            dayLabel: dateInfo.firstDayLabel,
            dayShort: dateInfo.firstDay.short,
            normal: {
              barStart: timeX(normalSleepTime),
              barEnd: CHART_RIGHT,
              marker: { cx: timeX(normalSleepTime), color: COLORS.normalSleep, textColor: COLORS.normalSleepText, Icon: Moon, label: normalSleepTime },
            },
            actual: {
              barStart: timeX(actualSleepTime),
              barEnd: CHART_RIGHT,
              marker: { cx: timeX(actualSleepTime), color: COLORS.actualSleep, textColor: COLORS.actualSleepText, Icon: Coffee, label: actualSleepTime },
            },
          })}
          {/* 兩天之間的分隔線 */}
          <line x1="20" y1={10 + LAYOUT.rowHeight - 8} x2="860" y2={10 + LAYOUT.rowHeight - 8} stroke="#e5e7eb" strokeWidth="1" />
          {renderDayRow({
            top: 10 + LAYOUT.rowHeight,
            dayLabel: dateInfo.secondDayLabel,
            dayShort: dateInfo.secondDay.short,
            normal: {
              barStart: CHART_LEFT,
              barEnd: timeX(normalWakeTime),
              marker: { cx: timeX(normalWakeTime), color: COLORS.normalWake, textColor: COLORS.normalWakeText, Icon: Sun, label: normalWakeTime },
            },
            actual: {
              barStart: CHART_LEFT,
              barEnd: timeX(actualWakeTime),
              marker: { cx: timeX(actualWakeTime), color: COLORS.actualWake, textColor: COLORS.actualWakeText, Icon: Coffee, label: actualWakeTime },
            },
          })}
        </svg>

        <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-green-200 rounded"></div>
            <span>正常睡眠時間</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-blue-600 rounded"></div>
            <span>實際睡眠時間</span>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="text-purple-600" size={14} />
            <span>正常睡覺</span>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="text-orange-500" size={14} />
            <span>正常起床</span>
          </div>
          <div className="flex items-center gap-2">
            <Coffee className="text-red-500" size={14} />
            <span>實際睡覺</span>
          </div>
          <div className="flex items-center gap-2">
            <Coffee className="text-green-600" size={14} />
            <span>實際起床</span>
          </div>
        </div>
      </div>

      {/* 詳細分析 */}
      <div className="bg-white rounded-lg p-6 shadow-md mt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          {dateInfo.firstDayLabel}→{dateInfo.secondDayLabel} 睡眠分析
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[sleepCard, wakeCard].map((card) => (
            <div key={card.label + card.color} className={`p-3 rounded ${CARD_STYLES[card.color].bg}`}>
              <p className={`font-medium ${CARD_STYLES[card.color].title}`}>{card.label}</p>
              <p className={CARD_STYLES[card.color].text}>{card.text}</p>
            </div>
          ))}
          <div className="bg-green-50 p-3 rounded">
            <p className="font-medium text-green-700">實際睡眠</p>
            <p className="text-green-600">{formatDuration(actualSleepDuration)}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <p className="font-medium text-blue-700">正常睡眠</p>
            <p className="text-blue-600">{formatDuration(normalSleepDuration)}</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <span className="font-medium">睡眠差異:</span>{' '}
            {durationDiff === 0
              ? '與正常相同'
              : `${durationDiff > 0 ? '多睡' : '少睡'}${formatDuration(durationDiff)}`}
          </p>
          <p>
            <span className="font-medium">建議:</span> {suggestionText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SinglePeriodSleepAnalysis;
