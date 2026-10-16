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

Run `docker compose exec backend sh ./mvnw test`, `docker compose exec frontend npm run build`, and `docker compose exec frontend npm run lint` from the repository root. With local Java 25 and Node installed, run Maven tests from `backend` and the npm checks from `frontend`.

Backend tests use SQLite files under `backend/target` and never reset the development database. Coverage includes persistence, normalization, required fields, each password rule, email and phone duplicates, competing inserts, salted password verification, and password redaction in responses and application logs.
