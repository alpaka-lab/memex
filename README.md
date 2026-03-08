# Memex

Personal AI Bookmark Manager — บันทึก จัดระเบียบ และค้นหา bookmarks ของคุณ แบบ self-hosted

> **v0.1** — Basic CRUD (Bookmark, Collection, Tag, Search)
> AI features (auto-tagging, smart summaries) จะมาใน v0.3+

## Features

- **Bookmark Management** — บันทึก URL พร้อมดึง metadata อัตโนมัติ (title, description, og:image, favicon)
- **Collections** — จัดกลุ่ม bookmarks เป็นหมวดหมู่
- **Tags** — ติด tag สีสันให้ bookmarks เพื่อค้นหาง่าย
- **Full-Text Search** — ค้นหาด้วย keyword ผ่าน title, description, note
- **Quick Add** — กด `Cmd+K` / `Ctrl+K` แล้ววาง URL เพื่อบันทึกทันที
- **Grid / List View** — สลับมุมมองได้ตามชอบ
- **Dark Mode** — รองรับ Light / Dark / System
- **Star & Archive** — ติดดาว bookmark สำคัญ หรือเก็บเข้า archive
- **Self-Hosted** — ข้อมูลเก็บบนเครื่องคุณเอง ไม่ส่งไปที่ไหน

## Tech Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · SQLite · Drizzle ORM · Better Auth · TanStack Query · Zustand

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** 10+

### Installation

```bash
# Clone
git clone https://github.com/alpaka-lab/memex.git
cd memex

# Install dependencies
npm install

# Setup environment
cp .env.example .env
```

แก้ไขไฟล์ `.env` — เปลี่ยน `BETTER_AUTH_SECRET` เป็น random string ยาวอย่างน้อย 32 ตัวอักษร:

```bash
# สร้าง secret อัตโนมัติ
openssl rand -base64 32
```

```env
DATABASE_URL=file:./data/memex.db
BETTER_AUTH_SECRET=your-random-secret-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Database Migration

```bash
npm run db:migrate
```

### Start Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) → สร้างบัญชี → เริ่มบันทึก bookmarks

---

## Docker

วิธีที่ง่ายที่สุดสำหรับ self-host:

```bash
# สร้าง secret ก่อน
export BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# Run
docker compose up -d
```

App จะพร้อมใช้ที่ [http://localhost:3000](http://localhost:3000)

ข้อมูล SQLite จะถูกเก็บใน Docker volume `memex-data` — ไม่หายแม้ restart container

### Custom Port

```bash
# เปลี่ยน port เป็น 8080
docker compose up -d --build -e PORT=8080
```

หรือแก้ `docker-compose.yml`:

```yaml
ports:
  - '8080:3000'
```

---

## Usage

### บันทึก Bookmark

1. กด `Cmd+K` (Mac) หรือ `Ctrl+K` (Windows/Linux)
2. วาง URL
3. ระบบจะดึง metadata ให้อัตโนมัติ (title, description, รูป)
4. เลือก Collection, เพิ่ม Tags, เขียน Note (optional)
5. กด Save

### จัดระเบียบ

- **Collections** — สร้างหมวดหมู่ เช่น "Design", "Dev Tools", "Read Later"
- **Tags** — ติด tag เช่น "react", "tutorial", "important"
- **Star** — ติดดาว bookmark ที่สำคัญ
- **Archive** — เก็บ bookmark ที่อ่านแล้วเข้า archive

### ค้นหา

พิมพ์ keyword ที่ช่อง Search ด้านบน — ระบบจะค้นหาจาก title, description, และ note ของทุก bookmark

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Quick Add bookmark |

---

## Development

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # Lint
npm run db:generate  # Generate migrations หลังแก้ schema
npm run db:migrate   # Run migrations
npm run db:studio    # เปิด Drizzle Studio ดู database
```

### Project Structure

```
src/
├── app/
│   ├── (app)/          # Protected routes (bookmarks, collections, search, settings)
│   ├── (auth)/         # Auth routes (login, register)
│   └── api/            # API routes
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── bookmarks/      # Bookmark-specific components
│   ├── layout/         # Sidebar, Header
│   └── providers/      # Theme, Query providers
└── lib/
    ├── db/             # Database schema, connection, FTS5, migrations
    ├── hooks/          # React Query hooks
    ├── stores/         # Zustand stores
    ├── auth.ts         # Better Auth (server)
    └── auth-client.ts  # Better Auth (client)
```

---

## License

MIT
