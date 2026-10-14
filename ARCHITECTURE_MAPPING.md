# Culinary Blog — Architecture & Integration Mapping

This document records the implementation currently present in the repository after
the `main` merge. It is a source-based context baseline, not a statement that
planned or README-described features are already implemented. Paths below are
relative to the repository root.

## 1. System shape

The current backend is a .NET 10 modular monolith split into four projects:

| Project | Current responsibility |
|---|---|
| `backend/src/CulinaryBlog.Domain` | Recipe, image, category and identity entities; aggregate rules and enums. |
| `backend/src/CulinaryBlog.Application` | Use cases, service contracts, DTOs, validators, MediatR handlers and the single registered pipeline behavior. |
| `backend/src/CulinaryBlog.Infrastructure` | EF Core/PostgreSQL, Identity/JWT implementation, repository, MinIO adapter, current-user adapter, cache placeholder and migrations. |
| `backend/src/CulinaryBlog.API` | Minimal API route mapping, authentication/CORS/rate-limit setup, exception handling, OpenAPI/Scalar and process startup. |

`CulinaryBlogDbContext` is the shared module boundary for EF Core. It applies
configuration classes from the Infrastructure assembly, includes ASP.NET
Identity tables, and applies the `IsDeleted == false` query filter to entities
derived from `BaseEntity`.

At startup `Program.cs` applies EF migrations. Seed data is only loaded when
the process is started with `--seed`. Hangfire uses PostgreSQL storage and a
server worker; the API schedules `PingJob` every minute when the host starts.
The development OpenAPI document and Scalar UI are mapped only in Development.

## 2. Backend request and data flows

### 2.1 Minimal API to application/data

The actual route/use-case paths are not all CQRS/MediatR:

```text
HTTP -> ASP.NET middleware -> Minimal API endpoint
     -> MediatR (search and image upload)
          -> ValidationBehavior -> request handler -> EF Core / IFileStorageService
     -> Application service (recipe CRUD, image management, category/auth use cases)
          -> repository / IUnitOfWork -> EF Core
```

`AddApplicationServices()` registers validators from the Application assembly,
MediatR handlers from that assembly, and `ValidationBehavior<TRequest,TResponse>`.
That is the only MediatR pipeline behavior currently registered. There is no
registered MediatR logging, caching, or cache-invalidation behavior. Other
application work is invoked through scoped services such as `IRecipeService`
and `IRecipeImageService`.

`AuditInterceptor` sets `CreatedAt`/`UpdatedAt` for `BaseEntity` records and
renews application-managed concurrency tokens on SaveChanges. Recipe updates
expose the row version as base64 in the DTO and as a quoted HTTP `ETag`; PUT
prefers `If-Match` to a body `rowVersion`.

### 2.2 Infrastructure and middleware

The request pipeline in `backend/src/CulinaryBlog.API/Program.cs` is:

1. `GlobalExceptionMiddleware`
2. `UseStatusCodePages`
3. `UseCors`
4. `UseRateLimiter`
5. `UseAuthentication`
6. `UseAuthorization`
7. Endpoint routes (plus development-only OpenAPI/Scalar and Hangfire dashboard)

Unhandled application/domain exceptions are translated into RFC 7807
ProblemDetails. Application error codes are returned in `type`; validation
errors use `HttpValidationProblemDetails`. Unexpected exceptions are logged;
their detailed message is only returned in Development. Client-aborted requests
are logged at Debug without attempting to write a response. Status-code pages
cover empty errors such as unmatched routes.

