# Analytics Test Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single-file HTML test/demo page (`front/test.html`) that verifies the analytics service and demonstrates its capabilities.

**Architecture:** Single HTML file with embedded CSS and JS. Loads the analytics tracking script via `<script defer>`, handles hash-based page navigation independently by calling the `/api/visit` endpoint, and displays PV/UV counts with animated updates.

**Tech Stack:** HTML5, CSS3 (custom properties, animations), vanilla JavaScript (fetch API)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `front/test.html` | Create | Complete test page: structure, styles, logic |

Single file — no other changes needed. The tracking script (`index.min.js`) is loaded from the deployed Worker, not modified.

---

### Task 1: HTML Structure and CSS

**Files:**
- Create: `front/test.html`

- [ ] **Step 1: Write the HTML structure and embedded CSS**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Web Analytics 测试页</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: #f5f7fa;
    color: #1e293b;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 40px 16px;
  }

  .container { max-width: 640px; width: 100%; }

  .header { text-align: center; margin-bottom: 32px; }
  .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .header .subtitle { font-size: 13px; color: #64748b; }

  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }

  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    transition: transform 0.2s;
  }
  .stat-card:hover { transform: translateY(-2px); }

  .stat-card .number {
    font-size: 48px;
    font-weight: 700;
    color: #3b82f6;
  }
  .stat-card .number.pop { animation: pop 0.3s ease; }

  @keyframes pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }

  .stat-card .label { font-size: 14px; color: #64748b; margin-top: 4px; }

  .nav { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 24px; }

  .nav-btn {
    padding: 8px 20px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  .nav-btn:hover { border-color: #3b82f6; color: #3b82f6; }
  .nav-btn.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }

  .info-bar {
    background: #fff;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    font-size: 13px;
    line-height: 1.8;
  }
  .info-bar span { color: #64748b; }
  .info-bar code {
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    color: #3b82f6;
    word-break: break-all;
  }

  .status { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 500; }
  .status.ok { background: #f0fdf4; color: #16a34a; }
  .status.err { background: #fef2f2; color: #dc2626; }
  .status .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Web Analytics 测试页</h1>
    <p class="subtitle">服务地址: https://site-stats.dongyue.org</p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="number" id="page_pv">--</div>
      <div class="label">访问人次 (PV)</div>
    </div>
    <div class="stat-card">
      <div class="number" id="page_uv">--</div>
      <div class="label">访问人数 (UV)</div>
    </div>
  </div>

  <nav class="nav" id="nav">
    <button class="nav-btn active" data-hash="#home">首页</button>
    <button class="nav-btn" data-hash="#about">关于</button>
    <button class="nav-btn" data-hash="#products">产品</button>
    <button class="nav-btn" data-hash="#contact">联系</button>
  </nav>

  <div class="info-bar">
    <div>当前追踪: <code id="currentUrl">--</code></div>
    <div>来源: <span id="referrerInfo">--</span></div>
  </div>

  <div class="status ok" id="status">
    <span class="dot"></span>
    <span id="statusText">检查中...</span>
  </div>
</div>
</body>
</html>
```

- [ ] **Step 2: Verify HTML file is valid**

Run: Open `front/test.html` in browser
Expected: Page renders with all static elements visible — header, two stat cards with "--", four nav buttons, info bar, status bar. No console errors.

- [ ] **Step 3: Commit**

```bash
git add front/test.html
git commit -m "feat: add analytics test page structure and styles"
```

---

### Task 2: JavaScript Logic

**Files:**
- Modify: `front/test.html` (add `<script>` blocks before `</body>`)

- [ ] **Step 1: Add the tracking script loader**

Insert before `</body>`:

```html
<script defer src="https://site-stats.dongyue.org/js/index.min.js" data-base-url="https://site-stats.dongyue.org"></script>
```

- [ ] **Step 2: Add the test page JS — element refs and utilities**

Insert after the tracking script:

```html
<script>
(function(){
  var BASE_URL = 'https://site-stats.dongyue.org';
  var API_URL = BASE_URL + '/api/visit';

  var pvEl = document.getElementById('page_pv');
  var uvEl = document.getElementById('page_uv');
  var currentUrlEl = document.getElementById('currentUrl');
  var referrerEl = document.getElementById('referrerInfo');
  var statusEl = document.getElementById('status');
  var statusTextEl = document.getElementById('statusText');
  var navBtns = document.querySelectorAll('.nav-btn');

  function getLocation(href) {
    var l = document.createElement('a');
    l.href = href;
    return l;
  }

  function getCurrentPath() {
    var loc = getLocation(window.location.href);
    return loc.pathname + (loc.hash || '#home');
  }

  function updateInfo() {
    currentUrlEl.textContent = getCurrentPath();
    referrerEl.textContent = document.referrer || '(无 / direct)';
  }

  function animateNumber(el, newVal) {
    if (el.textContent !== String(newVal)) {
      el.textContent = newVal;
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
  }

  function setStatus(ok, msg) {
    if (ok) {
      statusEl.className = 'status ok';
      statusTextEl.textContent = '服务连接正常';
    } else {
      statusEl.className = 'status err';
      statusTextEl.textContent = '连接异常' + (msg ? ': ' + msg : '');
    }
  }

  function setActiveNav(hash) {
    navBtns.forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.hash === (hash || '#home'));
    });
  }
</script>
```

- [ ] **Step 3: Add the API fetch and hash navigation logic**

Append inside the same `<script>` block, after the utility functions:

```javascript
  async function fetchStats(path) {
    var body = {
      url: path,
      hostname: window.location.hostname || 'localhost',
      referrer: document.referrer,
      pv: true,
      uv: true
    };
    try {
      var res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      var data = await res.json();
      if (data.ret === 'OK') {
        animateNumber(pvEl, data.data.pv);
        animateNumber(uvEl, data.data.uv);
        setStatus(true);
      } else {
        setStatus(false, data.message);
      }
    } catch(e) {
      setStatus(false, e.message);
    }
  }

  function onHashChange() {
    var hash = window.location.hash || '#home';
    var path = getLocation(window.location.href).pathname + hash;
    updateInfo();
    setActiveNav(hash);
    fetchStats(path);
  }

  navBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      window.location.hash = this.dataset.hash;
    });
  });

  window.addEventListener('hashchange', onHashChange);

  if (!window.location.hash) {
    window.location.hash = '#home';
  }
  updateInfo();
  onHashChange();

  setTimeout(function() {
    fetch(BASE_URL + '/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: '/',
        hostname: window.location.hostname || 'localhost',
        referrer: '',
        pv: true
      })
    }).then(function(res) { return res.json(); })
      .then(function(data) { setStatus(data.ret === 'OK'); })
      .catch(function(e) { setStatus(false, e.message); });
  }, 2000);
})();
```

- [ ] **Step 4: Verify interactive behavior**

Open `front/test.html` in browser and check:
1. Nav buttons switch active state on click
2. URL hash changes in address bar (`#home` → `#about`)
3. PV/UV numbers update (after API response)
4. Status shows green "服务连接正常" or red "连接异常" with reason
5. "当前追踪" shows pathname + hash
6. Browser back/forward buttons work correctly

- [ ] **Step 5: Re-deploy Worker to serve the test page**

```bash
cd analytics_with_cloudflare && npm run deploy
```

- [ ] **Step 6: Verify deployed page**

Open `https://site-stats.dongyue.org/test.html` in browser and repeat Step 4 checks.

- [ ] **Step 7: Commit**

```bash
git add front/test.html
git commit -m "feat: add JS logic for analytics test page"
```

---

### Self-Review

1. **Spec coverage**: Every spec requirement maps to a task — UI structure (Task 1), CSS visual design (Task 1), data flow and hash navigation (Task 2), error handling (Task 2 status checks), pop animation (Task 2 `animateNumber`)
2. **Placeholder scan**: No TBD, TODO, or vague instructions. All code is shown in full.
3. **Type consistency**: All element IDs match between HTML and JS (`page_pv`, `page_uv`, `currentUrl`, `referrerInfo`, `status`, `statusText`). Functions defined before use. `getCurrentPath` returns the same format used in `fetchStats`.
