# 🚨 40 Building Emergency Alert System

ระบบแจ้งเหตุฉุกเฉินและแจ้งซ่อมอาคาร 40  
มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB)

| | |
|---|---|
| **GitHub** | https://github.com/baitankub-boop/emergency_alert |
| **Production** | https://emergency-alert-gilt.vercel.app |
| **Hosting** | Vercel (พร้อม deploy ✓) |

---

## 1. ภาพรวมระบบ (System Overview)

ระบบนี้ให้ผู้ใช้งานภายในอาคาร 40 แจ้งเหตุฉุกเฉินหรือแจ้งซ่อมได้ผ่านเว็บ โดยมีระบบแจ้งเตือน email อัตโนมัติไปยังทุกฝ่ายที่เกี่ยวข้อง และ Admin/Operator สามารถติดตาม อัปเดตสถานะ และดู Report ได้

### ผู้ใช้งาน 3 กลุ่ม

| กลุ่ม | วิธี Login | สิทธิ์ |
|---|---|---|
| **User** | Google OAuth หรือ Email+Password+OTP | แจ้งเหตุ · ดู/แก้ไข/ลบรายการตัวเอง |
| **Admin** | Email+Password (scrypt) · session 10 นาที | ดูทุก record · รับเรื่อง · แก้ไข/ลบ · Report · Export · เพิ่ม Admin/Operator |
| **Operator** | Email+Password (scrypt) · session 10 นาที | ดูทุก record · อัปเดตผล (Success/Failed) · แก้ไข/ลบ |

---

## 2. Tech Stack

| ส่วน | เทคโนโลยี | เวอร์ชัน |
|---|---|---|
| Framework | Next.js App Router | 16.0.7 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^3.4 |
| Database | Supabase (PostgreSQL) | ^2.91 |
| Auth (User) | Supabase Auth | PKCE + Email OTP |
| Auth (Admin/Operator) | Custom localStorage + scrypt | — |
| File Storage | Supabase Storage | — |
| Email | Nodemailer + Gmail SMTP | ^6 |
| Charts | SVG (ไม่มี library) | — |
| Excel Export | SheetJS (xlsx) | — |
| PDF Export | jsPDF + jspdf-autotable | — |
| i18n | Custom LanguageContext | TH / EN |
| Hosting | Vercel | — |

---

## 3. Context Diagram

```mermaid
graph TD
    U["👤 User\n(ผู้ใช้ทั่วไป)"]
    A["🛡️ Admin"]
    O["👷 Operator"]

    subgraph System["🏢 40 Building Alert System (Vercel)"]
        WEB["Next.js Web App"]
        API["API Routes\n(Server-side)"]
    end

    subgraph External["External Services"]
        SB["🗄️ Supabase\nDB · Auth · Storage"]
        GM["📧 Gmail SMTP\n(Nodemailer)"]
        GO["🔵 Google OAuth"]
    end

    U -- "แจ้งเหตุ / ดูสถานะ" --> WEB
    A -- "จัดการ / Report" --> WEB
    O -- "อัปเดตผล" --> WEB
    WEB --> API
    API -- "อ่าน/เขียนข้อมูล" --> SB
    API -- "ส่ง Email แจ้งเตือน+OTP" --> GM
    GM -- "Email" --> U
    GM -- "Email" --> A
    GM -- "Email" --> O
    U -- "Sign in with Google" --> GO
    GO -- "PKCE Callback" --> SB
    SB -- "Session Token" --> WEB
```

---

## 4. Architecture Diagram

```mermaid
graph LR
    subgraph Browser
        UI["React Components\n(Client)"]
    end

    subgraph Vercel["Vercel (Next.js)"]
        PAGES["App Router Pages\n/emergency\n/breakdown\n/admin_page\n/operator_page\n..."]
        ROUTES["API Routes\n/api/submit_emergency\n/api/submit_breakdown\n/api/send_registration_otp\n/api/verify_registration_otp\n/api/notify_status_change\n/api/verify_admin\n/api/verify_operator"]
        LIB["lib/\nsupabase.ts\nmailer.ts\nLanguageContext.tsx\nadminSession.ts\noperatorSession.ts"]
    end

    subgraph Supabase
        DB["PostgreSQL\nemergency_data\nbreakdown_data\nadmin_data\noperator_data\nregistration_otps"]
        AUTH["Auth\n(Google OAuth + Email OTP)"]
        STORAGE["Storage\nemergency-photos\nbreakdown-photos"]
    end

    GMAIL["Gmail SMTP"]

    UI --> PAGES
    PAGES --> ROUTES
    ROUTES --> LIB
    LIB --> DB
    LIB --> AUTH
    UI --> STORAGE
    ROUTES --> GMAIL
```