| Concern | Current implementation |
|---|---|
| PostgreSQL | EF Core Npgsql configured through `ConnectionStrings:DefaultConnection`; schema migrations run at application startup. |
| JWT | Bearer validation uses configured issuer, audience, signing key and lifetime, with 30 seconds clock skew. Inbound claims are not remapped; `sub` and `role` are the name/role claim types. Keys shorter than 32 characters stop startup. |
| Authorization | `AuthorPolicy` permits Author/Admin; `AdminPolicy` permits Admin. Recipe resource checks are performed by `RecipeAuthorizationHandler` in application services/handlers. |
| API versioning | `Asp.Versioning` reads the API version from the URL segment. Current endpoint groups use `/api/v1/...`; the API Explorer/OpenAPI document group is `v1` and supported-version response headers are enabled. |
| CORS | One default policy uses `Cors:AllowedOrigins`; wildcard origins are rejected. Methods, request headers (`Content-Type`, `Authorization`, `X-Correlation-ID`, `If-Match`) and exposed headers (`ETag`, `Location`, `Retry-After`) are explicitly listed. Current checked-in appsettings origin is the local frontend origin. |
| Rate limit | Sliding window: 10 requests/minute per remote IP, six segments, no queue; applied to the `/api/v1/auth` group. Rejections use 429 and set `Retry-After` when available. |
| OpenAPI / Scalar | ASP.NET Core OpenAPI document and operation transformers add a JWT bearer scheme. Operations with authorization metadata are marked secured unless `AllowAnonymous` is present. Scalar UI is enabled in Development; no separate Swagger middleware/UI is registered here. |
| MinIO | `IAmazonS3` is configured for path-style access against MinIO; `IFileStorageService` is implemented by `MinioFileStorageService`. |
| Dependency health | `/health/ready` includes checks tagged `ready`: PostgreSQL, Redis and MinIO. Redis uses `AspNetCore.HealthChecks.Redis`; MinIO uses an S3 ListBuckets probe via the configured client. |
| Cache | `ICacheService` is implemented by `LoggingCacheService`, which only logs requested evictions and does not connect to Redis. Redis readiness does not mean Redis caching is active. |
| Logging | `Program.cs` clears providers and adds console logging. No Serilog/Seq provider is registered in the inspected startup path. |

The Compose file provides PostgreSQL, Redis, MinIO, Seq and Mailhog. Redis and
MinIO participate in readiness checks, but Redis is not wired into the active
cache implementation and Seq is not registered as a logging provider.
Use deployment-specific secret configuration for JWT and database credentials;
do not use development defaults in production.

## 3. API contract map

All recipe routes use `/api/v1/recipes`. Endpoint results use ASP.NET's JSON
serialization (camel-case JSON contract). `Asp.Versioning` maps these routes
from `/api/v{version}/...`, currently version 1 (`/api/v1/...`).

| Method and route | Access / result | Implementation |
|---|---|---|
| `GET /api/v1/recipes` | Public; optionally sees own non-public items when authenticated. `PagedResult<RecipeListItemDto>`. | `RecipeEndpoints.GetPagedAsync` -> `IRecipeService`; published-only for guests, owner/admin visibility policy for signed-in callers. Query supports paging, category, difficulty, max cook time, sorting. |
| `GET /api/v1/recipes/search?q=...&page=1&pageSize=10` | Public. `PagedResult<RecipeSummaryDto>`. | `SearchAsync` -> MediatR `SearchRecipesQuery`. The q parameter is required by validation (minimum 2 chars); page defaults to 1, pageSize to 10 and validates 1–50. |
| `GET /api/v1/recipes/{slug}` | Public route; published recipe public, Draft/Archived access is checked against owner/Admin. `RecipeDetailDto`. | `IRecipeService.GetBySlugAsync`; missing slug becomes 404. |
| `GET /api/v1/recipes/{id:guid}` | Author/Admin role and owner/Admin resource access. `RecipeDetailDto` + `ETag`. | Edit/detail-by-id route. |
| `POST /api/v1/recipes/{id:guid}/images` | Author/Admin role plus owner/Admin check. Multipart field `file`; 201 with shared `RecipeImageDto`. | MediatR `UploadRecipeImageCommand`; location points to `/api/v1/recipes/{id}/images/{imageId}`. |
| `PATCH /api/v1/recipes/{recipeId:guid}/images/{imageId:guid}/primary` | Author/Admin and owner/Admin. Returns the recipe image DTO list. | `IRecipeImageService.SetPrimaryAsync`. |
| `DELETE /api/v1/recipes/{recipeId:guid}/images/{imageId:guid}` | Author/Admin and owner/Admin. 204. | `IRecipeImageService.DeleteAsync`. |
| `POST /api/v1/recipes/{recipeId:guid}/ingredients`, `PUT`/`DELETE /{ingredientId:guid}` | Author/Admin and owner/Admin. Create returns 201; update 200; delete 204. | `IRecipeIngredientService`; quantity/unit/notes/order are represented by shared recipe ingredient DTO/request records. |
| `POST /api/v1/recipes/{recipeId:guid}/steps`, `PUT`/`DELETE /{stepId:guid}` | Author/Admin and owner/Admin. Create returns 201; update 200; delete 204. | `IRecipeStepService`; step numbers are assigned by the aggregate and re-numbered after deletion. |
| `POST /api/v1/recipes`, `PUT /api/v1/recipes/{id:guid}`, status PATCHes and `DELETE /api/v1/recipes/{id:guid}` | Author/Admin role; resource ownership enforced where applicable. | Create/update/publish/unpublish/archive/delete. Update/status reads and returns ETag as documented in endpoint metadata. |
| `GET /api/v1/categories`, `GET /api/v1/categories/{slug}` | Public. Returns category list/detail DTO; missing slug is 404. | `ICategoryService`. |
| `POST /api/v1/categories` | Admin policy required. Returns 201. | `CategoriesEndpoints` requires `AdminPolicy`. |
| `GET /health`, `/health/live`, `/health/ready` | Anonymous health reports. `live` disables dependency checks; `ready` selects checks tagged `ready`. | `ready` includes PostgreSQL, Redis and MinIO checks. |
| Auth routes | `/api/v1/auth/register`, `/login`, `/refresh` anonymous; `/logout`, `/me` GET/PATCH require authentication. All are under the auth rate-limit policy. | Direct `IAuthService` calls from `AuthEndpoints`; response includes access token, refresh token, expiry and user profile on register/login/refresh. |

