# backend-server

backend-server 是本项目的 Node.js 业务中台，负责承接前端请求、管理 SQLite/Prisma 元数据、处理文件上传与分片上传、编排 AI-server 入库回调，以及维护聊天会话与消息记录。

## 技术栈

- Express 5
- Prisma
- SQLite
- Multer
- Zod
- TypeScript

## 目录结构

```text
backend-server/
├─ src/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ controllers/
│  ├─ middleware/
│  ├─ repositories/
│  ├─ routes/
│  └─ services/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ docs/
├─ upload/
├─ .env.example
└─ package.json
```

## 核心职责

- 管理用户、知识库文件、入库任务、chunk 元数据
- 提供文件预检、直传、分片上传、状态查询、入库派发、出库、删除接口
- 提供聊天会话、消息、流式 completion 入口
- 与 AI-server 通过 HTTP 协作完成向量化与聊天生成

## 主要接口前缀

- `/health`
- `/v1/files/**`
- `/v1/tasks/**`
- `/v1/chat/**`
- `/v1/ai/**`

完整接口说明见 [docs/api-spec.md](docs/api-spec.md)。

## 环境变量

建议先复制 `.env.example` 为 `.env`，再按本地环境调整：

```env
DATABASE_URL="file:./dev.db"
PORT=3001
AI_SERVICE_BASE_URL=http://127.0.0.1:8000
AI_SERVICE_SHARED_SECRET=
UPLOAD_MAX_FILE_SIZE_MB=20
AI_SERVICE_TIMEOUT_MS=12000
AI_INGESTION_ENDPOINT=
AI_VECTOR_DELETE_ENDPOINT=
MOCK_INGEST_RUNNING_DELAY_MS=800
MOCK_INGEST_DONE_DELAY_MS=2200
MOCK_INGEST_FAIL=0
```

说明：

- `DATABASE_URL`: Prisma/SQLite 连接串
- `PORT`: Node 服务端口，默认 `3001`
- `AI_SERVICE_BASE_URL`: Python AI 服务地址
- `AI_SERVICE_SHARED_SECRET`: 与 AI-server 的共享密钥
- `UPLOAD_MAX_FILE_SIZE_MB`: 单文件上传大小上限
- `AI_SERVICE_TIMEOUT_MS`: 调用 AI-server 超时时间

## 安装与初始化

```bash
cd backend-server
npm install
npm run prisma:generate
npm run prisma:migrate
```

如果只希望把当前 schema 推到本地数据库，也可以使用：

```bash
npm run prisma:push
```

## 启动方式

开发模式：

```bash
cd backend-server
npm run dev
```

直接启动：

```bash
cd backend-server
npm run start
```

构建检查：

```bash
cd backend-server
npm run build
```

默认服务地址：`http://127.0.0.1:3001`

## 与其他服务的关系

- client 通过 `http://localhost:3001/v1` 调用本服务
- 本服务负责保存聊天会话、文件元数据、chunk 元数据
- 本服务把知识库入库任务和聊天请求转发给 AI-server
- AI-server 完成任务后再回调本服务，更新状态和 chunk 信息

## 补充文档

- [docs/api-spec.md](docs/api-spec.md)
- [docs/node-service-functional-guide.md](docs/node-service-functional-guide.md)
- [prisma/schema-design.md](prisma/schema-design.md)
