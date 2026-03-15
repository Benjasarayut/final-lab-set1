# ENGSE207 Software Architecture
# Final Lab — ชุดที่ 1: Microservices + HTTPS + Lightweight Logging

## ภาพรวมระบบ

ระบบ Task Board Microservices ที่ประกอบด้วย:
- **Auth Service**: จัดการการ login ด้วย Seed Users และ JWT
- **Task Service**: CRUD Tasks ด้วย JWT Authentication
- **Log Service**: บันทึกและดึง log จากฐานข้อมูล
- **Frontend**: Task Board UI และ Log Dashboard
- **Nginx**: API Gateway ด้วย HTTPS และ Rate Limiting
- **PostgreSQL**: Shared Database สำหรับทุก service

## สถาปัตยกรรม

```
Browser / Postman
       │
       │ HTTPS :443  (HTTP :80 redirect → HTTPS)
       ▼
┌─────────────────────────────────────────────────────────────┐
│  🛡️ Nginx (API Gateway + TLS Termination + Rate Limiter)    │
│                                                             │
│  /api/auth/*   → auth-service:3001    (ไม่ต้องมี JWT)          │
│  /api/tasks/*  → task-service:3002   [JWT required]         │
│  /api/logs/*   → log-service:3003    [JWT required]         │
│  /             → frontend:80         (Static HTML)          │
└───────┬────────────────┬──────────────────┬─────────────────┘
        │                │                  │
        ▼                ▼                  ▼
┌──────────────┐ ┌───────────────┐ ┌──────────────────┐
│ 🔑 Auth Svc  │ │ 📋 Task Svc   │ │ 📝 Log Service   │
│   :3001      │ │   :3002       │ │   :3003          │
│              │ │               │ │                  │
│ • Login      │ │ • CRUD Tasks  │ │ • POST /api/logs │
│ • /verify    │ │ • JWT Guard   │ │ • GET  /api/logs │
│ • /me        │ │ • Log events  │ │ • เก็บลง DB       │
└──────┬───────┘ └───────┬───────┘ └──────────────────┘
       │                 │
       └────────┬────────┘
                ▼
     ┌─────────────────────┐
     │  🗄️ PostgreSQL      │
     │  (1 shared DB)      │
     │  • users   table    │
     │  • tasks   table    │
     │  • logs    table    │
     └─────────────────────┘
```

## Seed Users สำหรับทดสอบ

| Username | Email | Password | Role |
|---|---|---|---|
| alice | alice@lab.local | alice123 | member |
| bob | bob@lab.local | bob456 | member |
| admin | admin@lab.local | adminpass | admin |

**หมายเหตุ:** Password hash ได้ถูกสร้างด้วย bcrypt แล้วใน `db/init.sql`

## วิธีการรันระบบ

### ขั้นตอนที่ 1: สร้าง Self-Signed Certificate

```bash
chmod +x scripts/gen-certs.sh
./scripts/gen-certs.sh
```

### ขั้นตอนที่ 2: รัน Docker Compose

```bash
docker compose up --build
```

### ขั้นตอนที่ 3: เข้าถึงระบบ

- **Frontend**: https://localhost (จะ redirect จาก HTTP อัตโนมัติ)
- **API Gateway**: Nginx จะ proxy ไปยัง services ต่างๆ

### ขั้นตอนที่ 4: ทดสอบ

ใช้ curl หรือ Postman ทดสอบตาม test cases ในเอกสาร

## วิธีการพัฒนา

### การแก้ไขโค้ด

แก้ไขโค้ดในโฟลเดอร์ของแต่ละ service แล้วรัน:

```bash
docker compose up --build
```

### การ reset database

```bash
docker compose down -v
docker compose up --build
```

## Test Cases หลัก

1. Docker compose up สำเร็จ
2. HTTPS เข้าถึงได้ (แม้มี cert warning)
3. Login ด้วย seed users สำเร็จ
4. CRUD Tasks ทำงานได้
5. Log Dashboard แสดง logs สำหรับ admin เท่านั้น
6. Rate limiting ทำงาน (429 เมื่อส่ง login ผิดเร็วๆ)

## ไฟล์สำคัญ

- `docker-compose.yml`: การตั้งค่า containers
- `nginx/nginx.conf`: Reverse proxy และ HTTPS config
- `db/init.sql`: Schema และ seed data
- `scripts/gen-certs.sh`: สร้าง self-signed certificate
- `.env`: Environment variables

## คำอธิบาย HTTPS Flow

1. Browser ส่ง request ไปยัง `https://localhost`
2. Nginx terminate TLS ด้วย self-signed certificate
3. Nginx proxy request ไปยัง services ภายใน Docker network
4. Services ตอบกลับผ่าน Nginx ซึ่ง encrypt response กลับไปยัง browser

## คำอธิบาย JWT Flow

1. User login ที่ `/api/auth/login` ได้ JWT token
2. Frontend เก็บ token ใน localStorage
3. API calls อื่นๆ ส่ง token ใน Authorization header
4. Services ตรวจสอบ JWT และอนุญาต/ปฏิเสธตาม role

## คำอธิบาย Logging

- Auth Service และ Task Service ส่ง log ไปยัง Log Service ผ่าน internal API
- Log Service เก็บใน PostgreSQL table `logs`
- Admin สามารถดู logs ได้ที่ `logs.html` หรือ `/api/logs/`

## Known Limitations

- ใช้ self-signed certificate (สำหรับ development เท่านั้น)
- Shared database (สำหรับ simplicity ใน lab นี้)
- ไม่มี user registration (ใช้ seed users เท่านั้น)

## ทีมผู้พัฒนา

- นาย ชนสรณ์ บุตรถา - 67543210025-2
- นาย เบญจศรายุทธ  น้อยอุบล - 67543210071-6

## เอกสารอ้างอิง

- ENGSE207 Software Architecture Final Lab Set 1 Specification
