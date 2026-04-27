# 🚨 40 Building Emergency Alert System

ระบบแจ้งเหตุฉุกเฉินและแจ้งซ่อมอาคาร 40 มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB)

---

## ภาพรวม (Overview)

เว็บแอปพลิเคชันสำหรับบริหารจัดการเหตุฉุกเฉินและการแจ้งซ่อมภายในอาคาร 40 โดยแบ่งผู้ใช้งานออกเป็น 3 กลุ่ม:

| กลุ่มผู้ใช้ | สิทธิ์การใช้งาน |
|---|---|
| **ประชาชนทั่วไป** | แจ้งเหตุฉุกเฉิน / แจ้งซ่อม ดูสถานะรายงาน |
| **Admin** | รับเรื่อง จัดการข้อมูล เพิ่ม Admin/Operator |
| **Operator** | อัปเดตผลการดำเนินงาน (Success / Failed) |

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Icons | Lucide React |
| Password Hashing | Node.js `scrypt` + `timingSafeEqual` |
| Session | localStorage (10 นาที) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│                                                             │
│  ┌──────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │  Public  │  │  Admin Pages  │  │  Operator Pages    │  │
│  │  Pages   │  │  (Protected)  │  │  (Protected)       │  │
│  └────┬─────┘  └──────┬────────┘  └─────────┬──────────┘  │
│       │               │                       │             │
│       │       localStorage Session            │             │
│       │       (10 min timeout)                │             │
└───────┼───────────────┼───────────────────────┼─────────────┘
        │               │                       │
        ▼               ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes (Server)                 │
│                                                             │
│  /api/submit_emergency    /api/verify_admin                 │
│  /api/submit_breakdown    /api/verify_operator              │
│  /api/add_admin           /api/add_operator                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase (PostgreSQL)                   │
│                                                             │
│  emergency_data   breakdown_data   admin_data   operator_data│
└─────────────────────────────────────────────────────────────┘
```

---

## โครงสร้างโปรเจค (Project Structure)

```
emergency_alert/
├── app/
│   ├── page.tsx                  # หน้าหลัก — ตารางสถานะ Emergency & Breakdown
│   ├── emergency/page.tsx        # ฟอร์มแจ้งเหตุฉุกเฉิน
│   ├── breakdown/page.tsx        # ฟอร์มแจ้งซ่อม
│   ├── contact/page.tsx          # ข้อมูลติดต่อ
│   ├── login_admin/page.tsx      # หน้า Login สำหรับ Admin
│   ├── admin_page/page.tsx       # แดชบอร์ด Admin (Protected)
│   ├── add_admin/page.tsx        # เพิ่ม Admin ใหม่ (Protected)
│   ├── add_operator/page.tsx     # เพิ่ม Operator ใหม่ (Protected)
│   ├── operator_login/page.tsx   # หน้า Login สำหรับ Operator
│   ├── operator_page/page.tsx    # แดชบอร์ด Operator (Protected)
│   ├── layout.tsx                # Root Layout
│   └── api/
│       ├── submit_emergency/route.ts
│       ├── submit_breakdown/route.ts
│       ├── verify_admin/route.ts
│       ├── verify_operator/route.ts
│       ├── add_admin/route.ts
│       └── add_operator/route.ts
│
├── components/
│   ├── Navbar.tsx                # Navigation bar (responsive, EN/TH toggle)
│   ├── Footer.tsx                # Footer พร้อมเบอร์ติดต่อ
│   └── ClientLayout.tsx          # Wrapper: LanguageProvider + Navbar + Footer
│
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── adminSession.ts           # Admin session helpers (set/clear/validate)
│   ├── operatorSession.ts        # Operator session helpers
│   ├── useAdminSession.ts        # Hook ป้องกันหน้า Admin (auto-redirect)
│   ├── useOperatorSession.ts     # Hook ป้องกันหน้า Operator (auto-redirect)
│   └── LanguageContext.tsx       # i18n Context (EN / TH)
│
├── public/
│   ├── KMUTNB_Logo.svg.png
│   ├── emergency_cat.png         # Mascot หน้า Emergency
│   └── breakdown_dog.png         # Mascot หน้า Breakdown
│
├── .env.local                    # Environment variables (ไม่ commit)
└── .env.example                  # ตัวอย่าง Environment variables
```

---

## Database Schema

### `emergency_data`
| Column | Type | Description |
|---|---|---|
| `id` | int | Primary key |
| `created_at` | timestamp | เวลาที่แจ้ง |
| `floor` | text | ชั้นที่เกิดเหตุ |
| `description` | text | รายละเอียด |
| `email` | text | อีเมลผู้แจ้ง |
| `status` | text | `Waiting` → `In Process` → `Success` / `Failed` |

### `breakdown_data`
| Column | Type | Description |
|---|---|---|
| `id` | int | Primary key |
| `created_at` | timestamp | เวลาที่แจ้ง |
| `breakdown_type` | text | ประเภท (ไฟฟ้า / ประปา / แอร์ ฯลฯ) |
| `floor` | text | ชั้นที่เกิดเหตุ |
| `description` | text | รายละเอียด |
| `email` | text | อีเมลผู้แจ้ง |
| `status` | text | `Waiting` → `In Process` → `Success` / `Failed` |

### `admin_data`
| Column | Type | Description |
|---|---|---|
| `id` | int | Primary key |
| `first_name` | text | ชื่อ |
| `last_name` | text | นามสกุล |
| `email` | text | อีเมล (ใช้ login) |
| `password` | text | `salt:hash` (scrypt) |

### `operator_data`
| Column | Type | Description |
|---|---|---|
| `id` | int | Primary key |
| `first_name` | text | ชื่อ |
| `last_name` | text | นามสกุล |
| `email` | text | อีเมล (ใช้ login) |
| `password` | text | `salt:hash` (scrypt) |

---

## User Flow

### 1. แจ้งเหตุฉุกเฉิน / แจ้งซ่อม (ประชาชน)
```
เลือก Emergency หรือ Breakdown ใน Navbar
    → กรอกฟอร์ม (ชั้น, รายละเอียด, อีเมล)
    → ส่งข้อมูล → บันทึกลง Supabase (status: "Waiting")
    → แสดงในตารางหน้าหลัก
