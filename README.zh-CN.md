[English](./README.md) · **简体中文**

# 基于 Cloudflare + Hono + D1 的网页访客统计服务

> 修改版：[dongyue12/site-stats](https://github.com/dongyue12/site-stats)
> 原作者：[yestool/analytics_with_cloudflare](https://github.com/yestool/analytics_with_cloudflare) · [演示站点](https://webviso.yestool.org/)

---

## 目录

- [项目结构](#项目结构)
- [部署步骤](#部署步骤)
- [如何使用](#如何使用)
- [测试页面](#测试页面)
- [查看日志](#查看日志)
- [API 参考](#api-参考)
- [配置参考](#配置参考)

---

## 项目结构

```
analytics_with_cloudflare/
├── src/
│   ├── index.ts          # Worker 入口，Hono 路由
│   └── lib/
│       ├── util.ts        # URL 解析工具
│       └── dbutil.ts      # 数据库操作工具
├── front/
│   └── dist/              # 静态资源（Worker 托管）
│       ├── index.js       # 追踪脚本（非压缩）
│       ├── index.min.js   # 追踪脚本（压缩）
│       └── test.html      # 测试页面
├── wrangler.jsonc         # Wrangler 配置
├── schema.sql             # D1 数据库表结构
├── package.json
└── tsconfig.json
```

---

## 部署步骤

### 1. 安装依赖

```bash
npm install -g wrangler
npm install
```

### 2. 登录 Cloudflare

```bash
npx wrangler login
```

跳转浏览器完成 OAuth 授权。

### 3. 创建 D1 数据库

```bash
npx wrangler d1 create web_analytics
```

成功后输出：

```
✅ Successfully created DB web_analytics

[[d1_databases]]
binding = "DB"
database_name = "web_analytics"
database_id = "<unique-ID>"
```

### 4. 配置 wrangler.jsonc

将上一步返回的 `database_id` 填入 `wrangler.jsonc`：

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

### 5. 初始化 D1 表结构

```bash
npm run initSql
```

### 6. 部署

```bash
npm run deploy
```

部署成功后访问 `https://<name>.<your-subdomain>.workers.dev`。

### 7. 绑定自定义域名（可选）

在 Cloudflare 控制台 → Workers & Pages → 你的 Worker → 触发器 → 自定义域，添加域名。

---

## 如何使用

### 引入追踪脚本

在 HTML 的 `</body>` 标签前加入：

```html
<script defer src="https://<your-domain>/index.min.js" data-base-url="https://<your-domain>"></script>
```

> `data-base-url` 指向你自己的 Worker 地址，结尾不要有 `/`。

### 展示统计数据

在页面任意位置加入：

```html
<p>访问人次: <span id="page_pv"></span></p>
<p>访问人数: <span id="page_uv"></span></p>
```

### 自定义标签 ID

```html
<script defer src="https://<your-domain>/index.min.js"
  data-base-url="https://<your-domain>"
  data-page-pv-id="my_pv"
  data-page-uv-id="my_uv">
</script>
```

| 属性 | 默认值 | 说明 |
|------|--------|------|
| `data-base-url` | `https://webviso.yestool.org` | API 服务地址 |
| `data-page-pv-id` | `page_pv` | PV 显示元素 ID |
| `data-page-uv-id` | `page_uv` | UV 显示元素 ID |

---

## 测试页面

部署后访问 `/test.html` 即可打开测试页，支持以下功能：

- **PV/UV 实时显示** — 卡片式布局，数字变化带弹出动画
- **多页面模拟** — 通过 URL hash 切换首页/关于/产品/联系 4 个页面
- **连接状态检测** — 自动检测 API 连通性，绿色正常/红色异常
- **当前追踪信息** — 显示追踪路径和来源

---

## 查看日志

Worker 运行时日志通过 `wrangler tail` 实时查看：

```bash
npx wrangler tail
```

每条操作日志均为 JSON 格式：

```json
// 请求到达
{"ts":"2026-05-18T...","ip":"...","host":"example.com","path":"/page","ref":"(direct)","action":"visit","pv":true,"uv":true}

// 新网站注册
{"ts":"2026-05-18T...","action":"website_registered","domain":"example.com","website_id":1}

// 请求完成
{"ts":"2026-05-18T...","action":"visit_done","host":"example.com","path":"/page","pv":42,"uv":15,"elapsed_ms":12}

// 异常
{"ts":"2026-05-18T...","action":"error","ip":"...","error":"...","elapsed_ms":5}
```

---

## API 参考

### POST /api/visit

记录页面访问并返回统计数据。

**请求体：**

```json
{
  "url": "/page-path",
  "hostname": "example.com",
  "referrer": "https://google.com/search",
  "pv": true,
  "uv": true
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | string | 页面路径 |
| `hostname` | string | 网站域名 |
| `referrer` | string | 来源 URL，无来源时传空字符串 |
| `pv` | boolean | 是否返回 PV 计数 |
| `uv` | boolean | 是否返回 UV 计数 |

**响应体：**

```json
{
  "ret": "OK",
  "data": {
    "pv": 42,
    "uv": 15
  }
}
```

错误时：

```json
{
  "ret": "ERROR",
  "data": null,
  "message": "错误描述"
}
```

---

## 配置参考

### 日志配置 (observability)

```jsonc
"observability": {
  "logs": {
    "enabled": true,       // 启用日志
    "persist": true,       // 持久化日志（Worker 重启后保留）
    "invocation_logs": true // 捕获 console.log/error 输出
  }
}
```

### 静态资源 (assets)

```jsonc
"assets": {
  "directory": "./front/dist"  // 托管目录，文件自动映射到 Worker 根路径
}
```

### 数据库迁移

```bash
# 远程执行 SQL
npm run initSql

# 本地开发测试
npm run initSqlLocal
```
