# Eventra — Backend (O'zbek tilida to'liq qo'llanma)

Eventra — bu **tadbirlarni bron qilish platformasi** (event booking platform) uchun yozilgan
backend qismi. NestJS, TypeScript, PostgreSQL va Sequelize asosida noldan yaratilgan.

## 1. Loyihaning maqsadi

Eventra quyidagi jarayonni ta'minlaydi:

1. Foydalanuvchi ro'yxatdan o'tadi va emailini OTP kod orqali tasdiqlaydi.
2. Tizimga kiradi (login) va JWT tokenlar oladi.
3. Mavjud tadbirlarni (concert, konferensiya, teatr va h.k.) ko'radi.
4. Tadbir o'tkaziladigan joy (venue)dagi bo'sh o'rindiqni (seat) tanlab, **booking** (bron) qiladi.
5. Booking uchun **to'lov (payment)** amalga oshiradi.
6. Admin esa venue, seat, event yaratadi, o'zgartiradi, o'chiradi va bookinglarni boshqaradi.

Resurslar orasidagi bog'lanish quyidagicha:

```
Venue  →  Seats   (venue ichidagi o'rindiqlar)
Venue  →  Events  (shu venue'da bo'ladigan tadbirlar)
User + Event + Seat  →  Booking
Booking  →  Payment
```

## 2. Ishlatilgan texnologiyalar

| Texnologiya | Vazifasi |
|---|---|
| **NestJS + TypeScript** | Backend freymvork va tip xavfsizligi |
| **PostgreSQL** | Ma'lumotlar bazasi |
| **Sequelize (sequelize-typescript)** | ORM — modellar, relationlar, tranzaksiyalar |
| **JWT + Passport (passport-jwt)** | Autentifikatsiya (access/refresh token) |
| **bcrypt** | Parollarni va refresh tokenlarni xeshlash |
| **Nodemailer** | OTP kodlarni email orqali yuborish |
| **class-validator / class-transformer** | Kiruvchi requestlarni validatsiya qilish |
| **Multer** | Profil rasmi (photo) yuklash |
| **Swagger** | API hujjatlari (interaktiv test qilish) |
| **Helmet, CORS, @nestjs/throttler** | Xavfsizlik va so'rovlarni cheklash (rate limiting) |

## 3. O'rnatish va ishga tushirish

### 3.1. Paketlarni o'rnatish
```bash
npm install
```

### 3.2. `.env` faylini sozlash
`.env.example` faylidan nusxa olib `.env` nomi bilan saqlang, so'ng haqiqiy qiymatlarni kiriting
(baza paroli, SMTP ma'lumotlari, JWT secretlar va h.k.). Loyihada ishlab chiqish (development) uchun
tayyor `.env` fayli ham mavjud — faqat o'z kompyuteringizdagi baza va SMTP ma'lumotlariga moslab
o'zgartiring.

### 3.3. PostgreSQL bazasini yaratish
```bash
psql -U postgres -c "CREATE DATABASE eventra;"
```
Sequelize development rejimida `synchronize: true` bilan sozlangan, ya'ni server birinchi marta
ishga tushganda barcha jadvallar (shu jumladan bir seatni ikki marta bron qilishning oldini oluvchi
unique index) avtomatik yaratiladi.

### 3.4. Serverni ishga tushirish
```bash
npm run start:dev
```
API manzili: `http://localhost:4000/api`
Swagger hujjatlari: `http://localhost:4000/api/docs`

Server ishga tushganda `.env`dagi `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` asosida birinchi
**Super Admin** akkaunt avtomatik yaratiladi (`role: ADMIN`, `is_super: true`).

## 4. Loyiha strukturasi

```
src/
├── auth/       → ro'yxatdan o'tish, OTP, login, JWT access/refresh, parol jarayonlari
├── users/      → user modeli, CRUD, profil rasmi yuklash
├── mail/       → Nodemailer orqali OTP email yuborish
├── venues/     → venue (joy) CRUD
├── seats/      → seat (o'rindiq) CRUD — venue'ga tegishli
├── events/     → event (tadbir) CRUD — venue'ga tegishli
├── bookings/   → booking yaratish (tranzaksiya + row-locking bilan)
├── payments/   → to'lov yaratish, bookingni tasdiqlash
├── common/     → enumlar, guardlar, dekoratorlar, filterlar, yordamchi funksiyalar
├── config/     → Sequelize baza konfiguratsiyasi
├── app.module.ts
└── main.ts
```

## 5. Muhim texnik qarorlar (nega shunday qilingan)

- **Global prefix**: barcha route'lar `/api` bilan boshlanadi (`app.setGlobalPrefix('api')`);
  controllerlarning o'zida faqat mahalliy nom yoziladi (masalan, `@Controller('auth')`).
- **Rollar**: faqat `USER` va `ADMIN` mavjud. Super Admin — bu `role = ADMIN` va `is_super = true`
  kombinatsiyasi. Tizimdagi oxirgi faol Super Adminni hech qachon o'chirib yoki demote qilib
  bo'lmaydi (`UsersService.remove`, `AuthService.ensureSuperAdmin` shu qoidani ta'minlaydi).