---

## 5. ER Diagram (Database Schema)

```mermaid
erDiagram
    emergency_data {
        int id PK
        timestamptz created_at
        text emergency_type "เป็นลม/อุบัติเหตุ/ทะเลาะ/พบโจร/ล่วงละเมิด/สัตว์กัด/อื่นๆ"
        text floor "ตัวเลข เช่น 3"
        text description
        text email "FK → auth.users.email"
        text status "Waiting/In Process/Success/Failed"
        text photo_url "nullable - Supabase Storage URL"
    }

    breakdown_data {
        int id PK
        timestamptz created_at
        text breakdown_type "ไฟฟ้า/ประปา/แอร์/ลิฟต์/อินเทอร์เน็ต/อุปกรณ์/อื่นๆ"
        text floor "ตัวเลข เช่น 3"
        text description
        text email "FK → auth.users.email"
        text status "Waiting/In Process/Success/Failed"
        text photo_url "nullable - Supabase Storage URL"
    }

    admin_data {
        int id PK
        text first_name
        text last_name
        text email
        text password "salt:hash (scrypt)"
    }

    operator_data {
        int id PK
        text first_name
        text last_name
        text email
        text password "salt:hash (scrypt)"
    }

    registration_otps {
        int id PK
        text email
        text otp_hash "SHA-256 hash"
        text type "user/admin/operator"
        jsonb pending_data "ข้อมูล registration ที่รอ verify"
        timestamptz expires_at "หมดอายุ 10 นาที"
        timestamptz created_at
    }
```

---

## 6. Flowchart — User Registration (Email+Password)

```mermaid
flowchart TD
    A([Start]) --> B["กรอก email + password\nที่ /user_register"]
    B --> C["POST /api/send_registration_otp\ntype=user"]
    C --> D["สร้าง OTP 6 หลัก (random)\nhash ด้วย SHA-256\nเก็บใน registration_otps\nexpires_at = NOW + 10min"]
    D --> E["ส่ง Email OTP\nผ่าน Gmail SMTP (Nodemailer)\nหัวเรื่อง: 40 building alarm OTP"]
    E --> F["Redirect → /verify_registration_otp\n?email=...&type=user"]
    F --> G["กรอก OTP 6 หลัก"]
    G --> H{"OTP ถูกต้อง\nและยังไม่หมดอายุ?"}
    H -- ไม่ --> I["แสดง Error\nลอง Resend ได้ (cooldown 60s)"]
    I --> G
    H -- ใช่ --> J["POST /api/verify_registration_otp"]
    J --> K["supabaseAdmin.auth.admin.createUser\nemail_confirm = true"]
    K --> L["ลบ OTP record\nออกจาก registration_otps"]
    L --> M["Redirect → /user_login"]
    M --> Z([End])
```

---

## 7. Flowchart — User Login (Google OAuth PKCE)

```mermaid
flowchart TD
    A([Start]) --> B["กด Sign in with Google\nที่ /user_login"]
    B --> C["supabase.auth.signInWithOAuth\nprovider: google\nredirectTo: origin/auth/callback"]
    C --> D["Browser → Google consent screen"]
    D --> E["Google → Supabase server\n/auth/v1/callback"]
    E --> F{"Client Secret\nถูกต้อง?"}
    F -- ไม่ --> G["Error: Unable to exchange code\nRedirect → /user_login"]
    F -- ใช่ --> H["Supabase → Browser\n/auth/callback?code=XXXX"]
    H --> I["exchangeCodeForSession(code)\nสร้าง session"]
    I --> J["Redirect → Home page /"]
    J --> Z([End])
```

---

## 8. Flowchart — แจ้งเหตุฉุกเฉิน

