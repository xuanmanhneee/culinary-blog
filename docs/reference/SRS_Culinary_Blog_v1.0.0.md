# Culinary Blog - Software Requirements Specification

**Version:** 1.0.0  
**Status:** Approved  
**Release date:** 2026-06-04  
**System:** Full-stack, API-driven culinary recipe platform

This document is the Markdown reference version of the approved SRS. The original PDF is retained beside it for archival purposes.

## 1. Product overview

Culinary Blog is a web platform for discovering, sharing, managing, and storing cooking recipes. A recipe contains its basic information, ingredients, preparation steps, images, category, author, and optional nutrition data.

The system consists of:

- **Frontend:** Next.js App Router.
- **Backend:** .NET 10 Minimal APIs with Clean Architecture.
- **Database:** PostgreSQL 16 with EF Core Code First.
- **Object storage:** MinIO, S3-compatible.
- **Cache:** Redis 7.
- **Background processing:** Hangfire using PostgreSQL storage.
- **Authentication:** ASP.NET Core Identity, JWT, Google OAuth 2.0.

Out of scope: GraphQL, native mobile applications, real-time chat, payments, and a multi-tenant SaaS model.

## 2. User roles

| Role | Main permissions |
|---|---|
| Guest | View published recipes, categories, and search results. Cannot modify content. |
| Author | Create, edit, publish, archive, and delete owned recipes; manage their images, ingredients, and steps. |
| Admin | All author permissions, plus manage any recipe, manage categories, seed data, access Hangfire dashboard, and inspect operational logs. |

Authorization uses three layers:

1. Role-based authorization: Guest, Author, Admin.
2. Resource-based authorization: authors can modify only their own recipes.
3. Policy-based authorization: verified authors require confirmed email; admins bypass ownership checks.

## 3. Functional requirements

### 3.1 Authentication and user management (FR-AUTH)

| ID | Requirement | Priority | Endpoint |
|---|---|---:|---|
| FR-AUTH-001 | Register account, assign Author role, auto-login, enqueue welcome email | M | `POST /api/v1/auth/register` |
| FR-AUTH-002 | Email/password login with lockout protection | M | `POST /api/v1/auth/login` |
| FR-AUTH-003 | Google OAuth 2.0 login/registration and account linking | S | `POST /api/v1/auth/google` |
| FR-AUTH-004 | Refresh token rotation; revoke the old token | M | `POST /api/v1/auth/refresh` |
| FR-AUTH-005 | Logout by revoking a refresh token; idempotent behavior | M | `POST /api/v1/auth/logout` |
| FR-AUTH-006 | View current profile without sensitive fields | S | `GET /api/v1/auth/me` |
| FR-AUTH-007 | Partially update full name and avatar URL | S | `PATCH /api/v1/auth/me` |

Security requirements include PBKDF2 password hashing, 15-minute access tokens, 7-day refresh tokens, refresh-token reuse detection, generic invalid-login messages, and lockout after five failed attempts for 15 minutes.

### 3.2 Category management (FR-CAT)

| ID | Requirement | Priority | Endpoint |
|---|---|---:|---|
| FR-CAT-001 | List categories with recipe counts | M | `GET /api/v1/categories` |
| FR-CAT-002 | View category detail and its paginated recipes | M | `GET /api/v1/categories/{slug}` |
| FR-CAT-003 | Create category | M | `POST /api/v1/categories` |
| FR-CAT-004 | Update category | M | `PUT /api/v1/categories/{id}` |
| FR-CAT-005 | Soft-delete category; reject deletion when recipes remain | M | `DELETE /api/v1/categories/{id}` |

Create, update, and delete operations require the Admin role. Category names and slugs must be unique.

### 3.3 Recipe management (FR-RCP)

