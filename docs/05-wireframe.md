# Wireframe — Memex

> Source: Notion — 🎨 Wireframe — Memex
> Wireframe นี้เป็น low-fidelity สำหรับใช้วางแผนก่อนส่งให้ Claude Code สร้างจริง

## 1. Layout หลัก (App Shell)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔖 MEMEX                          🔍 Search...    👤 Settings │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  SIDEBAR     │  MAIN CONTENT AREA                           │
│              │                                              │
│ 📥 Inbox     │                                              │
│ ⭐ Starred   │                                              │
│ 🕐 Recent    │                                              │
│              │                                              │
│ COLLECTIONS  │                                              │
│ ─────────── │                                              │
│ 📁 Dev       │                                              │
│ 📁 Design    │                                              │
│ 📁 Travel    │                                              │
│ 📁 Reading   │                                              │
│ + New        │                                              │
│              │                                              │
│ TAGS         │                                              │
│ ─────────── │                                              │
│ #nextjs      │                                              │
│ #ai          │                                              │
│ #tools       │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

## 2. Bookmark List View (`/bookmarks`)

```
┌──────────────────────────────────────────────────────────────┐
│  All Bookmarks (248)          [Grid] [List] [Kanban]  ⚙ Sort │
├──────────────────────────────────────────────────────────────┤
│  🔍 Search bookmarks...                    🏷 Filter  + Add  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ [thumbnail]         │  │ [thumbnail]         │           │
│  │                     │  │                     │           │
│  │ Title of bookmark   │  │ Title of bookmark   │           │
│  │ description text..  │  │ description text..  │           │
│  │ ─────────────────── │  │ ─────────────────── │           │
│  │ #tag1 #tag2         │  │ #ai #tools          │           │
│  │ 🌐 domain.com  📅   │  │ 🌐 github.com  📅   │           │
│  │ ⭐ 📋 🗑           │  │ ⭐ 📋 🗑           │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 3. Add Bookmark (Quick Add Modal)

```
┌──────────────────────────────────────────┐
│  ➕ Add Bookmark                      ✕  │
├──────────────────────────────────────────┤
│                                          │
│  URL                                     │
│  ┌──────────────────────────────────┐   │
│  │ https://...                      │   │
│  └──────────────────────────────────┘   │
│                                          │
│  [thumbnail preview]  Title              │
│                        ┌──────────────┐  │
│                        │ Auto-fetched │  │
│                        └──────────────┘  │
│                       Description        │
│                        ┌──────────────┐  │
│                        │ Auto-fetched │  │
│                        └──────────────┘  │
│                                          │
│  Tags  🤖 AI suggested: #nextjs #tools   │
│  ┌──────────────────────────────────┐   │
│  │ #tag1  #tag2  + add tag          │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Collection                              │
│  ┌──────────────────────────────────┐   │
│  │ 📁 Select collection...          │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Note                                    │
│  ┌──────────────────────────────────┐   │
│  │ Add a note...                    │   │
│  └──────────────────────────────────┘   │
│                                          │
│            [Cancel]  [Save Bookmark]     │
└──────────────────────────────────────────┘
```

## 4. Bookmark Detail (Side Panel)

```
┌──────────────────────────────────────────┐
│  ← Back                           ✕ 🗑  │
├──────────────────────────────────────────┤
│  [OG Image / Thumbnail]                  │
│                                          │
│  ## Title of the Bookmark                │
│  🌐 domain.com · 📅 Mar 8, 2026          │
│  [Open URL ↗]                            │
├──────────────────────────────────────────┤
│  🤖 AI Summary                           │
│  ┌──────────────────────────────────┐   │
│  │ This article explains how to...  │   │
│  │ ...in 3 key points.              │   │
│  └──────────────────────────────────┘   │
├──────────────────────────────────────────┤
│  Tags                                    │
│  #nextjs  #ai  #tools  + add            │
│                                          │
│  Collection                              │
│  📁 Dev Tools                            │
│                                          │
│  Note                                    │
│  ┌──────────────────────────────────┐   │
│  │ Add a note...                    │   │
│  └──────────────────────────────────┘   │
├──────────────────────────────────────────┤
│  🔗 Similar Bookmarks                    │
│  • Another similar title...              │
│  • Related article...                    │
└──────────────────────────────────────────┘
```

## 5. AI Insights Dashboard (`/insights`)

```
┌──────────────────────────────────────────────────────────────┐
│  🤖 AI Insights                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │ 📊 This Week      │  │ 🏷 Top Topics     │               │
│  │ 24 bookmarks saved│  │ #ai (42)          │               │
│  │ +12% vs last week │  │ #nextjs (38)      │               │
│  │                   │  │ #tools (29)       │               │
│  └───────────────────┘  └───────────────────┘               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💬 Ask your bookmarks...                            │   │
│  │ "What did I save about React performance?"          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  📅 Weekly Digest — Mar 2–8, 2026                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ This week you saved 24 bookmarks across 5 topics.   │   │
│  │ Most active topic: #ai-tools (8 saves)              │   │
│  │ Suggested to read: 3 unread bookmarks from #nextjs  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  🗂 Smart Clusters (AI-generated)                           │
│  ┌──────────────────┐ ┌──────────────────┐                 │
│  │ 🤖 AI & LLMs     │ │ ⚛️ React Perf   │                 │
│  │ 12 bookmarks     │ │ 8 bookmarks      │                 │
│  │ [View cluster]   │ │ [View cluster]   │                 │
│  └──────────────────┘ └──────────────────┘                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 6. Settings — AI Provider (`/settings/ai`)

