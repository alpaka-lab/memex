# Memex — Personal AI Bookmark Manager

> Source: Notion — 🔖 Memex — Personal AI Bookmark Manager

## Overview

โปรเจกต์ **Personal AI Bookmark Manager** — เว็บแอปสำหรับจัดการ bookmark ส่วนตัว คล้าย Raindrop.io แต่เพิ่มความสามารถด้าน AI เพื่อช่วยวิเคราะห์ จัดกลุ่ม และสังเกตพฤติกรรมการบันทึกข้อมูล

- สร้างด้วย Claude Code
- Open Source / Self-Hosted — ใครก็ deploy server ของตัวเองได้
- BYOAK — Bring Your Own API Key (Claude / Anthropic API)

## Core Concept

- **Web-based** bookmark manager ใช้งานผ่านเบราว์เซอร์
- บันทึก URL พร้อม metadata (title, description, thumbnail, tags)
- AI ช่วยวิเคราะห์ สังเกตพฤติกรรม และจัดกลุ่ม bookmark อัตโนมัติ
- เน้น personal use — ไม่ใช่ social/collaborative

## Features

### Core Bookmark Features

- บันทึก URL พร้อม auto-fetch title, description, OG image
- เพิ่ม tag, note, และ collection ด้วยตัวเอง
- ค้นหา full-text search ทั้ง title, note, tag
- Browser extension สำหรับ save ได้เลยขณะ browse
- Import/Export (Raindrop, Pocket, Chrome bookmarks)

### AI Features

- **Auto-tagging** — AI วิเคราะห์เนื้อหาของหน้าเว็บแล้วแนะนำ tag อัตโนมัติ
- **Smart Clustering** — จัดกลุ่ม bookmark ที่คล้ายกันโดยอัตโนมัติ แม้จะ tag ต่างกัน
- **Insight & Pattern Detection** — สังเกตว่าเราบันทึกเนื้อหาประเภทไหนบ่อย ช่วงเวลาไหน
- **AI Summary** — สรุปเนื้อหาของ bookmark แต่ละอัน (หรือทั้ง collection) ให้อ่านง่าย
- **Semantic Search** — ค้นหาด้วยความหมาย เช่น "บทความเกี่ยวกับ productivity" แทนที่จะพิมพ์ keyword ตรงๆ
- **Ask your bookmarks** — ถามคำถาม AI โดยใช้ bookmark ทั้งหมดเป็น knowledge base เช่น "มีอะไรที่ฉัน save เกี่ยวกับ crypto บ้าง?"
- **Duplicate & Similar Detection** — หา bookmark ที่ซ้ำหรือเนื้อหาคล้ายกันมาก
- **Weekly/Monthly Digest** — AI สรุปสิ่งที่ save ในช่วงสัปดาห์/เดือนที่ผ่านมา

### Organization Features

- Collections / Folders แบบ nested
- Smart Collections — filter อัตโนมัติตาม rule ที่กำหนด
- Kanban / List / Grid view
- Highlight & Archive
- Broken link checker

### Technical / Integration

- REST API สำหรับ integrate กับ tools อื่น
- Webhook support
- Mobile-friendly responsive UI
- Dark mode
- **GitHub Integration** — เชื่อมต่อบัญชี GitHub ได้โดยตรง รองรับ:
  - Star หน้า repo อัตโนมัติเมื่อ save GitHub URL
  - บันทึก repo พร้อม metadata ครบ — stars, language, description, topics
  - ติดตาม release เมื่อ repo ที่ bookmark ไว้มี version ใหม่
  - AI สรุปว่า repo นี้ทำอะไร เหมาะกับ use case ไหน

### Self-Hosting & Open Source

- **Docker support** — `docker compose up` แล้วใช้งานได้เลย
- **One-click deploy** รองรับ Railway, Render, Coolify
- ไม่มี vendor lock-in — ข้อมูลอยู่บน database ของตัวเอง
- **AI เป็น optional** — ไม่มี API Key ก็ใช้งานได้ในฐานะ bookmark manager ปกติ
- **Multi AI Provider** รองรับครบ:
  - Claude (Anthropic) — แนะนำ
  - ChatGPT (OpenAI — GPT-4o, GPT-4.1)
  - Gemini (Google — Gemini 1.5 Pro / 2.0 Flash)
- **Config API Key ผ่าน UI** — ไปที่ Settings → AI Provider แล้วใส่ key ได้เลย ไม่ต้องแตะไฟล์ `.env`
- สลับ provider ได้ตลอดเวลา หรือตั้ง fallback provider ได้
- Config พื้นฐานผ่าน `.env` file ก็ยังรองรับ (สำหรับ power users)
- MIT License (TBD)

## Tech Stack (เบื้องต้น)

| Layer    | ตัวเลือก                              |
| -------- | ------------------------------------- |
| Frontend | Next.js + Tailwind CSS                |
| Backend  | Node.js / Bun                         |
| Database | PostgreSQL + pgvector (vector search)  |
| AI       | Claude API (Anthropic)                |
| Auth     | Clerk / NextAuth                      |
| Hosting  | Vercel + Railway / Supabase           |

## Roadmap (เบื้องต้น)

- [ ] **v0.1** — Basic CRUD bookmark + collection + tag
- [ ] **v0.2** — Auto-fetch metadata + browser extension
- [ ] **v0.3** — AI auto-tagging + summary
- [ ] **v0.4** — Semantic search + smart clustering
- [ ] **v0.5** — Insight dashboard + weekly digest
- [ ] **v0.6** — GitHub Integration (star, repo metadata, release tracker)
- [ ] **v1.0** — Polish UI + mobile + API