| ID | Requirement | Priority | Endpoint |
|---|---|---:|---|
| FR-RCP-001 | Paginated, filtered, sorted published recipe list | M | `GET /api/v1/recipes` |
| FR-RCP-002 | Recipe detail by slug with nutrition, ingredients, steps, and images | M | `GET /api/v1/recipes/{slug}` |
| FR-RCP-003 | Create recipe as Draft | M | `POST /api/v1/recipes` |
| FR-RCP-004 | Update an owned recipe using optimistic concurrency | M | `PUT /api/v1/recipes/{id}` |
| FR-RCP-005 | Publish and unpublish a recipe | M | `PATCH /api/v1/recipes/{id}/publish`, `/unpublish` |
| FR-RCP-006 | Archive a recipe | M | `PATCH /api/v1/recipes/{id}/archive` |
| FR-RCP-007 | Soft-delete an owned recipe | M | `DELETE /api/v1/recipes/{id}` |
| FR-RCP-008 | Upload, update metadata, set primary, and delete recipe images | M | `/api/v1/recipes/{id}/images` |
| FR-RCP-009 | CRUD recipe ingredients | M | `/api/v1/recipes/{id}/ingredients` |
| FR-RCP-010 | CRUD recipe steps and keep step numbers contiguous | M | `/api/v1/recipes/{id}/steps` |

Recipes support Draft, Published, and Archived states. Published content is public; Draft content is visible only to its owner and Admin. Updates use an `If-Match`/row-version mechanism to prevent lost updates.

### 3.4 Search and pagination (FR-SRCH)

| ID | Requirement |
|---|---|
| FR-SRCH-001 | PostgreSQL full-text search using `tsvector`/`tsquery`, ranking, prefix matching, and Vietnamese accent-insensitive search. |
| FR-SRCH-002 | Filter by category, difficulty, maximum cook time, minimum servings, and related recipe criteria. |
| FR-SRCH-003 | Sort by supported fields such as creation date, title, and cook time; prefix `-` means descending. |
| FR-SRCH-004 | Offset pagination with page, page size, total count, total pages, and navigation flags. |

Search endpoint:

```http
GET /api/v1/recipes/search?q=pho+bo&page=1&pageSize=10
```

Empty or too-short queries should return validation errors. Search must return only published recipes.

### 3.5 File management (FR-FILE)

| ID | Requirement |
|---|---|
| FR-FILE-001 | Upload JPEG, PNG, WebP, or AVIF files to MinIO using a generated object path. Maximum size: 5 MB. Validate MIME type and magic bytes. |
| FR-FILE-002 | Delete files idempotently. File deletion should be delegated to Hangfire with up to three retries. |

The application layer depends on `IFileStorageService`, allowing MinIO, AWS S3, or local development storage to be swapped without changing use cases.

### 3.6 Background jobs (FR-JOB)

| ID | Job | Trigger |
|---|---|---|
| FR-JOB-001 | Send HTML welcome email | After successful registration; fire-and-forget. |
| FR-JOB-002 | Generate 300x300 thumbnail and 800x600 medium image | After image upload; fire-and-forget. |
| FR-JOB-003 | Generate and publish sitemap containing recipes, categories, and static pages | Recurring daily at `02:00 UTC` (`0 2 * * *`). |

Jobs use retry policies, structured logging, and persistent Hangfire storage in PostgreSQL.

### 3.7 Observability (FR-OBS)

| ID | Requirement |
|---|---|
| FR-OBS-001 | Provide `/health`, `/health/live`, and `/health/ready` checks for database, Redis, and MinIO as appropriate. |
| FR-OBS-002 | Structured request and MediatR logging with correlation ID, request path, status, duration, and user ID. |
| FR-OBS-003 | OpenTelemetry traces and metrics for HTTP, EF Core, request duration, errors, and recipe business events. |

## 4. API conventions

