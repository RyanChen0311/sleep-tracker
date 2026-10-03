import React, { useState } from 'react';
import { Moon, Sun, Coffee, Calendar, ArrowRight } from 'lucide-react';
import {
  timeToMinutes,
  formatDuration,
  sleepDuration,
  timeDiff,
  parseLocalDate,
  toLocalDateString,
} from '../utils/sleepTime';

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

  const generateTimeMarks = (dayOffset = 0) => {
    const marks = [];
    for (let i = 0; i < 24; i += 2) {
      const x = 80 + (i * 740) / 24;
      marks.push(
        <g key={`${dayOffset}-${i}`}>
          <line x1={x} y1={60 + dayOffset * 180} x2={x} y2={80 + dayOffset * 180} stroke="#374151" strokeWidth="2" />
          <line x1={x} y1={80 + dayOffset * 180} x2={x} y2={95 + dayOffset * 180} stroke="#6b7280" strokeWidth="1" />
          <text x={x} y={110 + dayOffset * 180} textAnchor="middle" fontSize="11" fill="#6b7280">
            {i.toString().padStart(2, '0')}
          </text>
        </g>
      );
    }
    for (let i = 1; i < 24; i += 2) {
      const x = 80 + (i * 740) / 24;
      marks.push(
        <line key={`${dayOffset}-${i}-minor`} x1={x} y1={60 + dayOffset * 180} x2={x} y2={70 + dayOffset * 180} stroke="#9ca3af" strokeWidth="1" />
      );
    }
    return marks;
  };

  const getXPosition = (hours) => 80 + (hours * 740) / 24;
  const clampLabelX = (x) => Math.max(110, Math.min(790, x));

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

        <svg width="900" height="280" className="mx-auto">
          <defs>
            <linearGradient id="normalSleepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="actualSleepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          <text x="25" y="45" fontSize="13" fontWeight="bold" fill="#374151">{dateInfo.firstDayLabel}</text>
          <text x="25" y="60" fontSize="11" fill="#6b7280">{dateInfo.firstDay.short}</text>
          <line x1="80" y1="60" x2="820" y2="60" stroke="#374151" strokeWidth="2" />
          {generateTimeMarks(0)}

          <text x="25" y="225" fontSize="13" fontWeight="bold" fill="#374151">{dateInfo.secondDayLabel}</text>
          <text x="25" y="240" fontSize="11" fill="#6b7280">{dateInfo.secondDay.short}</text>
          <line x1="80" y1="240" x2="820" y2="240" stroke="#374151" strokeWidth="2" />
          {generateTimeMarks(1)}

          {/* 正常睡眠區間 */}
          <rect x={getXPosition(timeToHours(normalSleepTime))} y={45} width={820 - getXPosition(timeToHours(normalSleepTime))} height={20} fill="url(#normalSleepGradient)" rx="3" />
          <rect x={80} y={225} width={getXPosition(timeToHours(normalWakeTime)) - 80} height={20} fill="url(#normalSleepGradient)" rx="3" />

          {/* 實際睡眠區間 */}
          <rect x={getXPosition(timeToHours(actualSleepTime))} y={50} width={820 - getXPosition(timeToHours(actualSleepTime))} height={10} fill="url(#actualSleepGradient)" rx="2" />
          <rect x={80} y={230} width={getXPosition(timeToHours(actualWakeTime)) - 80} height={10} fill="url(#actualSleepGradient)" rx="2" />

          {/* 時間點 */}
          <circle cx={getXPosition(timeToHours(normalSleepTime))} cy="60" r="4" fill="#6366f1" />
          <circle cx={getXPosition(timeToHours(normalWakeTime))} cy="240" r="4" fill="#f59e0b" />
          <circle cx={getXPosition(timeToHours(actualSleepTime))} cy="60" r="3" fill="#ef4444" />
          <circle cx={getXPosition(timeToHours(actualWakeTime))} cy="240" r="3" fill="#10b981" />

          {/* 標籤 */}
          <text x={clampLabelX(getXPosition(timeToHours(normalSleepTime)))} y="32" textAnchor="middle" fontSize="11" fill="#4f46e5">
            正常睡覺 {normalSleepTime}
          </text>
          <text x={clampLabelX(getXPosition(timeToHours(normalWakeTime)))} y="212" textAnchor="middle" fontSize="11" fill="#d97706">
            正常起床 {normalWakeTime}
          </text>
          <text x={clampLabelX(getXPosition(timeToHours(actualSleepTime)))} y="20" textAnchor="middle" fontSize="11" fill="#dc2626">
            實際睡覺 {actualSleepTime}
          </text>
          <text x={clampLabelX(getXPosition(timeToHours(actualWakeTime)))} y="200" textAnchor="middle" fontSize="11" fill="#059669">
            實際起床 {actualWakeTime}
          </text>
        </svg>

        <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded opacity-30"></div>
            <span>正常睡眠時間</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-gradient-to-r from-green-500 to-green-600 rounded opacity-60"></div>
            <span>實際睡眠時間</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span>正常睡覺</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>正常起床</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>實際睡覺</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
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
            <span className="font-medium">睡眠時段:</span>{' '}
            {dateInfo.firstDay.short} {actualSleepTime} → {dateInfo.secondDay.short} {actualWakeTime}
          </p>
          <p>
            <span className="font-medium">睡眠差異:</span>{' '}
            {durationDiff === 0
              ? '與正常相同'
              : `${durationDiff > 0 ? '多睡' : '少睡'}${formatDuration(durationDiff)}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SinglePeriodSleepAnalysis;