Ingredient and step management routes are similarly role- and owner-protected.

## 4. Search integration (PostgreSQL FTS)

### Request-to-query flow

```text
GET /api/v1/recipes/search?q=...
  -> SearchAsync(q, page, pageSize)
  -> SearchRecipesQuery
  -> ValidationBehavior + SearchRecipesQueryValidator
  -> SearchRecipesQueryHandler
  -> IApplicationDbContext.Recipes / PostgreSQL
  -> PagedResult<RecipeSummaryDto>
```

The `AddRecipeFullTextSearch` migration:

1. Enables PostgreSQL `unaccent`.
2. Creates `vietnamese_unaccent` from the `unaccent` template.
3. Creates text search configuration `vietnamese`, copied from `simple`, and
   maps word/hyphenated word token classes through `vietnamese_unaccent` and
   `simple`.
4. Adds stored generated `Recipes.SearchVector` from `Title`, `Description`
   and `Instructions`, each coalesced to empty text.
5. Creates a GIN index on `SearchVector`.

The vector is a database-generated column and is accessed as an EF shadow
property (`EF.Property<NpgsqlTsVector>(recipe, "SearchVector")`); it is not a
public Recipe domain property. The handler uses `PlainToTsQuery("vietnamese",
SearchTerm)`, `Matches`, filters to Published recipes, counts matches, sorts by
descending `ts_rank`, and uses recipe ID as a deterministic tie-breaker before
pagination. Results include the primary image's `OriginalUrl` when one exists.

`RecipeSummaryDto` is search-specific (`id`, `title`, `slug`, nullable
`description`, nullable `thumbnailUrl`, numeric `rank`); it is not
`RecipeListItemDto` or `RecipeDetailDto`. The frontend types this response as
`SearchRecipesResponse` (`PagedResult<RecipeSummaryDto>`) and `useRecipeSearch`
calls the endpoint with `q`, `page` and `pageSize`.
The custom configuration is accent-normalizing and uses PostgreSQL's `simple`
dictionary; it is not a Vietnamese stemming/semantic search engine.

## 5. File/image integration

### Upload flow and contract

```text
POST /api/v1/recipes/{id}/images (multipart/form-data, field "file")
  -> AuthorPolicy
  -> UploadRecipeImageCommand
  -> ValidationBehavior + UploadRecipeImageCommandValidator
  -> handler loads Recipe + Images and checks owner/Admin
  -> checks file signature bytes against declared JPEG/PNG/WebP/AVIF MIME
  -> IFileStorageService.UploadAsync(recipeId, file)
  -> Recipe.AddImage(url, isPrimary: recipe.Images.Count == 0)
  -> SaveChangesAsync + ICacheService.EvictByTagAsync("recipes")
  -> 201 Created + Recipes.Models.RecipeImageDto
```

