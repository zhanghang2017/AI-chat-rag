# client

client 是本仓库的前端应用，基于 React + Vite + Tailwind CSS，提供知识库管理、聊天问答、文件详情查看等界面。

## 技术栈

- React 18
- React Router 6
- Vite 5
- Tailwind CSS
- TypeScript
- react-markdown + remark-gfm

## 功能概览

- 共享顶部/左侧壳布局
- 知识库文件上传、分页、过滤、入库、出库、删除
- 文件 chunk 详情查看
- 基于知识库的聊天问答
- AI 回复 Markdown 渲染
- 聊天流式输出与自动滚动到底部

## 目录结构

```text
client/
├─ src/
│  ├─ api/
│  ├─ components/
│  ├─ hooks/
│  ├─ routes/
│  └─ workservice/
├─ package.json
└─ vite.config.ts
```

## 环境变量

建议先复制 `.env.example` 为 `.env`，前端主要通过 Vite 环境变量连接 backend-server：

```env
VITE_API_BASE_URL=http://localhost:3001/v1
VITE_UPLOAD_CHUNK_SIZE_BYTES=4194304
VITE_UPLOAD_CHUNK_CONCURRENCY=4
VITE_UPLOAD_CHUNK_RETRY_LIMIT=3
VITE_UPLOAD_SMALL_FILE_THRESHOLD_BYTES=20971520
```

如果不配置，代码中已提供默认值。

## 安装依赖

```bash
cd client
npm install
```

## 启动方式

开发模式：

```bash
cd client
npm run dev
```

生产构建：

```bash
cd client
npm run build
```

预览构建结果：

```bash
cd client
npm run preview
```

Vite 默认地址通常为：`http://127.0.0.1:5173`

## 路由说明

- `/chat`: 聊天页
- `/knowledge-base`: 知识库列表页
- `/knowledge-base/files/:fileId`: 知识库文件详情页

## 运行依赖

前端运行前需要先启动 backend-server；若要使用入库与聊天完整链路，还需要同时启动 AI-server。