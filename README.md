# 拍照识词导出助手 · WordPhoto Export Assistant

<p align="center">
  <strong>📷 拍照 → 🔤 OCR识别 → 📖 词典匹配 → 📦 多格式导出</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/platform-微信小程序-green" alt="Platform">
  <img src="https://img.shields.io/badge/cloud-微信云开发-07C160" alt="CloudBase">
  <img src="https://img.shields.io/badge/OCR-腾讯云OCR-orange" alt="OCR">
  <img src="https://img.shields.io/badge/dict-500%2B内置词库-purple" alt="Dict">
  <img src="https://img.shields.io/badge/export-9种格式-red" alt="Export">
</p>

---

## 📖 项目简介

**拍照识词导出助手**是一款基于微信云开发的小程序工具，支持拍照或从相册选择英文文本图片，通过 OCR 识别英文单词，匹配内置词典获取中文释义，并导出为 9 种主流背词软件的导入格式。

> **一句话定位**：打通"拍照识词"到"背词软件"的最后一公里，零服务器成本，开箱即用。

### 核心价值

| 价值维度 | 说明 |
|----------|------|
| **零服务器成本** | 基于微信云开发，无需购买云服务器、无需备案域名 |
| **免域名审核** | 云函数天然免审，微信开发者工具直接调试 |
| **识词 + 理解 + 导出** | 一体化流水线，3 秒完成从拍照到可导入文件 |
| **9 种格式全覆盖** | 兼容 Anki、墨墨、不背、欧路、百词斩、有道、Quizlet 等 7 大 App |
| **500+ 内置词库** | 覆盖 CET4/CET6/考研/雅思/托福/GRE 高频词汇 |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     📱 用户层 (小程序)                     │
│         拍照 → 相册选择 → 结果展示 → 格式导出               │
└─────────────────────┬───────────────────────────────────┘
                      │ wx.cloud.callFunction()
                      ▼