```
┌──────────────────────────────────────────────────────────────┐
│  ⚙️ Settings › AI Provider                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  AI Provider                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ● 🟠 Claude (Anthropic)   — Recommended             │  │
│  │  ○ 🟢 ChatGPT (OpenAI)                               │  │
│  │  ○ 🔵 Gemini (Google)                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  API Key                                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ sk-ant-••••••••••••••••••••••••  [Show] [Test] [Save]│  │
│  └──────────────────────────────────────────────────────┘  │
│  ✅ Connected — claude-sonnet-4-5                            │
│                                                              │
│  AI Features                                                 │
│  ☑ Auto-tagging on save                                     │
│  ☑ AI Summary on save                                       │
│  ☑ Weekly Digest                                            │
│  ☐ Generate embeddings (requires PostgreSQL)                │
│                                                              │
│  Fallback Provider  (ถ้า primary ล้มเหลว)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ None ▾                                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│                              [Save Settings]                 │
└──────────────────────────────────────────────────────────────┘
```

## 7. Search Results (`/search`)

```
┌──────────────────────────────────────────────────────────────┐
│  🔍 "react performance"                              ✕       │
├──────────────────────────────────────────────────────────────┤
│  [Keyword] [🤖 Semantic]                 12 results found    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [img] React Rendering Optimization Guide             │  │
│  │       domain.com · #react #performance               │  │
│  │       Saved Mar 5, 2026 · 📁 Dev                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [img] Why React re-renders and how to avoid it       │  │
│  │       blog.dev · #react #hooks                       │  │
│  │       Saved Feb 28, 2026 · 📁 Dev                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## User Flow หลัก

```
[Paste URL]
    ↓
[Auto-fetch metadata]
    ↓
[AI suggests tags + summary]
    ↓
[User confirms / edits]
    ↓
[Saved to DB]
    ↓
[Background: generate embedding]
    ↓
[Available in Search + Insights]
```

## Notes สำหรับ Claude Code

- ใช้ **shadcn/ui** สำหรับ components ทั้งหมด
- Sidebar collapse ได้บนมือถือ
- Side panel bookmark detail เปิดแบบ slide-in จากขวา
- Quick Add Modal เรียกได้ด้วย shortcut `Cmd+K` / `Ctrl+K`
- AI Summary แสดงแบบ streaming (ทีละ token)
- Dark mode รองรับทุกหน้า