- **OTP**: 6 xonali raqamli string (leading zero — masalan `048213` — yo'qolmaydi), `OTP_LENGTH`
  orqali generatsiya qilinadi, `OTP_EXPIRES_IN` vaqtida amal qiladi. Ikki xil maqsadda ishlatiladi:
  email tasdiqlash (`VERIFY_EMAIL`) va parolni tiklash (`FORGOT_PASSWORD`).
- **Tokenlar**: access va refresh tokenlar alohida secret va alohida amal qilish muddatiga ega
  (`.env`dan olinadi). Bazada faqat refresh tokenning **xesh (hash)** qiymati saqlanadi — `refresh`
  va `logout` amallari shu xesh bilan solishtirib ishlaydi va uni bekor qiladi.
- **Ikki marta bron qilishning oldini olish (double-booking)**: `bookings` jadvalida
  `(event_id, seat_id) WHERE status <> 'CANCELLED'` bo'yicha **unique partial index** bor (baza
  darajasida himoya), bundan tashqari `BookingsService.create` metodi Sequelize tranzaksiyasi
  ichida event/seat/mavjud booking qatorlarini `SELECT ... FOR UPDATE` bilan lock qiladi — ya'ni
  ikki qatlamli himoya.
- **Xavfsizlik**: Helmet, CORS va global `ThrottlerGuard` yoqilgan; `login`, `resend-otp`,
  `forgot-password` kabi endpointlar alohida qattiqroq rate-limitga ega (spam/brute-force'dan
  himoya).
- **Response xavfsizligi**: `User.toJSON()` metodi har bir javobdan `hashed_password`,
  `hashed_refresh_token`, `otp`, `otp_time`, `otp_type` maydonlarini avtomatik olib tashlaydi —
  bu ma'lumotlar clientga hech qachon yuborilmaydi.

## 6. Qo'lda sinab ko'rish tartibi (test flow)

1. `POST /api/auth/register` — ro'yxatdan o'tish
2. `POST /api/auth/verify-otp` — emailga kelgan kod bilan tasdiqlash (kod muddati o'tsa
   `resend-otp` ishlatiladi)
3. `POST /api/auth/login` → `access_token` va `refresh_token` qaytaradi
4. `POST /api/auth/refresh`, `POST /api/auth/logout` — token yangilash va chiqish
5. `POST /api/auth/forgot-password` → `POST /api/auth/reset-password` — parolni tiklash
6. `PATCH /api/auth/change-password` — parolni almashtirish (`Authorization: Bearer <token>` kerak)
7. Admin sifatida (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` bilan login qilib): `/api/venues`,
   `/api/seats`, `/api/events` — CRUD amallarini sinash
8. Oddiy user sifatida: `POST /api/bookings`, `GET /api/bookings`, `POST /api/payments`

## 7. Kim nima qila oladi (ruxsatlar jadvali)

| Amal | USER | ADMIN | Super Admin |
|---|---|---|---|
| Ro'yxatdan o'tish / login / OTP / parol amallari | ✅ | ✅ | ✅ |
| O'z profilini tahrirlash, rasm yuklash | ✅ | ✅ | ✅ |
| Event / Venue / Seat ko'rish | ✅ | ✅ | ✅ |
| Event / Venue / Seat yaratish, o'zgartirish, o'chirish | ❌ | ✅ | ✅ |
| Booking yaratish, faqat o'z bookinglarini ko'rish | ✅ | ✅ (hammasini) | ✅ (hammasini) |
| Barcha foydalanuvchilarni ko'rish / o'chirish | ❌ | ✅ | ✅ |
| Register orqali o'zini ADMIN qilish | ❌ (imkonsiz) | — | — |
| Oxirgi Super Adminni o'chirish / demote qilish | — | ❌ | ❌ (o'zini ham) |