```mermaid
flowchart TD
    A([Start]) --> B{"Login แล้ว?"}
    B -- ไม่ --> C["Redirect → /user_login"]
    B -- ใช่ --> D["กรอกฟอร์ม\nประเภทเหตุ + ชั้น + รายละเอียด"]
    D --> E{"แนบรูปภาพ?"}
    E -- ใช่ --> F["Upload ตรงไป\nSupabase Storage\n(emergency-photos)\nได้ public URL"]
    E -- ไม่ --> G["photo_url = null"]
    F --> H["POST /api/submit_emergency"]
    G --> H
    H --> I["INSERT emergency_data\nstatus = Waiting\ncreated_at = NOW()"]
    I --> J["SELECT emails\nadmin_data + operator_data"]
    J --> K["sendMail(reporter + admin + operator)\nหัวเรื่อง: แจ้งเหตุฉุกเฉิน\nเนื้อหา: ประเภท/รายละเอียด/ชั้น/เวลา"]
    K --> L["แสดง Success message"]
    L --> Z([End])
```

---

## 9. Flowchart — เพิ่ม Admin / Operator

```mermaid
flowchart TD
    A([Start]) --> REG["Admin เปิดหน้า\n/add_admin หรือ /add_operator"]
    REG --> CHOICE{"วิธีลงทะเบียน"}

    CHOICE -- "Register with Google" --> GG["กด Register with Google\nsetSessionStorage google_register_type"]
    GG --> GOAUTH["supabase.auth.signInWithOAuth\nprovider: google\nredirectTo: .../auth/callback"]
    GOAUTH --> GCONSENT["Google consent screen"]
    GCONSENT --> GCB["Redirect กลับ /add_admin\nหรือ /add_operator"]
    GCB --> GPREFILL["getSession() → อ่าน user_metadata\nPre-fill ชื่อ/email\nEmail read-only\nsignOut() จาก Supabase"]
    GPREFILL --> GPWD["Admin กรอก password\nกด Submit"]
    GPWD --> GAPI["POST /api/create_staff_google\n{type, first_name, last_name, email, password}"]
    GAPI --> GHASH["Hash password ด้วย scrypt"]
    GHASH --> GINSERT["INSERT ลง admin_data\nหรือ operator_data"]
    GINSERT --> GDONE["Redirect → /admin_page"]

    CHOICE -- "กรอกด้วยตนเอง" --> B["กรอก ชื่อ/นามสกุล/email/password"]
    B --> C["POST /api/send_registration_otp\ntype = admin หรือ operator"]
    C --> D["Hash password ด้วย scrypt\nสร้าง OTP 6 หลัก\nเก็บ hash + pending_data\nexpires = 10 นาที"]
    D --> E["ส่ง Email OTP\nผ่าน Gmail SMTP"]
    E --> F["Redirect → /verify_registration_otp\n?email=...&type=admin/operator"]
    F --> H["กรอก OTP 6 หลัก"]
    H --> I{"OTP ถูกต้อง?"}
    I -- ไม่ --> J["Error / Resend"]
    J --> H
    I -- ใช่ --> K["INSERT ลง admin_data\nหรือ operator_data"]
    K --> L["ลบ OTP record"]
    L --> M["Redirect → /admin_page"]

    GDONE --> Z([End])
    M --> Z
```

---

## 10. Flowchart — อัปเดต Status

```mermaid
flowchart TD
    A([Start]) --> B{"ใคร update?"}
    B -- "Admin\n(รับเรื่อง)" --> C["UPDATE status\nWaiting → In Process"]
    B -- "Operator\n(Success/Failed)" --> D["UPDATE status\nIn Process → Success/Failed"]
    B -- "Admin หรือ Operator\n(Edit Modal)" --> E{"Status\nเปลี่ยนหรือเปล่า?"}
    E -- ไม่ --> F["UPDATE fields เท่านั้น\n(ไม่ส่ง email)"]
    E -- ใช่ --> G["UPDATE fields\n+ status ใหม่"]
    C --> H
    D --> H
    G --> H["POST /api/notify_status_change\n{table, id, old_status, new_status}"]
    H --> I["SELECT record details\n(email, type, description)"]
    I --> J["SELECT emails\nadmin_data + operator_data"]
    J --> K{"new_status\n= Success?"}
    K -- ใช่ --> L["sendMail\nหัวเรื่อง: อัปเดทสถานะ...\nเนื้อหา: ได้รับการแก้ไขเสร็จสิ้น"]
    K -- ไม่ --> M["sendMail\nหัวเรื่อง: อัปเดทสถานะ...\nเนื้อหา: old → new status"]
    L --> N([End])
    M --> N
    F --> N
```

