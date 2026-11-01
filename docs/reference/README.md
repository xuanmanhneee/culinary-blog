# Project reference documents

[`SRS_Culinary_Blog_v1.0.0.md`](./SRS_Culinary_Blog_v1.0.0.md) is the working Markdown reference for the approved Software Requirements Specification baseline for Culinary Blog.

[`SRS_Culinary_Blog_v1.0.0.pdf`](./SRS_Culinary_Blog_v1.0.0.pdf) is the unchanged archival copy of the source document.

[`../../docs/openapi.v1.json`](../../docs/openapi.v1.json) is the generated OpenAPI v1 contract. It is refreshed from the running Development API after endpoint changes and is the preferred reference for frontend API integration.

The current contract includes email confirmation, category detail with paginated recipes, category recipe counts, recipe image variants, advanced search filters, health endpoints, and correlation-ID response headers.

Use it as the reference for:

- functional requirements and API contracts;
- user roles and authorization rules;
- data model and architecture constraints;
- non-functional requirements, observability, and deployment expectations.

Any change that intentionally diverges from this SRS should be recorded in the project design decisions or change-management documentation.
