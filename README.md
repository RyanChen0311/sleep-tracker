# 睡眠時間分析圖表

互動式睡眠模式視覺化工具，幫助你分析熬夜習慣與正常作息之間的差異。

**線上展示：** https://RyanChen0311.github.io/sleep-analysis-chart/

## 功能

- 設定正常作息時間（睡覺 / 起床）
- 輸入實際睡眠時間，與正常作息進行對比
- SVG 時間軸圖表直觀呈現跨午夜的睡眠區間
- 自動計算晚睡 / 早睡時間、晚起 / 早起時間、實際睡眠時長與差異
- 支援「昨天→今天」和「今天→明天」兩種時間段模式

## 技術

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)
- 部署於 GitHub Pages（GitHub Actions 自動 CI/CD）

## 本地開發

```bash
npm install
npm run dev
```

## 部署

推送到 `main` 分支後 GitHub Actions 會自動建置並部署至 GitHub Pages。
