# 致谢上游作者[烈酒](https://github.com/lie-jiu)

[wekit-read-receipts-server](https://github.com/lie-jiu/wekit-read-receipts-server)

[wekit-read-receipts-cf-workers](https://github.com/lie-jiu/wekit-read-receipts-cf-workers)

## 微信已读服务器端 — Cloudflare Worker 单文件版

本包把 `wekit-read-receipts-server` 的核心 API / D1 架构迁移为单个 `worker.js`，并参考 `wekit-read-receipts-cf-workers` 的 Worker/D1 方式；Web UI 针对安卓浏览器做了触摸命中区、动态视口、移动端卡片式表格等优化，修改原项目1×1像素点为已读GIF动图。

## 文件全部由ChatGPT生成

- `worker.js`：唯一 Worker 业务代码，包含 API、认证、管理后台、账户页、仪表盘、已读详情、D1 操作。
- `schema.sql`：手动创建/初始化 D1 所需 SQL。
- `wrangler.toml`：D1 绑定和 10 分钟定时任务模板。
- `README.md`：部署说明。

## 重要说明

当前 Worker 不会自动创建 D1。请先在 Cloudflare Dashboard 手动创建 D1，或者使用 Wrangler 创建后再把 `database_id` 填入 `wrangler.toml`。

## 纯网页手动部署教程

1.创建一个D1数据库在控制台粘贴schema.sql全部内容执行

2.创建一个Hello World Workers 把原代码替换成worker.js里的代码

3.绑定D1数据库变量名填DB

4.推荐个域名在国内就可以正常访问了

## 下面内容是ChatGPT生成的部署教程

### 1. 手动创建 D1

Cloudflare Dashboard → Storage & Databases → D1 SQL databases → Create database。

数据库名建议：

`wekit-read-receipts`

### 2. 绑定 D1

把 `wrangler.toml` 中：

`database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"`

替换为实际 Database ID。

也可以在 Cloudflare Worker Dashboard 的 Settings → Bindings 中添加 D1 binding：

- Variable name: `DB`
- D1 database: 你的 `wekit-read-receipts`

### 3. 初始化数据库

本地：

```bash
npx wrangler d1 execute wekit-read-receipts --local --file=./schema.sql
```

远程生产库：

```bash
npx wrangler d1 execute wekit-read-receipts --remote --file=./schema.sql
```

验证：

```bash
npx wrangler d1 execute wekit-read-receipts --remote --command="SELECT name FROM sqlite_schema WHERE type IN ('table','virtual table') ORDER BY name"
```

Cloudflare D1 官方文档当前明确支持 FTS5；因此本包保留服务器端的 `messages_fts` trigram 结构。

### 4. 设置管理员 / 邀请码

推荐使用 Worker Secrets：

```bash
npx wrangler secret put ADMIN
npx wrangler secret put INVITE_CODE
```

例如 ADMIN：

```text
wxid_admin
```

多个管理员用逗号：

```text
wxid_admin,wxid_admin2
```

### 5. 部署

```bash
npx wrangler deploy
```

## API 对齐

公开客户端 API：

- `GET /pixel?wxId=&id=`
- `GET /count?wxId=&id=`
- `POST /register`
- `GET /auth/status`
- `POST /auth/register`
- `POST /auth/verify`

登录 API：

- `GET /`
- `GET /messages?q=&limit=&offset=`
- `DELETE /messages`
- `GET/DELETE /messages/{wxId}`
- `GET /reads/{id}`
- `GET /reads/{id}/data`
- `DELETE /reads/{id}`
- `POST /reads/{id}/public`
- `GET/POST/DELETE /reads/{id}/block`
- `POST /reads/{id}/geo`
- `GET /leaderboard?scope=day|total&metric=reg|read|msg`
- `POST /auth/logout`
- `POST /auth/password`
- `GET/POST/DELETE /account/ip-block`
- `GET /account`

管理员 API：

- `GET /admin`
- `GET/POST /admin/users`
- `POST /admin/level`
- `POST /admin/password`
- `DELETE /admin/users/{wxId}`
- `GET/DELETE /admin/messages`
- `DELETE /admin/messages/{id}`
- `GET/POST/DELETE /admin/ip-block`
- `GET/POST /admin/levels`
- `GET/POST /admin/retention`
- `GET /admin/retention/preview`
- `POST /admin/retention/run`
- `GET/POST /admin/retention/orphans`

## 与原服务器的重要差异

1. Cloudflare Worker/D1 没有 Bun SQLite，因此数据库访问全部使用 D1 Binding API。
2. 原服务器的 `.env` 在线写入在无文件系统的 Worker 中改为 D1 `meta` 持久化；等级公式修改后立即生效。
3. Worker 的 IP 来源使用 Cloudflare `CF-Connecting-IP`。
4. Worker 使用 Cache API 做固定窗口近似限流；这是无 KV 版本，不保证强一致计数。
5. 定时任务通过 Cron Trigger 每 10 分钟运行，并执行会话、审计、孤儿 reads、陈旧 geo 计数及僵尸用户清理。

## 安卓浏览器 UI

页面使用 `viewport-fit=cover`、`100dvh`、至少 40px 触摸命中区；720px 以下将表格转换成卡片，避免安卓窄屏横向滚动。

## 安全

请为 `ADMIN` 和 `INVITE_CODE` 使用 Secret，不要把真实值写进 `wrangler.toml`。该服务会保存消息明文、访问 IP、User-Agent 和打开时间，请按所在地法律及平台规则使用。
