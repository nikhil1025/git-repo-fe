# GitHub Integration Frontend

A lightweight Angular frontend for syncing and exploring GitHub data (repositories, commits, PRs, issues, users, etc.). It provides an integration panel to connect a GitHub account via OAuth and a data viewer powered by AG Grid to browse synced collections with server-side pagination, search, filters, previews and CSV export.

## Key features

- GitHub OAuth flow to connect user accounts.
- Initial data sync and manual re-sync support.
- Integration management (connect / remove).
- Data explorer with:
  - Server-side (infinite) pagination via AG Grid
  - Column filters and sorting
  - Search across collection
  - Preview dialog for arrays/objects with copy-to-clipboard
  - CSV export
- Built with Angular 19, Angular Material, and ag-grid.
- Dockerfile + docker-compose included for containerized runs.
- Troubleshooting guide present (TROUBLESHOOTING.md).

## Technology stack

- Angular 19 (standalone components + modern bootstrapApplication)
- TypeScript
- Angular Material (UI components)
- ag-grid-community / ag-grid-angular for data grid
- RxJS
- Karma / Jasmine for unit tests (configured)
- Docker for containerized runs

Dependencies (from package.json)
- @angular/* v19.x
- @angular/material & @angular/cdk v19.x
- ag-grid-community & ag-grid-angular v34.x
- rxjs, zone.js, typescript (dev)

## Repo layout (important files / directories)

- angular.json — Angular CLI project configuration (build / serve / test)
- package.json / package-lock.json — scripts and dependencies
- Dockerfile, docker-compose.yml, .dockerignore — container support
- src/
  - main.ts — application bootstrap (ModuleRegistry.registerModules + bootstrapApplication)
  - index.html, styles.scss — global markup and styling (uses Material theme)
  - app/
    - app.routes.ts — routes: /integration, /data, GitHub OAuth callback route `/auth/github/callback`
    - app.config.ts — application providers (interceptors, router, animations)
    - app.component.* — top-level toolbar and router outlet
    - core/
      - services/
        - auth.service.ts — handles auth flow, stores user id in localStorage, exposes integration status observable
        - http.service.ts — wrapper around HttpClient that prefixes endpoints with environment.apiUrl and centralizes error handling
        - integration.service.ts — remove/resync/sync endpoints
        - github-data.service.ts — (referenced by grid; fetches collections, fields, and paginated data) — used by DataGrid
      - models/ — data models (integration, ag-grid interfaces, etc.)
    - features/
      - integration/
        - integration-panel.component.* — UI for connecting/removing/resyncing GitHub integration
      - auth-callback/
        - auth-callback.component.* — handles OAuth callback, triggers initial sync and navigates back
      - data-view/
        - data-grid.component.* — AG Grid implementation with infinite row model, dynamic column generation, preview buttons
        - preview-dialog.component.* — dialog to view/copy JSON preview of complex values
    - shared/ — shared module / UI primitives (used across features)
- public/ — static assets copied into build
- TROUBLESHOOTING.md — troubleshooting notes and common fixes

## Important client ↔ server endpoints (inferred from services)

The frontend expects a backend API that exposes (examples below are the paths used in the code):
- GET /auth/auth-url — returns { authUrl } to redirect the browser for GitHub OAuth
- POST /auth/callback — accepts { code } and returns integration data (used to complete OAuth)
- GET /auth/status?userId=<id> — returns integration status for user
- DELETE /integration/:integrationId — remove an integration and associated data
- POST /integration/:integrationId/resync — trigger resync for an integration
- POST /github/sync/:integrationId — trigger an immediate sync
- Data endpoints used by the grid (via GithubDataService) — e.g.:
  - GET /data/collections — list of collections
  - GET /data/:collection/fields — fields/schema for a collection
  - POST /data/:collection/query — paginated query accepting paging, sort, filter, search (the frontend sends DataRequest objects)

(Exact backend routes and parameter shapes should be confirmed against your backend docs or code.)

## Running locally

Prerequisites
- Node 18+ (or supported Node for Angular 19)
- npm (or yarn)
- Angular CLI (optional but useful): npm i -g @angular/cli

Install
```bash
npm install
```

Development server
```bash
npm run start
# opens at http://localhost:4200 by default (angular.json sets port 4200)
```

Build
```bash
npm run build
# production build: `ng build` produces output in dist/github-integration-frontend
```

Tests
```bash
npm run test
# runs Karma/Jasmine tests
```

Clean
```bash
npm run clean
# removes dist and Angular cache
```

## Environment and configuration

- The frontend reads an API base URL from environment files (the code references `environment.apiUrl`).
- angular.json indicates a configuration replacement for development:
  - src/environments/environment.ts <-> src/environments/environment.development.ts
- Ensure `environment.apiUrl` points to your backend (e.g. `http://localhost:3000`).

Example environment (src/environments/environment.ts)
```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com'
};
```

Example local development environment (src/environments/environment.development.ts)
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

## Docker

A Dockerfile and docker-compose.yml exist in the repo. Typical steps:

Build image:
```bash
docker build -t github-integration-frontend:latest .
```

Run with compose:
```bash
docker-compose up --build
```

See the provided docker-compose.yml for service bindings and environment variables.

## OAuth flow (how it works in this frontend)

1. User clicks Connect GitHub in the Integration panel.
2. AuthService calls backend `/auth/auth-url` to retrieve the GitHub OAuth URL returned by the backend.
3. The browser is redirected to GitHub for consent. GitHub redirects back to the frontend route `/auth/github/callback?code=...`.
4. AuthCallbackComponent reads the code, calls `/auth/callback` on the backend to exchange the code for tokens and create an "integration" record.
5. After successful callback, AuthCallbackComponent triggers an initial data sync via IntegrationService.syncGithubData(...) and navigates back to the integration screen.

## UI / component overview

- AppComponent
  - Top toolbar with navigation to Integration and Data view.
- IntegrationPanelComponent
  - Shows connection state, account details, connect button, re-sync and remove options.
- AuthCallbackComponent
  - Small spinner page that handles the OAuth callback and starts sync.
- DataGridComponent
  - Dynamic column generation from collection fields, infinite (server-side) datasource, search, filter, sort, preview buttons (event delegation), CSV export, selection.
- PreviewDialogComponent
  - Standalone dialog to pretty print and copy JSON for array/object cells.

## Developer notes and suggestions

- The grid sets up dynamic preview buttons by creating DOM elements and attaching a delegated click listener to the grid container. When modifying grid cell rendering, be careful to preserve the `data-*` attributes used by the event handler.
- The HttpService centralizes error handling: server errors are surfaced as Error objects with message content from the backend when available.
- Integration status is shared through a BehaviorSubject in AuthService (`integrationStatus$`). Other components can subscribe to it to react to status changes.
- The code uses Angular's standalone components pattern and bootstrapApplication from main.ts — modern Angular application structure.

## Troubleshooting

- See TROUBLESHOOTING.md in the repo for known issues and fixes.
- If the grid shows no collections: ensure the backend sync completed (check /auth/callback and /github/sync logs), and ensure environment.apiUrl is set correctly.
- If OAuth redirect fails, verify your GitHub app settings (redirect URI must match frontend callback route) and backend exchange endpoints.

## Contributing

- Fork the repo and open a PR with a clear description of the change and tests where applicable.
- Keep the Angular style conventions and run lint/tests before pushing.
- If adding backend-dependent features, include mock data or instructions to run the backend for local testing.

## TODOs / improvements (observations)
- Add explicit README examples showing expected backend responses (integration object shape, collection/field API contract).
- Add End-to-End tests (Cypress) to validate OAuth flow and data grid interactions.
- Add CI workflow (GitHub Actions) to run unit tests and build.

## Where to look next in the repo

- src/app/core/services — for backend integration points (auth, data, integration)
- src/app/features — integration UI and data viewer
- angular.json — build configuration and environment replacements
- Dockerfile & docker-compose.yml — containerization

---