The validator rejects missing/empty files, files over 5 MiB and unsupported
content types. The handler separately validates file signatures; the declared
MIME alone is not trusted. The shared backend
`CulinaryBlog.Application.Recipes.Models.RecipeImageDto` contract is:

```json
{
  "id": "guid",
  "url": "string",
  "altText": "string-or-null",
  "isPrimary": true,
  "orderIndex": 0
}
```

The upload handler sets `url` to the stored object's `OriginalUrl`; the same
DTO is used by recipe detail mapping and image-management operations. There is
no separate upload DTO in the current Application model.

`MinioFileStorageService` creates/reuses the configured bucket, stores objects
under `recipes/{recipeId}/{random-guid}.{extension}`, then sets a bucket policy
allowing public `s3:GetObject` and returns an URL based on `PublicEndpoint` (or
`Endpoint`). `DeleteAsync(recipeId, objectUrl)` checks the URL against the
configured internal/public endpoint, bucket and recipe prefix before deriving
the S3 key and issuing `DeleteObject`. The Recipe aggregate owns `RecipeImage`
children and controls primary-image uniqueness/order transitions. The DB
stores URLs/metadata, not image bytes.

### Image lifecycle caveats

- Upload writes the MinIO object before saving the database row. If the DB save
  fails, the object can remain orphaned; no compensating delete is implemented.
- Deleting a `RecipeImage` or full `Recipe` commits the DB deletion first, then
  synchronously deletes associated MinIO objects. Failures are surfaced; if
  MinIO fails after commit, objects may remain orphaned. There is no durable
  outbox/background retry for deletion failures yet.
- `ICacheService.EvictByTagAsync` currently logs only. Recipe detail fetches
  use Next.js revalidation separately; there is no active Redis/output-cache
  invalidation path in this registration.

## 6. Frontend routing, data and SEO

The frontend is Next.js App Router (Next.js 16, React 19) with source under
`frontend/src/app`. The public recipe detail route is
`src/app/(public)/recipes/[slug]/page.tsx`:

1. `getRecipeBySlug(slug)` calls `GET /api/v1/recipes/{encodedSlug}` from the
   server using `API_URL`, then `NEXT_PUBLIC_API_URL`, then the local default.
2. The request uses Next.js revalidation for 300 seconds and tags
   `recipes` and `recipe:{slug}`. A 404 is returned as `null`; other non-2xx
   responses throw.
3. `generateMetadata` fetches that recipe, builds canonical, Open Graph and
   Twitter metadata, chooses the primary image (or first image), and sets
   robots to no-index for non-published recipes.
4. The page renders `RecipeJsonLd` (server-rendered JSON-LD) and
   `RecipeImageManager` (client component).

`RecipeJsonLd` maps shared `RecipeDetailDto` fields to schema.org Recipe:
author, published date, prep/cook/total duration, yield, category,
ingredients, instructions, images and optional non-empty nutrition. JSON is
escaped for `<`, `>` and `&` before insertion into the script element.

`RecipeImageManager` is a client component. It accepts
`recipeId: string`, `RecipeImageDto[]` and the recipe `authorId`; it obtains
the access token and roles from Auth.js `useSession()`. Upload controls are
shown only to a signed-in Admin or the signed-in Author who owns the recipe.
It validates file type and 5 MiB size in the browser,
posts `FormData` with `Authorization: Bearer <accessToken>`, then validates the
response's `id`, `url`, `altText`, `isPrimary` and `orderIndex` before adding
it to local state. The backend independently verifies authorization; frontend
flags are UI gating only.

The shared recipe types use `Guid = string` and mirror backend camel-case
DTOs: `RecipeListItemDto`, `RecipeDetailDto`, image/category/author/nutrition/
ingredient/step DTOs and create/update request shapes. Search adds
`RecipeSummaryDto` and `SearchRecipesResponse` (`PagedResult<RecipeSummaryDto>`)
with nullable description/thumbnail and numeric rank. The backend detail DTO
contains non-null `nutrition`, `rowVersion`, status/difficulty numeric enums,
and nullable category/author/publishedAt.

