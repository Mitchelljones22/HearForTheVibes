# Registration

The React form sends `POST /api/auth/register` through the Vite proxy with a JSON body containing `firstName`, `lastName`, `email`, `phone`, and `password`. `confirmPassword` is checked in the browser and is not sent. First and last name replace the earlier `fullName` field.

## Request processing

1. `RegisterRequest` trims names, trims and lowercases email, and removes spaces, parentheses, periods, and hyphens from phone numbers. Passwords remain unchanged.
2. Jakarta validation checks required fields, email format, a ten-digit phone number, and password rules. Frontend and backend require 8 to 1024 characters with an uppercase letter, a lowercase letter, a digit, and a special character.
3. `AuthController` converts validation failures into field messages before calling `RegistrationService`.
4. `RegistrationService` checks email and phone uniqueness, hashes the password, and saves a `User` through `UserRepository.saveAndFlush`. Database unique constraints also protect against concurrent duplicate registrations. If a save loses that race, the service checks the conflicting fields again after rollback.
5. The controller returns an account ID and success message. It does not return the entity or its password hash.

`PasswordConfig` uses Spring Security's crypto module with PBKDF2-HMAC-SHA256, a random 16-byte salt, and 600,000 iterations. Stored hashes include an algorithm identifier. Future login code should inject the same `PasswordEncoder` and call `matches`, rather than comparing freshly generated hashes. This dependency does not enable login security filters.

The request's password is excluded from JSON serialization, and its `toString` is redacted. Validation and malformed-request responses contain messages only, never rejected values. Do not add request-body or password logging.

## Responses

| Status | Meaning | Body |
| --- | --- | --- |
| `201 Created` | Account saved | `{"id":1,"message":"Account created successfully."}` |
| `400 Bad Request` | Invalid fields | `{"errors":{"email":"Enter a complete email address, like john@example.com."}}` |
| `400 Bad Request` | Missing or malformed JSON | `{"errors":{"form":"Send a valid registration request."}}` |
| `409 Conflict` | Email or phone already registered | `{"errors":{"phone":"Phone number already registered."}}` |
| `503 Service Unavailable` | Database operation failed | `{"errors":{"form":"Registration is temporarily unavailable. Try again."}}` |

The form displays field errors beside inputs and general errors above the form. During submission, fields and the submit button are disabled. Success clears the form, including both password fields, and displays confirmation. Login is not implemented by this change.

## Verification

Before the first start, run `cp .env.sample .env` from the repository root and set both local passwords. In Windows PowerShell, use `Copy-Item .env.sample .env`. If a development volume already exists, use its existing credentials. Start the stack with `docker compose up -d`, then run these checks:

```sh
docker compose exec backend sh ./mvnw test
docker compose exec frontend npm run build
docker compose exec frontend npm run lint
```

To run Maven on the host with Java 25, use these commands from the repository root in a POSIX shell:

```sh
docker compose up -d database-test
set -a
. ./.env
set +a
cd backend
sh ./mvnw test
```

Spring does not load `.env` automatically. Export its settings in each host terminal. With local Node installed, run the npm checks from `frontend`.

Backend integration tests activate the `test` profile and connect to the separate `database-test` PostgreSQL service. This profile uses `create-drop` and closes each integration test class's Spring context before the next class starts. Tests cover persistence, generated IDs, normalization, required fields, each password rule, email and phone duplicates, competing inserts, salted password verification, and password redaction. Direct repository saves verify PostgreSQL's unique constraints and successful reads and writes after a rejected duplicate.

Run one backend test process at a time. Host and container runs share the test database and can reset each other's schema if run concurrently.

## PostgreSQL configuration

The development database runs PostgreSQL 17 in the `database` Compose service. [.env.sample](../.env.sample) defines the local settings to copy into your ignored root `.env`. Compose reads those settings and supplies `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` to the backend. A host backend requires those variables too. See [the host setup commands](../README.md#run-the-backend-from-your-host) to export them.

Tests require `TEST_DATABASE_USERNAME` and `TEST_DATABASE_PASSWORD`. Their default URL connects to `TEST_DATABASE_NAME` on `localhost:5433`. Compose supplies `TEST_DATABASE_URL` with the internal service name `database-test` on port 5432. The database names and credentials come from `.env`.

Point `TEST_DATABASE_*` only at a disposable database because tests delete and recreate its schema. Use these custom environment variables instead of `SPRING_DATASOURCE_*`, which take precedence over the test profile. With the supplied settings, development and tests use separate PostgreSQL servers and credentials.

The `postgres_data` named volume preserves development accounts across backend restarts and `docker compose down`. The test service uses memory storage and discards its data when the container stops. Do not run `docker compose down -v` if you need to retain local data.

Changing `.env` does not rotate credentials stored in an existing PostgreSQL volume. Keep the existing values, or run an explicit `ALTER ROLE` through an authenticated connection and update `.env` to match.

Production uses hosted Supabase PostgreSQL. Follow [the Supabase setup](../README.md#connect-a-hosted-backend-to-supabase) to configure the backend's environment and create the `app` schema before startup. Application user records and password hashes belong in `app`, outside the default exposed `public` schema. Keep `app` out of Supabase's exposed schemas, and never run tests against production.

Existing SQLite accounts are not imported automatically. The legacy `database` volume remains declared but unmounted, preserving its SQLite file. Keep any existing local `backend/data` SQLite files for a later explicit migration. See [the development setup](../README.md) for startup and host commands.