- Base path: `/api/v1`.
- Authentication: `Authorization: Bearer <access-token>`.
- Errors: RFC 7807 `application/problem+json`.
- Validation errors include field-level messages.
- Paginated responses contain data plus pagination metadata.
- Standard statuses include `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `423`, `429`, `500`, and `503` where applicable.

## 5. Non-functional requirements

### Performance

- Public recipe pages should use SSR/SSG/ISR where suitable.
- Use Redis distributed caching with graceful cache-miss behavior.
- Use PostgreSQL indexes, GIN full-text indexes, and connection pooling.
- Image processing and other slow I/O must run asynchronously.

### Security

- Hash passwords through ASP.NET Core Identity/PBKDF2.
- Validate and sanitize uploads; never trust file extensions alone.
- Apply rate limiting to authentication and upload endpoints.
- Do not expose stack traces, passwords, security stamps, or token hashes.
- Use HTTPS and secure production secret management.

### Reliability

- PostgreSQL readiness failure must stop traffic through the reverse proxy.
- Redis failure should degrade to database reads where possible.
- MinIO failure should prevent upload/image access while keeping core recipe operations available where possible.
- Background job failures must retry and be observable.
- Maintain persistent PostgreSQL and MinIO storage with scheduled backups.

### SEO and accessibility

- Use semantic HTML and responsive layouts.
- Provide Schema.org `Recipe` JSON-LD.
- Generate sitemap XML.
- Use canonical URLs, meaningful metadata, and accessible image alt text.

## 6. Architecture and deployment

The backend follows four layers:

1. **Domain:** entities, value rules, and domain behavior; no external framework dependency.
2. **Application:** CQRS/MediatR commands, queries, validators, DTOs, and interfaces.
3. **Infrastructure:** EF Core/PostgreSQL, Identity, MinIO, Redis, Hangfire, email, logging, and observability adapters.
4. **API:** Minimal API endpoints, middleware, authentication, versioning, and HTTP concerns.

Local development uses Docker Compose for PostgreSQL, Redis, MinIO, and Mailhog. Production uses Docker, PostgreSQL 16, Redis 7, MinIO, and Nginx with TLS termination and reverse proxying.

## 7. Core data model

The main entities are:

- `BaseEntity`: ID, timestamps, soft-delete state, and application-managed row version.
- `Recipe`: title, slug, description, category, author, status, timings, servings, difficulty, instructions, nutrition, and search fields.
- `RecipeNutrition`: calories, protein, carbohydrates, fat, fiber, and sodium.
- `RecipeStep`: ordered description, optional title, timer, and image URL.
- `RecipeIngredient`: name, quantity, unit, notes, and order index.
- `RecipeImage`: original/thumbnail/medium URLs, alt text, primary flag, and order index.
- `Category`: name, slug, description, image URL, and recipe relationship.
- `ApplicationUser`: ASP.NET Core Identity user with profile fields and roles.
- `RefreshToken`: hashed token, expiry, revocation, replacement, client IP, and user relationship.

## 8. Required dependencies and configuration

Important configuration groups:

```text
ConnectionStrings:DefaultConnection
Jwt
Google
Storage:Provider
Minio
Redis
Smtp
Seq
OTEL_EXPORTER_OTLP_ENDPOINT
```

Development values belong in `appsettings.Development.json` or local environment variables. Production credentials must not be committed to source control.

## 9. Traceability checklist

Before declaring the SRS complete, verify:

- [ ] All 7 authentication requirements are implemented and tested.
- [ ] All 5 category requirements are implemented and tested.
- [ ] All 10 recipe requirements are implemented and tested.
- [ ] Search, filtering, sorting, and pagination match the API contract.
- [ ] File validation, MinIO storage, and asynchronous deletion work.
- [ ] All three Hangfire jobs are registered, executed, retried, and observable.
- [ ] Health checks cover the required dependencies.
- [ ] Structured logging and OpenTelemetry are enabled for production.
- [ ] Frontend pages use real API data instead of mock data.
- [ ] API and frontend integration tests cover the main happy paths and authorization failures.
