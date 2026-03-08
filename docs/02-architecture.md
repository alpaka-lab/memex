# Architecture Overview

> Source: Notion — 🏗️ Architecture Overview

## Overview

เอกสารนี้อธิบาย architecture โดยรวมของโปรเจกต์ Personal AI Bookmark Manager ตั้งแต่ tech stack, โครงสร้าง project, การไหลของข้อมูล ไปจนถึง AI integration layer

## Tech Stack

### Frontend

| Layer            | Technology                    | หมายเหตุ                  |
| ---------------- | ----------------------------- | ------------------------- |
| Framework        | **Next.js 15** (App Router)   | SSR + SSG + API Routes    |
| Styling          | **Tailwind CSS**              | Utility-first             |
| UI Components    | **shadcn/ui**                 | Accessible, customizable  |
| State Management | **Zustand** หรือ React Context | lightweight               |
| Data Fetching    | **TanStack Query**            | caching + revalidation    |

### Backend

| Layer           | Technology                      | หมายเหตุ                        |
| --------------- | ------------------------------- | ------------------------------- |
| Runtime         | **Next.js API Routes** / **Bun** | monorepo หรือแยก service         |
| ORM             | **Drizzle ORM**                 | type-safe, รองรับ SQLite และ PostgreSQL |
| Auth            | **Lucia** หรือ **Better Auth**   | self-hosted friendly            |
| Background Jobs | **BullMQ** หรือ inline async     | สำหรับ AI processing             |

### Database

| Mode                    | Technology                    | เหมาะกับ                               |
| ----------------------- | ----------------------------- | -------------------------------------- |
| SQLite (default)        | **Turso** หรือ local file      | Self-host ง่าย ไม่ต้องตั้ง DB server     |
| PostgreSQL (optional)   | **PostgreSQL** + **pgvector**  | Production scale, semantic search      |

> รองรับทั้งสองแบบผ่าน Drizzle ORM — config เพียงบรรทัดเดียวใน `.env`

### AI Layer

| Provider             | Model แนะนำ          | ใช้งาน                          |
| -------------------- | -------------------- | ------------------------------- |
| Claude (Anthropic)   | claude-sonnet-4-5    | Auto-tag, summary, clustering   |
| OpenAI               | gpt-4o-mini          | ประหยัด cost สำหรับ batch         |
| Gemini               | gemini-2.0-flash     | เร็ว, ราคาถูก                    |

> ผู้ใช้ config API Key ผ่าน **Settings UI** — ไม่ต้องแตะไฟล์ config

## Project Structure

```
bookmark-app/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login / Register pages
│   ├── (app)/              # Main app (protected)
│   │   ├── bookmarks/      # Bookmark list & detail
│   │   ├── collections/    # Collection management
│   │   ├── search/         # Search page
│   │   ├── insights/       # AI Insights dashboard
│   │   └── settings/       # Settings + API Key config
│   └── api/                # API Routes
│       ├── bookmarks/      # CRUD endpoints
│       ├── ai/             # AI processing endpoints
│       └── auth/           # Auth endpoints
├── lib/
│   ├── db/                 # Drizzle schema + migrations
│   ├── ai/                 # AI provider abstraction layer
│   │   ├── providers/      # Claude, OpenAI, Gemini adapters
│   │   └── index.ts        # Unified AI interface
│   └── metadata/           # URL metadata fetcher
├── components/             # Shared UI components
├── docker-compose.yml      # Self-hosting setup
└── .env.example            # Template config
```

## Data Flow

### เมื่อ Save bookmark ใหม่

```
User paste URL
    → Frontend validates URL
    → API: fetch metadata (title, description, OG image)
    → Save to DB (pending AI)
    → Background job: AI auto-tag + summary
    → Update bookmark record
    → Generate vector embedding (ถ้าใช้ pgvector)
    → Return to user
```

### Semantic Search

```
User types query
    → Convert query to vector embedding (AI)
    → pgvector similarity search (PostgreSQL mode)
    → หรือ keyword search (SQLite mode)
    → Rank + return results
```

## AI Provider Abstraction

ระบบใช้ **Unified AI Interface** เพื่อให้สลับ provider ได้โดยไม่แก้ logic:

```typescript
// lib/ai/index.ts
interface AIProvider {
  summarize(content: string): Promise<string>
  generateTags(content: string): Promise<string[]>
  embed(text: string): Promise<number[]>
  chat(messages: Message[]): Promise<string>
}

// Providers: ClaudeProvider | OpenAIProvider | GeminiProvider
```

ผู้ใช้เลือก provider จาก **Settings → AI Provider** แล้วใส่ API Key — ระบบโหลด provider ที่ถูกต้องอัตโนมัติ

## Self-Hosting (Docker)

```yaml
# docker-compose.yml (SQLite mode — ง่ายที่สุด)
services:
  app:
    image: bookmark-app
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data   # SQLite DB
    env_file: .env
```

สำหรับ PostgreSQL mode เพิ่ม `db` service เข้าไปใน compose file

## Environment Variables

```
# Required
NEXTAUTH_SECRET=your-secret
DATABASE_URL=file:./data/bookmarks.db   # SQLite
# DATABASE_URL=postgresql://...          # PostgreSQL

# Optional — หรือ config ผ่าน UI ได้เลย
AI_PROVIDER=claude                       # claude | openai | gemini
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
```