┌─────────────────────────────────────────────────────────┐
│               ☁️ 微信云开发 (CloudBase)                   │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  ocr     │  │  dictLookup  │  │     export       │  │
│  │ OCR识别  │  │  词典查词    │  │   9格式导出      │  │
│  │ 云函数   │  │  云函数      │  │   云函数         │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘  │
│       │               │                    │            │
│       ▼               ▼                    ▼            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ 云存储   │  │ 500+内置词库 │  │   云存储          │  │
│  │ (图片)   │  │ (词典数据)   │  │   (导出文件)      │  │
│  └──────────┘  └──────────────┘  └──────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> 点击查看 [产品架构图 SVG](https://raw.githubusercontent.com/feilun/wordphoto-app/main/docs/architecture-diagram.svg)

---

## 📁 项目结构

```
wordphoto-app/
├── cloudfunctions/                  # 微信云函数
│   ├── ocr/                         # OCR 识别云函数
│   │   ├── index.js                 # 接入腾讯云 OCR API
│   │   ├── package.json
│   │   └── config.json
│   ├── dictLookup/                  # 词典查词云函数
│   │   ├── index.js                 # 500+ 内置核心词库
│   │   ├── package.json
│   │   └── config.json
│   └── export/                      # 导出生成云函数
│       ├── index.js                 # 9 种格式导出引擎
│       ├── package.json
│       └── config.json
│
├── miniprogram/                     # 微信小程序前端
│   ├── app.js                       # 全局入口 (云开发初始化)
│   ├── app.json                     # 全局配置
│   ├── app.wxss                     # 全局样式
│   ├── pages/
│   │   ├── index/                   # 首页 — 拍照/相册入口
│   │   ├── result/                  # 识别结果页 — 单词列表 + 编辑
│   │   └── export/                  # 导出页 — 9 种格式选择 + 下载
│   └── utils/
│       └── api.js                   # 云函数调用封装
│
├── backend/                         # Python FastAPI 后端 (参考实现)
│   ├── main.py                      # 应用入口
│   ├── requirements.txt
│   ├── setup_data.py
│   ├── routers/
│   │   ├── ocr.py
│   │   └── export.py
│   └── services/
│       ├── ocr_service.py           # PaddleOCR PP-OCRv3 封装
│       ├── word_parser.py           # spaCy + NLTK WordNet 词形还原
│       ├── dict_service.py          # ECDICT 150万词条查询
│       └── export_service.py        # 9 种格式导出引擎
│
├── docs/
│   └── architecture-diagram.svg     # 产品架构图
├── project.config.json              # 小程序项目配置 (含 cloudbaseRoot)
├── project.private.config.json      # 私有配置 (含 AppID)
├── sitemap.json                     # 搜索规则
├── .gitignore
├── LICENSE                          # MIT License
└── README.md                        # 本文件
```

---

## 🚀 快速开始（5 分钟部署）

### 前置条件

| 依赖 | 说明 |
|------|------|
| 微信开发者工具 | [下载最新稳定版](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) |
| 微信小程序 AppID | 注册地址: [mp.weixin.qq.com](https://mp.weixin.qq.com) |
| 微信云开发环境 | 在微信开发者工具中开通（免费额度足够演示） |

### 步骤 1：克隆项目

```bash
git clone https://github.com/xiechun-pm/wordphoto-app.git
cd wordphoto-app
```

### 步骤 2：开通云开发

1. 打开**微信开发者工具** → 导入项目 → 填入 `wordphoto-app` 目录
2. 填入小程序 AppID（`project.private.config.json` 中配置）
3. 点击工具栏「云开发」→ 开通云环境 → 创建环境（建议选择「按量付费」，免费额度充足）
4. 记录你的**环境 ID**（如 `wordphoto-xxx`）

### 步骤 3：配置环境 ID

打开 `miniprogram/app.js`，将环境 ID 填入：

```js
wx.cloud.init({
  env: 'your-env-id',  // ← 替换为你的云环境 ID
  traceUser: true,
});
```

### 步骤 4：部署云函数

1. 在微信开发者工具左侧栏 → 展开 `cloudfunctions/` 目录
2. 右键每个云函数文件夹（`ocr`、`dictLookup`、`export`）→ 选择「上传并部署：云端安装依赖」
3. 等待部署完成（约 1-2 分钟）

### 步骤 5：启用 OCR（关键步骤）

OCR 云函数需要接入腾讯云 OCR API 才能完整运行：

1. 开通 [腾讯云 OCR 服务](https://console.cloud.tencent.com/ocr)（每月免费 1000 次）
2. 获取 SecretId 和 SecretKey
3. 打开 `cloudfunctions/ocr/index.js`，取消「方案 A」注释并填入密钥
4. 重新部署 `ocr` 云函数

> 未启用 OCR API 时，小程序可正常演示 UI 流程和词典/导出功能。

### 步骤 6：运行

点击微信开发者工具「预览」→ 扫码体验 → 拍照识词 → 导出！

---

## 📡 云函数接口

### ocr — OCR 识别

| 项目 | 说明 |
|------|------|
| 调用方式 | `wx.cloud.callFunction({ name: 'ocr', data: { fileID } })` |
| 输入 | `fileID` — 云存储图片文件 ID |
| 输出 | `{ code, data: { raw_text, words[], total } }` |

### dictLookup — 词典查词

| 项目 | 说明 |
|------|------|
| 调用方式 | `wx.cloud.callFunction({ name: 'dictLookup', data: { words[] } })` |
| 输入 | `words` — 单词数组 |
| 输出 | `{ code, data: { meanings{}, not_found[], total, matched } }` |

### export — 导出生成

| 项目 | 说明 |
|------|------|
| 调用方式 | `wx.cloud.callFunction({ name: 'export', data: { format, words[] } })` |
| 输入 | `format` — 格式标识, `words` — 单词列表 `[{word, meaning}]` |
| 输出 | `{ code, data: { fileID, download_url, filename, format, word_count } }` |

---

## 📦 支持导出格式（9 种）

| 格式 | 标识 | 文件类型 | 适配 App |
|------|------|----------|----------|
| 纯文本 | `txt` | .txt | 通用 |
| CSV | `csv` | .csv | Excel / 通用 |
| Anki | `anki` | .csv | **Anki** |
| 墨墨背单词 | `momo` | .txt | **墨墨背单词** |
| 不背单词 | `bubei` | .txt | **不背单词** |
| 欧路词典 | `eudic` | .xml | **欧路词典** |
| 百词斩 | `baicizhan` | .txt | **百词斩** |
| 有道词典 | `youdao` | .xml | **有道词典** |
| Quizlet | `quizlet` | .csv | **Quizlet** |

---

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | 微信小程序原生 | 基础库 2.x+ |
| **云平台** | 微信云开发 CloudBase | 云函数 + 云存储 + 云数据库 |
| **OCR 引擎** | 腾讯云 OCR API | 通用文字识别（英文），每月免费 1000 次 |
| **词典数据** | 内置词库 | 500+ CET4/CET6/考研/雅思/托福/GRE 高频词 |
| **参考后端** | Python FastAPI + PaddleOCR | 备选方案，详见 `backend/` 目录 |

### 架构选型决策

| 方案 | 优势 | 劣势 | 决策 |
|------|------|------|------|
| **微信云开发** | 零服务器成本、免域名备案、免审核、开箱即用 | OCR 需接入第三方 API | ✅ **采用** |
| FastAPI 自建后端 | 完全可控、PaddleOCR 离线可用 | 需服务器 + 域名备案 + HTTPS 证书 | 参考实现 |

---

## 🔮 迭代路线图

| 版本 | 主题 | 核心功能 |
|------|------|----------|
| **V1.0 MVP** | 核心验证期 | 拍照识别 → 9 种格式导出（当前版本） |
| **V1.1 增强** | 词典扩展期 | 接入云数据库 ECDICT 150 万词条 → 音标 + 词性 + 考试标签 |
| **V2.0 生态** | 商业扩展期 | 批量多图上传 · 云同步 · 账号系统 · 数据看板 |

---

## 📄 引用与致谢

1. skywind3000. [ECDICT: Free English to Chinese Dictionary Database](https://github.com/skywind3000/ECDICT). GitHub.
2. PaddlePaddle. [PaddleOCR: Awesome multilingual OCR toolkits](https://github.com/PaddlePaddle/PaddleOCR). GitHub.
3. Princeton University. [WordNet: An Electronic Lexical Database](https://wordnet.princeton.edu/).
4. 微信开放文档. [小程序云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html).
5. 腾讯云. [文字识别 OCR](https://cloud.tencent.com/product/ocr).

---

## 📄 License

本项目基于 **MIT License** 开源。详见 [LICENSE](LICENSE) 文件。

---

<p align="center">
  <sub>Built with ❤️ by 司朝阳 · AI 产品经理求职作品</sub>
</p>