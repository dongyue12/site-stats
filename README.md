[简体中文](./README.zh-CN.md) · **English**

# Web Visitor Analytics Service Based on Cloudflare + Hono + D1

> Modified version: [dongyue12/site-stats](https://github.com/dongyue12/site-stats)
> Original author: [yestool/analytics_with_cloudflare](https://github.com/yestool/analytics_with_cloudflare) · [Demo](https://webviso.yestool.org/)

---

## Table of Contents

- [Project Structure](#project-structure)
- [Deployment Steps](#deployment-steps)
- [How to Use](#how-to-use)
- [Test Page](#test-page)
- [Viewing Logs](#viewing-logs)
- [API Reference](#api-reference)
- [Configuration Reference](#configuration-reference)

---

## Project Structure

```
analytics_with_cloudflare/
├── src/
│   ├── index.ts          # Worker entry point, Hono routes
│   └── lib/
│       ├── util.ts        # URL parsing utility
│       └── dbutil.ts      # Database utility
├── front/
│   └── dist/              # Static assets (served by Worker)
│       ├── index.js       # Tracking script (uncompressed)
│       ├── index.min.js   # Tracking script (minified)
│       └── test.html      # Test page
├── wrangler.jsonc         # Wrangler configuration
├── schema.sql             # D1 database schema
├── package.json
└── tsconfig.json
```

---

## Deployment Steps

### 1. Install Dependencies

```bash
npm install -g wrangler
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

Complete OAuth authorization in your browser.

### 3. Create D1 Database

```bash
npx wrangler d1 create web_analytics
```

Successful output:

```
✅ Successfully created DB web_analytics

[[d1_databases]]
binding = "DB"
database_name = "web_analytics"
database_id = "<unique-ID>"
```

### 4. Configure wrangler.jsonc

Fill in the `database_id` from the previous step into `wrangler.jsonc`:

```jsonc
{
  "name": "site-stats",
  "main": "src/index.ts",
  "compatibility_date": "2024-06-14",

  "observability": {
    "logs": {
      "enabled": true,
      "persist": true,
      "invocation_logs": true
    }
  },

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "web_analytics",
      "database_id": "<unique-ID>"
    }
  ],

  "assets": {
    "directory": "./front/dist"
  }
}
```

### 5. Initialize D1 Table Schema

```bash
npm run initSql
```

### 6. Deploy

```bash
npm run deploy
```

After deployment, visit `https://<name>.<your-subdomain>.workers.dev`.

### 7. Bind Custom Domain (Optional)

Cloudflare Dashboard → Workers & Pages → Your Worker → Triggers → Custom Domains, add your domain.

---

## How to Use

### Include the Tracking Script

Add the following before the `</body>` tag in your HTML:

```html
<script defer src="https://<your-domain>/index.min.js" data-base-url="https://<your-domain>"></script>
```

> Replace `<your-domain>` with your Worker address. Do not add a trailing `/`.

### Display Statistics

Add these elements anywhere in your page:

```html
<p>Page Views: <span id="page_pv"></span></p>
<p>Unique Visitors: <span id="page_uv"></span></p>
```

### Custom Element IDs

```html
<script defer src="https://<your-domain>/index.min.js"
  data-base-url="https://<your-domain>"
  data-page-pv-id="my_pv"
  data-page-uv-id="my_uv">
</script>
```

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-base-url` | `https://webviso.yestool.org` | API service URL |
| `data-page-pv-id` | `page_pv` | PV display element ID |
| `data-page-uv-id` | `page_uv` | UV display element ID |

---

## Test Page

Visit `/test.html` after deployment. Features:

- **Live PV/UV Display** — Card layout with pop animation on value change
- **Multi-Page Simulation** — Switch between Home/About/Products/Contact via URL hash
- **Connection Status** — Auto-detects API connectivity, green = OK, red = error
- **Tracking Info** — Shows current tracking path and referrer
- **Copyable Integration Code** — Syntax-highlighted code blocks with copy button

---

## Viewing Logs

Stream Worker runtime logs in real-time with `wrangler tail`:

```bash
npx wrangler tail
```

Each log entry is structured JSON:

```json
// Incoming request
{"ts":"2026-05-18T...","ip":"...","host":"example.com","path":"/page","ref":"(direct)","action":"visit","pv":true,"uv":true}

// New website registered
{"ts":"2026-05-18T...","action":"website_registered","domain":"example.com","website_id":1}

// Request completed
{"ts":"2026-05-18T...","action":"visit_done","host":"example.com","path":"/page","pv":42,"uv":15,"elapsed_ms":12}

// Error
{"ts":"2026-05-18T...","action":"error","ip":"...","error":"...","elapsed_ms":5}
```

---

## API Reference

### POST /api/visit

Records a page visit and returns statistics.

**Request Body:**

```json
{
  "url": "/page-path",
  "hostname": "example.com",
  "referrer": "https://google.com/search",
  "pv": true,
  "uv": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Page path |
| `hostname` | string | Website domain |
| `referrer` | string | Referrer URL, empty string if none |
| `pv` | boolean | Whether to return PV count |
| `uv` | boolean | Whether to return UV count |

**Response Body:**

```json
{
  "ret": "OK",
  "data": {
    "pv": 42,
    "uv": 15
  }
}
```

On error:

```json
{
  "ret": "ERROR",
  "data": null,
  "message": "Error description"
}
```

---

## Configuration Reference

### Logging (observability)

```jsonc
"observability": {
  "logs": {
    "enabled": true,       // Enable logging
    "persist": true,       // Persist logs across Worker restarts
    "invocation_logs": true // Capture console.log/error output
  }
}
```

### Static Assets

```jsonc
"assets": {
  "directory": "./front/dist"  // Files auto-mapped to Worker root path
}
```

### Database Migration

```bash
# Execute remotely
npm run initSql

# Execute on local D1 for development
npm run initSqlLocal
```
