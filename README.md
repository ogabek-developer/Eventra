# Eventra — Backend

Event booking platform backend built with NestJS, TypeScript, PostgreSQL and Sequelize.

## Tech stack
NestJS, TypeScript, PostgreSQL, Sequelize (`sequelize-typescript`), JWT (`passport-jwt`), bcrypt,
Nodemailer, class-validator / class-transformer, Multer, Swagger, Helmet, `@nestjs/throttler`.

## 1. Install dependencies
```bash
npm install
```

## 2. Configure environment
Copy `.env.example` to `.env` and fill in real values (a working `.env` with the values from the
technical spec is already included for local development — update the DB/SMTP credentials to match
your machine before running).

## 3. Create the PostgreSQL database
```bash
psql -U postgres -c "CREATE DATABASE eventra;"
```
Sequelize is configured with `synchronize: true` for development, so tables are created
automatically on first boot (including the unique partial index used for double-booking
protection).

## 4. Run the server
```bash
npm run start:dev
```
The API is served at `http://localhost:4000/api`.
Swagger docs: `http://localhost:4000/api/docs`.

On boot, the app automatically bootstraps the initial **Super Admin** account using
`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from `.env` (role `ADMIN`, `is_super: true`).

## Project structure
```
src/
├── auth/            # register, OTP, login, JWT access/refresh, password flows
├── users/            # user model, CRUD, profile photo upload
├── mail/             # Nodemailer OTP email delivery
├── venues/           # venue CRUD
├── seats/            # seat CRUD (belongs to venue)
├── events/           # event CRUD (belongs to venue)
├── bookings/          # booking creation with transaction + row locking
├── payments/          # payment creation, booking confirmation
├── common/            # enums, guards, decorators, filters, utils
├── config/            # Sequelize database configuration
├── app.module.ts
└── main.ts
```

## Key design notes
- **Global prefix**: every route is served under `/api` (`app.setGlobalPrefix('api')`); controllers
  only declare their own local path (e.g. `@Controller('auth')`).
- **Roles**: only `USER` and `ADMIN` exist. Super Admin is `role = ADMIN` with `is_super = true`.
  The last active Super Admin can never be deleted or demoted (`UsersService.remove`,
  `AuthService.ensureSuperAdmin`).
- **OTP**: 6-digit numeric string (leading zeros preserved), generated with `OTP_LENGTH`, expires
  after `OTP_EXPIRES_IN` — used both for e-mail verification (`VERIFY_EMAIL`) and password recovery
  (`FORGOT_PASSWORD`).
- **Tokens**: access and refresh tokens use separate secrets/lifetimes from `.env`. Only the
  **hash** of the refresh token is stored on the user row; `refresh`/`logout` compare against and
  invalidate that hash.
- **Double-booking protection**: `bookings` has a partial unique index on
  `(event_id, seat_id) WHERE status <> 'CANCELLED'` at the database level, and `BookingsService.create`
  additionally locks the event/seat/existing-booking rows (`SELECT ... FOR UPDATE`) inside a
  Sequelize transaction before creating the booking + payment records.
- **Security**: Helmet, CORS, and a global `ThrottlerGuard` are enabled; `login`, `resend-otp`, and
  `forgot-password` carry tighter per-route throttling.
- **Response security**: `User.toJSON()` strips `hashed_password`, `hashed_refresh_token`, `otp`,
  `otp_time`, and `otp_type` from every serialized response.

## Manual test flow
1. `POST /api/auth/register`
2. `POST /api/auth/verify-otp` (code delivered by e-mail; use `resend-otp` if it expires)
3. `POST /api/auth/login` → returns `access_token` + `refresh_token`
4. `POST /api/auth/refresh`, `POST /api/auth/logout`
5. `POST /api/auth/forgot-password` → `POST /api/auth/reset-password`
6. `PATCH /api/auth/change-password` (requires `Authorization: Bearer <access_token>`)
7. Admin (login with `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`): CRUD `/api/venues`, `/api/seats`,
   `/api/events`
8. User: `POST /api/bookings`, `GET /api/bookings`, `POST /api/payments`