The public `/search` page uses `useRecipeSearch` to call the backend search
contract with q/page/pageSize, handles loading/error/empty states and renders
paged recipe cards. The hook uses fetch with AbortController, so it does not
depend on the dashboard-only TanStack Query provider. API requests obtain
their backend URL from `src/lib/config/env.ts`; browser/server callers use the
central `API_V1` prefix, while the shared client uses `API_URL`.

TanStack Query is installed and `QueryProvider` wraps the dashboard route
group only, with 60-second stale time, no focus refetch, no mutation retries
and no retry for 4xx responses. Public recipe pages currently use server
`fetch`, not TanStack Query.

The shared API client in `src/lib/api/client.ts` converts non-2xx responses
into `ApiError` with RFC 7807 `ProblemDetails` fields (`type`, `title`,
`status`, `detail`, `instance`, and validation `errors`). It uses the HTTP
status as authoritative and falls back to the response status text or body
when the server response is empty or not valid JSON.

The public route-group layout at `src/app/(public)/layout.tsx` wraps pages with
the shared `Header` and `Footer`. The header links to site navigation/search
and reflects the Auth.js session with profile and sign-in/sign-out actions.
Shared components under `src/components/common/` also provide reusable
`Pagination`, `Loading` and `ErrorState` UI; the search results page uses all
three state/result components.

Auth.js v5 (`next-auth`) is configured in `src/auth.ts` with JWT sessions and a
Credentials provider that calls `/api/v1/auth/login`. The route handler at
`src/app/api/auth/[...nextauth]/route.ts` exposes Auth.js endpoints under
`/api/auth/*`; the root layout mounts `AuthSessionProvider`, making
`useSession()` available to client components. The provider also mounts the
React Context store in `src/lib/stores/auth-store.ts`, which projects the
session user into client-side UI state. Auth.js stores the backend access
token and roles in its session; `types/next-auth.d.ts` augments the session
and user types. The public `/login` page submits credentials through
Auth.js's credentials provider.

`RecipeImageManager` reads `session.accessToken` and session roles via
`useSession()`. It allows an Admin to upload, or an Author when the recipe
author id matches the signed-in user id, and sends the upload as multipart
`FormData` to `API_V1` with `Authorization: Bearer <token>`. These checks only
gate the UI; backend authorization remains the security boundary. The central
environment module exports `API_URL`, `API_V1` and `SITE_URL`; frontend API
calls use these exports rather than reading environment variables directly.

## 7. Integration gap status and remaining follow-up items

### Resolved integration gaps

- **Auth/Session:** Auth.js v5 JWT sessions and the Auth.js route handler are
  configured; the root layout provides `SessionProvider`. The recipe image
  manager gets the backend access token and roles from `useSession()`, checks
  the current user against the recipe author/Admin role, and sends a Bearer
  token for MinIO-backed upload requests.
- **Frontend environment config:** API URL selection is centralized in
  `src/lib/config/env.ts` (`API_URL` and `API_V1`; `SITE_URL` for public SEO
  URLs). Auth, recipe, search, upload and shared-client calls use these exports
  instead of reading API environment variables directly.
- **API versioning:** `Asp.Versioning` is registered and the current endpoint
  groups resolve under `/api/v1/...`.

### Remaining integration limits / follow-up items

1. **Redis health is not Redis caching.** Redis participates in `/health/ready`,
   but `ICacheService` remains a logging no-op.
2. **Deletion cleanup is not transactional across PostgreSQL and S3.** Objects
   are deleted after the DB commit. A MinIO error is surfaced but can leave an
   orphan; reliable retry requires an outbox or durable job.
3. **Upload can leave an orphan if PostgreSQL persistence fails after the
   MinIO write.** No compensating delete is currently implemented.
4. **CORS is configured for the local origin in checked-in appsettings.**
   Production frontend origins must be explicitly provided in deployment
   configuration.
5. **Some README features remain unwired** (for example Seq logging and
   several MediatR behaviors). Re-check implementations and registrations
   before relying on those descriptions.
6. **Development MinIO credentials are local Compose credentials only.**
   Production should supply credentials and public endpoint through deployment
   secrets/configuration.

## 8. Validation commands

Run from the repository root:

```powershell
dotnet build backend
pnpm.cmd --dir frontend exec tsc --noEmit
```

`pnpm.cmd` is used on Windows where PowerShell execution policy may block the
`pnpm.ps1` shim.