---

## 11. Sequence Diagram — แจ้งเหตุ + Email Notification

```mermaid
sequenceDiagram
    actor U as User
    participant F as Emergency Form
    participant ST as Supabase Storage
    participant API as /api/submit_emergency
    participant DB as Supabase DB
    participant ML as Gmail SMTP
    actor AO as Admin + Operator (All)

    U->>F: กรอกฟอร์ม + เลือกรูป
    F->>ST: upload photo
    ST-->>F: public photo URL
    F->>API: POST {emergency_type, floor, desc, email, photo_url}
    API->>DB: INSERT emergency_data → ได้ created_at
    API->>DB: SELECT emails from admin_data + operator_data
    DB-->>API: รายชื่อ email ทั้งหมด
    API->>ML: sendMail([user, admin1, admin2, op1, ...])
    ML-->>U: Email แจ้งเหตุฉุกเฉิน
    ML-->>AO: Email แจ้งเหตุฉุกเฉิน
    API-->>F: {success: true}
    F-->>U: แสดงข้อความสำเร็จ
```

---

## 12. Sequence Diagram — Status Update + Notification

```mermaid
sequenceDiagram
    actor AD as Admin/Operator
    participant PG as Dashboard Page
    participant DB as Supabase DB
    participant NA as /api/notify_status_change
    participant ML as Gmail SMTP
    actor ALL as User + Admin + Operator (All)

    AD->>PG: กด "รับเรื่อง" / "Success" / "Failed"\nหรือ แก้ไข status ใน Edit Modal
    PG->>DB: UPDATE status = new_status
    DB-->>PG: OK
    PG->>NA: POST {table, id, old_status, new_status}
    NA->>DB: SELECT record (email, type, description)
    NA->>DB: SELECT admin_data.email + operator_data.email
    DB-->>NA: ข้อมูลครบ
    NA->>ML: sendMail(user + all admins + all operators)
    ML-->>ALL: Email อัปเดทสถานะ
    NA-->>PG: {success: true}
```

---

## 13. Sequence Diagram — Google OAuth PKCE Flow

```mermaid
sequenceDiagram
    actor U as User
    participant APP as Next.js App (Vercel)
    participant SB as Supabase Auth Server
    participant G as Google OAuth

    U->>APP: กด "Sign in with Google"
    APP->>APP: สร้าง code_verifier + code_challenge (PKCE)
    APP->>SB: signInWithOAuth({provider: google, redirectTo: .../auth/callback})
    SB->>G: Redirect + code_challenge
    G->>U: แสดง Google consent screen
    U->>G: อนุมัติ
    G->>SB: Redirect + authorization_code
    SB->>G: exchange code → access_token (ใช้ client_secret)
    G-->>SB: access_token + user info
    SB->>APP: Redirect → /auth/callback?code=XXXX
    APP->>SB: exchangeCodeForSession(code, code_verifier)
    SB-->>APP: session (JWT)
    APP->>U: Redirect → Home page
```

---

## 14. Sequence Diagram — OTP Registration Flow

