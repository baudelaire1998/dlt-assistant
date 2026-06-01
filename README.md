# 大乐透助手 (DLT Assistant)

大乐透随机选号 & 中奖查询 Web 应用。

## 功能

- 🎯 **智能选号** — 随机生成 1/3/5 注大乐透号码
- 🏆 **中奖查询** — 手动输入号码，对照开奖结果查询是否中奖
- 📡 **实时数据** — 对接 [中国体育彩票官网](https://www.sporttery.cn) API，获取最新开奖号码
- 📋 **历史记录** — 保存查询历史（最多 100 条）

## 技术栈

- Node.js (原生 http 模块，零依赖)
- 纯 HTML/CSS/JS 前端

## 快速开始

```bash
node server.js
# 访问 http://localhost:3000
```

## 项目结构

```
dlt-assistant/
├── server.js           # Node.js 服务端（API 代理 + 静态文件）
├── public/
│   └── index.html      # 前端页面
└── history.json        # 查询历史记录
```

## API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/history` | GET | 获取查询历史 |
| `/api/history` | POST | 保存查询记录 |
| `/api/history` | DELETE | 清空历史 |
| `/api/latest-draw?count=N` | GET | 获取最新 N 期开奖号码 |
