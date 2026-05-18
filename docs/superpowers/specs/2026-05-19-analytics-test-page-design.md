# Analytics Test Page Design

## Overview

A single-file HTML test/demo page for the Cloudflare Workers analytics service. Serves both as functional verification of the backend API and tracking script, and as a clean demo for showing the service to others.

## File

- **New**: `front/test.html` — zero dependencies, opens directly in browser

## Architecture

```
test.html
  ├── CSS (embedded <style>)
  ├── HTML structure
  └── JS (embedded <script>)
        ├── Hash-based page simulation (#home, #about, #products, #contact)
        ├── Tracking script loader (<script defer src="...index.min.js">)
        ├── Connection status checker (POST /api/visit)
        └── UI updates on hashchange
```

## UI Structure

```
┌──────────────────────────────────┐
│  Title: Web Analytics 测试页      │
│  Sub: service URL                │
├────────────┬─────────────────────┤
│  PV Card   │  UV Card            │
│  (大号数字) │  (大号数字)          │
├────────────┴─────────────────────┤
│  Nav pills: [home][about]        │
│             [products][contact]  │
├──────────────────────────────────┤
│  Current tracking URL            │
│  Referrer info                   │
├──────────────────────────────────┤
│  Connection status indicator     │
└──────────────────────────────────┘
```

## Visual Design

- Light theme, white cards with soft shadows, 12px border-radius
- Primary color: `#3b82f6` (blue)
- PV/UV numbers: 48px bold, card hover lifts slightly
- Navigation: capsule pill buttons, active state highlighted
- Font: system font stack
- Status: green dot + "服务正常" / red dot + "连接异常"
- Number change animation: scale 1 → 1.15 → 1 (pop effect)

## Data Flow

1. Page loads → tracking script fetches PV/UV from API → populates `#page_pv` / `#page_uv`
2. User clicks nav pill → `window.location.hash` changes → `hashchange` fires
3. On hashchange: test page JS manually POSTs to `/api/visit` with `url: pathname + hash` (tracking script's `getLocation().pathname` strips hash, so we bypass it for hash navigation), then updates DOM elements directly
4. Connection check: separate `fetch POST /api/visit` with `{pv: true}` to verify API health

## Simulated Pages

| Hash | Pathname |
|------|----------|
| `#home` | `/#home` |
| `#about` | `/#about` |
| `#products` | `/#products` |
| `#contact` | `/#contact` |

## Error Handling

- Script load failure → status indicator goes red, console error
- API returns non-OK → status indicator goes red
- Network error → status indicator goes red
- All errors surfaced in status bar, not silent

## Scope

Single file, zero dependencies, no build step, no deployment changes.