```mermaid
sequenceDiagram
    actor U as User/Admin
    participant F as Register Form
    participant API1 as /api/send_registration_otp
    participant DB as Supabase DB
    participant ML as Gmail SMTP
    participant OTP as /verify_registration_otp page
    participant API2 as /api/verify_registration_otp

    U->>F: กรอกข้อมูล + กด Submit
    F->>API1: POST {email, password, type, ...}
    API1->>API1: สร้าง OTP 6 หลัก\nhash ด้วย SHA-256\nhash password ด้วย scrypt (admin/op)
    API1->>DB: DELETE OTP เก่า (email+type)\nINSERT OTP ใหม่ + pending_data
    API1->>ML: sendMail(email)\nหัวเรื่อง: 40 building alarm OTP
    ML-->>U: Email OTP 6 หลัก
    API1-->>F: {success: true}
    F->>OTP: Redirect ?email=...&type=...
    U->>OTP: กรอก OTP 6 หลัก
    OTP->>API2: POST {email, otp, type}
    API2->>DB: SELECT OTP record
    API2->>API2: ตรวจสอบ expires_at\ncompare SHA-256(otp) === otp_hash
    alt OTP ถูก
        API2->>DB: INSERT admin_data/operator_data\nหรือ createUser (user)
        API2->>DB: DELETE OTP record
        API2-->>OTP: {success: true}
        OTP->>U: Redirect → login page
    else OTP ผิด/หมดอายุ
        API2-->>OTP: {error: "..."}
        OTP->>U: แสดง Error
    end
```

---

## 15. API Endpoints

### User APIs
| Method | Endpoint | Body | คำอธิบาย |
|---|---|---|---|
| POST | `/api/submit_emergency` | `{emergency_type, floor, description, reporter_email, photo_url}` | แจ้งเหตุฉุกเฉิน + ส่ง email ทุกฝ่าย |
| POST | `/api/submit_breakdown` | `{event_type, floor, description, reporter_email, photo_url}` | แจ้งซ่อม + ส่ง email ทุกฝ่าย |
| POST | `/api/send_registration_otp` | `{email, password, type, first_name?, last_name?}` | ส่ง OTP ผ่าน Gmail |
| POST | `/api/verify_registration_otp` | `{email, otp, type}` | Verify OTP + สร้าง account |

### Admin/Operator APIs
| Method | Endpoint | Body | คำอธิบาย |
|---|---|---|---|
| POST | `/api/verify_admin` | `{email, password}` | Admin login (scrypt verify) |
| POST | `/api/verify_operator` | `{email, password}` | Operator login (scrypt verify) |
| POST | `/api/notify_status_change` | `{table, id, old_status, new_status}` | ส่ง email เมื่อ status เปลี่ยน |
| POST | `/api/create_staff_google` | `{type, first_name, last_name, email, password}` | สร้าง Admin/Operator หลัง Google OAuth (ไม่ต้อง OTP) |

---

## 16. Email Notification System

| Event | ผู้รับ | หัวเรื่อง | เนื้อหา |
|---|---|---|---|
| แจ้งเหตุฉุกเฉิน | User + Admin ทุกคน + Operator ทุกคน | แจ้งเหตุฉุกเฉิน | โดย {email} · {ประเภท} : {รายละเอียด} · ชั้น {ชั้น} · เวลา {timestamp} |
| แจ้งเหตุขัดข้อง | User + Admin ทุกคน + Operator ทุกคน | แจ้งเหตุขัดข้อง | โดย {email} · {ประเภท} : {รายละเอียด} · ชั้น {ชั้น} · เวลา {timestamp} |
| อัปเดต status (ทั่วไป) | User + Admin ทุกคน + Operator ทุกคน | อัปเดทสถานะ{ประเภท} | ผู้แจ้ง {email} · {ประเภท} : {รายละเอียด} · สถานะ: old → new |
| อัปเดต status = Success | User + Admin ทุกคน + Operator ทุกคน | อัปเดทสถานะ{ประเภท} | ผู้แจ้ง {email} · {ประเภท} : {รายละเอียด} · ได้รับการแก้ไขเสร็จสิ้น |
| OTP Registration | เฉพาะ email ที่ขอ | 40 building alarm OTP | รหัส OTP 6 หลัก (หมดอายุ 10 นาที) |

---

## 17. โครงสร้างโปรเจค