```

### 2. Admin Workflow
```
Login (/login_admin)  →  แดชบอร์ด Admin (/admin_page)
    → เห็นรายการทั้งหมด (Emergency + Breakdown)
    → กด "รับเรื่อง" → status เปลี่ยนเป็น "In Process"
    → เพิ่ม Admin / Operator ใหม่ได้
    → Logout → session ถูกล้าง
```

### 3. Operator Workflow
```
Login (/operator_login)  →  แดชบอร์ด Operator (/operator_page)
    → เห็นรายการที่ "In Process"
    → กด "Success" หรือ "Failed" → อัปเดตสถานะ
    → Logout → session ถูกล้าง
```

### 4. Status Flow
```
Waiting  →  In Process  →  Success
                        →  Failed
```

---

## Session Management

- Session เก็บใน **localStorage** พร้อม timestamp หมดอายุ
- **timeout: 10 นาที**
- ทุกครั้งที่มี activity (mouse / keyboard / scroll / touch) จะ **reset timer**
- ระบบเช็ค session ทุก **30 วินาที**
- ถ้าหมด session → redirect กลับหน้า login อัตโนมัติ
- ถ้ายังมี session อยู่แล้วกด Admin/Operator ใน Navbar → **redirect ไป dashboard เลย**

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/submit_emergency` | บันทึกการแจ้งเหตุฉุกเฉิน |
| POST | `/api/submit_breakdown` | บันทึกการแจ้งซ่อม |
| POST | `/api/verify_admin` | ตรวจสอบ credentials Admin |
| POST | `/api/verify_operator` | ตรวจสอบ credentials Operator |
| POST | `/api/add_admin` | เพิ่ม Admin ใหม่ |
| POST | `/api/add_operator` | เพิ่ม Operator ใหม่ |

---

## การติดตั้ง (Setup)

### 1. Clone และติดตั้ง dependencies
```bash
git clone <repo-url>
cd emergency_alert
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` จาก `.env.example`:
```bash
cp .env.example .env.local
```

แก้ไขค่าใน `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SECRET_KEY=<service-role-key>
```

### 3. ตั้งค่า Supabase
สร้าง table ใน Supabase ตาม Schema ด้านบน และตั้ง RLS Policy:
```sql
create policy "allow_insert_emergency"
on "public"."emergency_data"
as PERMISSIVE for ALL to anon
using (true) with check (true);
```
ทำเช่นเดียวกันกับ `breakdown_data`, `admin_data`, `operator_data`

### 4. รัน Development Server
```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:3000`

---

## Default Admin Account

> ⚠️ เปลี่ยนรหัสผ่านนี้ก่อน deploy จริง

| Username | Password |
|---|---|
| `admin` | `admin1234` |

---

## Features

- **Bilingual UI** — รองรับภาษาไทยและอังกฤษ สลับได้ใน Navbar
- **Real-time table** — ตารางแสดงข้อมูลล่าสุดจาก Supabase
- **Role-based access** — Public / Admin / Operator แยกสิทธิ์ชัดเจน
- **Status tracking** — Waiting → In Process → Success / Failed
- **Secure password** — scrypt hashing + timing-safe comparison
- **Session guard** — auto-redirect เมื่อ session หมดอายุ
- **Responsive design** — รองรับ mobile และ desktop
