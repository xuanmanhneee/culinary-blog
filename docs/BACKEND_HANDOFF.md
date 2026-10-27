# Backend handoff

The complete frontend-facing contract, examples, role matrix, error format, and
freeze checklist are maintained in [BACKEND_REFERENCE.md](./BACKEND_REFERENCE.md).

The backend is organized as a vertical modular monolith. The frontend uses one
base URL (`/api/v1`), while each business capability owns its API, application
logic, domain model, and infrastructure adapter.

## Local startup

```powershell
docker compose up -d
dotnet run --project backend/src/CulinaryBlog.API/CulinaryBlog.API.csproj -- --seed
dotnet run --project backend/src/CulinaryBlog.API/CulinaryBlog.API.csproj
```

Development seed credentials:

- Email: `author1@culinaryblog.local`
- Password: `Author@123`

OpenAPI is available at `/openapi/v1.json`; Scalar is enabled in Development.

## Vertical module boundaries

- Identity owns users, roles, JWT, and refresh tokens.
- Recipes owns recipes, categories, ingredients, steps, images, and search.
- Storage uses local `wwwroot/uploads` in Development and keeps the MinIO adapter
  available for production configuration.

Rating and saved recipes are intentionally excluded from the shared core. They
live on the optional `codex/rating-saved-extension` branch and can be merged later
without changing the Recipes domain contract.