```
emergency_alert/
├── app/
│   ├── page.tsx                        # Home: ตารางสถานะ · ปุ่ม "สำหรับฉัน" · Pagination · Edit/Delete
│   ├── emergency/page.tsx              # ฟอร์มแจ้งเหตุฉุกเฉิน (เลือกประเภท + รูปภาพ)
│   ├── breakdown/page.tsx              # ฟอร์มแจ้งซ่อม (เลือกประเภท + รูปภาพ)
│   ├── user_login/page.tsx             # Login: Google OAuth + Email+Password
│   ├── user_register/page.tsx          # Register → OTP via Gmail
│   ├── verify_otp/page.tsx             # OTP สำหรับ Supabase Auth (legacy)
│   ├── verify_registration_otp/page.tsx # OTP สำหรับ User/Admin/Operator register
│   ├── auth/callback/page.tsx          # Google PKCE callback (exchangeCodeForSession)
│   ├── contact/page.tsx                # ข้อมูลติดต่อ
│   ├── login_admin/page.tsx            # Admin login
│   ├── admin_page/page.tsx             # Admin dashboard:
│   │                                   #   · ตาราง Emergency + Breakdown (pagination 10/หน้า)
│   │                                   #   · รับเรื่อง (Waiting → In Process)
│   │                                   #   · ดูรูป (modal)
│   │                                   #   · Edit modal (ทุก field + status)
│   │                                   #   · Delete (มี confirmation)
│   │                                   #   · Report: Pie Chart ชั้น + Bar Chart ประเภท
│   │                                   #   · Export Excel (3 sheets) + PDF
│   ├── add_admin/page.tsx              # เพิ่ม Admin → Google OAuth (ไม่ OTP) หรือ Email → OTP
│   ├── add_operator/page.tsx           # เพิ่ม Operator → Google OAuth (ไม่ OTP) หรือ Email → OTP
│   ├── operator_login/page.tsx         # Operator login
│   ├── operator_page/page.tsx          # Operator dashboard:
│   │                                   #   · ตาราง Emergency + Breakdown
│   │                                   #   · Success / Failed buttons
│   │                                   #   · Edit modal + Delete
│   ├── layout.tsx                      # Root layout
│   └── api/
│       ├── submit_emergency/route.ts   # INSERT + Email notification
│       ├── submit_breakdown/route.ts   # INSERT + Email notification
│       ├── send_registration_otp/route.ts  # OTP generate + Gmail send
│       ├── verify_registration_otp/route.ts # OTP verify + create account
│       ├── notify_status_change/route.ts    # Email notification เมื่อ status เปลี่ยน
│       ├── verify_admin/route.ts       # Admin login (scrypt compare)
│       ├── verify_operator/route.ts    # Operator login (scrypt compare)
│       ├── create_staff_google/route.ts # สร้าง Admin/Operator ผ่าน Google OAuth (ไม่ OTP)
│       ├── add_admin/route.ts          # (legacy)
│       └── add_operator/route.ts       # (legacy)
│
├── components/
│   ├── Navbar.tsx                      # Navigation bar
│   │                                   #   · ซ่อน user auth บนหน้า Admin/Operator
│   │                                   #   · EN/TH toggle
│   │                                   #   · User email + logout dropdown
│   ├── Pagination.tsx                  # Dot pagination (useLanguage สำหรับ prev/next)
│   ├── Footer.tsx
│   └── ClientLayout.tsx                # Wrap: LanguageProvider + Navbar + Footer
│
├── lib/
│   ├── supabase.ts                     # Supabase browser client (singleton)
│   ├── mailer.ts                       # Nodemailer transporter + email templates
│   │                                   #   · sendMail(to[], subject, html)
│   │                                   #   · getAllStaffEmails()
│   │                                   #   · emergencySubmitHtml()
│   │                                   #   · breakdownSubmitHtml()
│   │                                   #   · statusUpdateHtml()
│   │                                   #   · formatTimestamp() · displayFloor()
│   ├── useUserAuth.ts                  # Hook: redirect → /user_login ถ้าไม่มี session
│   ├── adminSession.ts                 # set/get/clear admin session (localStorage)
│   ├── useAdminSession.ts              # Hook: redirect → /login_admin ถ้า session หมด
│   ├── operatorSession.ts              # set/get/clear operator session
│   ├── useOperatorSession.ts           # Hook: redirect → /operator_login
│   └── LanguageContext.tsx             # i18n: TH/EN · translations object · t(key)
│
├── public/
│   ├── KMUTNB_Logo.svg.png
│   ├── emergency_cat.png
│   └── breakdown_dog.png
│
├── next.config.ts
├── .env.local                          # ⚠️ ไม่ commit ลง Git
└── .env.example
```

