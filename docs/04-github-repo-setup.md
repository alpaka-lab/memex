# GitHub Repo Setup — Memex

> Source: Notion — 🐙 GitHub Repo Setup — Memex

## ขั้นตอนสร้าง GitHub Repo

### 1. สร้าง Repo

ไปที่ github.com/new แล้วตั้งค่าดังนี้:

| Field           | ค่า     |
| --------------- | ------- |
| Repository name | `memex` |
| Visibility      | Public  |
| Add README      | ✅      |
| .gitignore      | Node    |
| License         | MIT     |

**Description แนะนำ:**

```
A self-hosted, open-source personal AI bookmark manager. Supports Claude, OpenAI, and Gemini via BYOAK.
```

### 2. ตั้งค่า Repo Topics (Tags)

```
bookmark-manager, self-hosted, open-source, nextjs, ai, claude, openai, gemini, sqlite, postgresql
```

### 3. README.md เบื้องต้น

```markdown
# Memex 🔖

> A self-hosted, open-source personal AI bookmark manager

![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

Memex helps you save, organize, and understand your bookmarks using AI.
Bring your own API key (Claude, OpenAI, or Gemini) — or use it as a plain bookmark manager without any AI.

## ✨ Features
- 🤖 AI auto-tagging, summarization, and semantic search
- 🏠 Self-hosted — your data stays on your server
- 🔑 BYOAK — configure your AI provider via UI
- 🐳 One-command deploy with Docker
- 🛢️ SQLite (default) or PostgreSQL

## 🚀 Quick Start

```
docker compose up
```

Open http://localhost:3000 and configure your AI provider in Settings.

## 🛠️ Tech Stack
Next.js 15 · Tailwind CSS · shadcn/ui · Drizzle ORM · SQLite / PostgreSQL

## 📄 License
MIT
```

### 4. หลังจากสร้าง repo แล้ว

- [ ] คัดลอก repo URL มาใส่ใน Notion หน้า Memex
- [ ] เพิ่ม task "สร้าง GitHub repo" ใน To-Do เป็น เสร็จแล้ว
- [ ] เริ่มใช้ Claude Code สร้าง project structure
