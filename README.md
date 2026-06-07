# 睡眠時間分析圖表

互動式睡眠模式視覺化工具，將正常作息與實際睡眠時間對比呈現在 SVG 時間軸上，並自動計算晚睡、晚起、睡眠時長等差異數據。

**線上展示：** https://ryanchen0311.github.io/sleep-tracker/

---

## 功能

- 設定正常作息時間（睡覺 / 起床）與實際睡眠時間
- SVG 雙軸時間軸圖表，直觀呈現跨午夜的睡眠區間
- 支援「昨天→今天」和「今天→明天」兩種時間段模式
- 可選擇基準日期
- 自動計算：
  - 晚睡 / 早睡時間
  - 晚起 / 早起時間
  - 實際睡眠時長 vs 正常睡眠時長
  - 多睡 / 少睡差異

## 技術棧

| 類別 | 工具 |
|------|------|
| 前端框架 | [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| 樣式 | [Tailwind CSS](https://tailwindcss.com/) |
| 圖示 | [Lucide React](https://lucide.dev/) |
| 圖表 | 原生 SVG |
| 部署 | GitHub Pages（GitHub Actions 自動 CI/CD） |

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

開啟 http://localhost:5173 預覽。

## 建置與部署

```bash
# 建置 production
npm run build

# 預覽 production build
npm run preview
```

推送到 `main` 分支後，GitHub Actions 會自動建置並部署至 GitHub Pages。

## 專案結構

```
src/
├── components/
│   └── SinglePeriodSleepAnalysis.jsx   # 主要分析圖表元件
├── App.jsx
├── main.jsx
└── index.css
```