---

## 18. Database Tables ใน Supabase

### `emergency_data`
| Column | Type | หมายเหตุ |
|---|---|---|
| id | int (PK) | auto increment |
| created_at | timestamptz | Supabase default |
| emergency_type | text | ประเภทเหตุ (canonical Thai หรือ custom) |
| floor | text | เก็บเป็นตัวเลข เช่น "3" |
| description | text | รายละเอียด |
| email | text | email ผู้แจ้ง |
| status | text | Waiting / In Process / Success / Failed |
| photo_url | text (nullable) | URL จาก Supabase Storage |
| finish_at | timestamptz (nullable) | บันทึกเมื่อ status เปลี่ยนเป็น Success |

### `breakdown_data`
| Column | Type | หมายเหตุ |
|---|---|---|
| id | int (PK) | auto increment |
| created_at | timestamptz | |
| breakdown_type | text | ประเภทขัดข้อง |
| floor | text | ตัวเลข เช่น "3" |
| description | text | |
| email | text | |
| status | text | Waiting / In Process / Success / Failed |
| photo_url | text (nullable) | |
| finish_at | timestamptz (nullable) | บันทึกเมื่อ status เปลี่ยนเป็น Success |

### `admin_data` / `operator_data`
| Column | Type | หมายเหตุ |
|---|---|---|
| id | int (PK) | |
| first_name | text | |
| last_name | text | |
| email | text | |
| password | text | `salt:hash` (scrypt 64 bytes) |

### `registration_otps`
| Column | Type | หมายเหตุ |
|---|---|---|
| id | int (PK) | |
| email | text | email ที่ขอ OTP |
| otp_hash | text | SHA-256(OTP) |
| type | text | user / admin / operator |
| pending_data | jsonb | ข้อมูล registration รอ verify |
| expires_at | timestamptz | NOW() + 10 นาที |
| created_at | timestamptz | |

---

## 19. Supabase Storage

| Bucket | Access | ใช้สำหรับ |
|---|---|---|
| `emergency-photos` | Public read · Auth upload | รูปภาพแนบการแจ้งเหตุฉุกเฉิน |
| `breakdown-photos` | Public read · Auth upload | รูปภาพแนบการแจ้งซ่อม |

รูปภาพ upload จาก **client** โดยตรงด้วย user JWT → ได้ public URL → ส่งไป API → บันทึกใน DB

---

## 20. Session Management

| ผู้ใช้ | วิธีเก็บ session | หมดอายุ | Reset timer |
|---|---|---|---|
| User | Supabase Auth JWT (localStorage auto) | ตาม Supabase config | อัตโนมัติ (refresh token) |
| Admin | Custom localStorage + timestamp | **10 นาที** | ทุก mouse/keyboard/scroll/touch event |
| Operator | Custom localStorage + timestamp | **10 นาที** | เหมือนกัน |

Admin/Operator: ตรวจสอบทุก **30 วินาที** — ถ้าหมด → redirect กลับหน้า login อัตโนมัติ

---

## 21. Security

| จุด | วิธีป้องกัน |
|---|---|
| Admin/Operator password | scrypt (salt 16 bytes, hash 64 bytes) + timingSafeEqual |
| OTP | SHA-256 hash ก่อนเก็บ · หมดอายุ 10 นาที · ลบทันทีหลัง verify |
| Google OAuth | PKCE flow (code_verifier ไม่ผ่าน network) |
| Email credentials | Environment Variables (ไม่ commit Git) |
| Supabase RLS | anon + authenticated access control |
| Session | ตรวจสอบทุก 30 วินาที + activity-based reset |

---

## 22. i18n (Bilingual)

รองรับ **ไทย (TH)** และ **อังกฤษ (EN)** — สลับได้ทันทีใน Navbar

ครอบคลุม: ปุ่ม · headers · labels · status · ประเภท · loading states · error messages · pagination

ข้อมูลที่เก็บใน DB ใช้รูปแบบ **canonical** (ตัวเลขสำหรับชั้น, Thai canonical สำหรับประเภทเหตุฉุกเฉิน) — แสดงผลด้วยฟังก์ชัน `displayFloor()` และ `displayEmergencyType()`

---

## 23. การติดตั้งและ Deploy

### Local Development

```bash
git clone https://github.com/baitankub-boop/emergency_alert.git
cd emergency_alert
pnpm install
```

สร้าง `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://zqrlqanbnuwrvvqvcetx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SECRET_KEY=<service role key>
EMAIL_USER=baitankub@gmail.com
EMAIL_PASS=<gmail app password>
```

```bash
pnpm dev    # http://localhost:3000
```

### Deploy to Vercel

1. Push code ขึ้น GitHub
2. Import repo ที่ [vercel.com](https://vercel.com)
3. ตั้ง Environment Variables ใน Vercel dashboard (5 ตัวเดียวกัน)
4. Deploy

**Supabase → Authentication → URL Configuration → Redirect URLs:**
```
http://localhost:3000/auth/callback
https://emergency-alert-gilt.vercel.app/auth/callback
```

### Supabase SQL Setup

```sql
-- เพิ่ม columns
ALTER TABLE emergency_data ADD COLUMN IF NOT EXISTS emergency_type TEXT;
ALTER TABLE emergency_data ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE emergency_data ADD COLUMN IF NOT EXISTS finish_at TIMESTAMPTZ;
ALTER TABLE breakdown_data ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE breakdown_data ADD COLUMN IF NOT EXISTS finish_at TIMESTAMPTZ;

-- OTP table
CREATE TABLE registration_otps (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  type TEXT NOT NULL,
  pending_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE registration_otps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_registration_otp" ON registration_otps
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- RLS สำหรับ emergency/breakdown (anon + authenticated อ่านได้)
-- Storage policies (authenticated upload)
```

---

## 24. Features Summary

### User
- ✅ Login Google OAuth (PKCE) — ไม่ต้อง OTP
- ✅ Register Email+Password → OTP ผ่าน Gmail
- ✅ แจ้งเหตุฉุกเฉิน (6 ประเภท + อื่นๆ)
- ✅ แจ้งซ่อม (6 ประเภท + อื่นๆ)
- ✅ แนบรูปภาพ (preview ก่อน submit)
- ✅ ดูเฉพาะรายการตัวเอง ("สำหรับฉัน")
- ✅ แก้ไขรายการตัวเอง (เฉพาะ Waiting)
- ✅ ลบรายการตัวเอง (พร้อม confirmation)
- ✅ รับ email แจ้งเตือนทุก event

### Admin
- ✅ ดูรายการทั้งหมด (Pagination 10 rows/หน้า)
- ✅ รับเรื่อง (Waiting → In Process) + email notification
- ✅ ดูรูปภาพ (modal)
- ✅ แก้ไขทุก field + status ทุก record
- ✅ ลบ record (พร้อม confirmation)
- ✅ Report: Pie Chart ชั้นบ่อย + Bar Chart ประเภทบ่อย (Emergency + Breakdown แยกกัน)
- ✅ Export Excel (Emergency sheet + Breakdown sheet + Summary sheet)
- ✅ Export PDF (Summary + ตารางข้อมูล)
- ✅ เพิ่ม Admin/Operator ใหม่ → Google OAuth (ไม่ต้อง OTP) หรือ Email → OTP via Gmail
- ✅ รับ email แจ้งเตือนทุก event

### Operator
- ✅ ดูรายการทั้งหมด (Pagination)
- ✅ อัปเดต Success / Failed + email notification
- ✅ ดูรูปภาพ (modal)
- ✅ แก้ไขทุก field + status
- ✅ ลบ record
- ✅ รับ email แจ้งเตือนทุก event

### ระบบ
- ✅ Bilingual UI (TH/EN สลับได้ทันที)
- ✅ Responsive (mobile + desktop)
- ✅ Navbar ซ่อน user auth บนหน้า Admin/Operator
- ✅ Auto-redirect เมื่อ session หมด
- ✅ Status flow: Waiting → In Process → Success/Failed

---

## 25. Status Flow

```
Waiting ──► In Process ──► Success
                      └──► Failed
```

Email notification ถูกส่งทุกครั้งที่ status เปลี่ยน ไปยัง: **User ผู้แจ้ง + Admin ทุกคน + Operator ทุกคน**
