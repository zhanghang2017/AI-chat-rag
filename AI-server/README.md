# AI-server

AI-server 是 RAG 管道中的 Python 服务。目前重点承载知识库文件入库能力，后续可以在同一应用下继续扩展聊天相关能力。

## 核心职责

- 提供 FastAPI 接口接收摄取任务
- 根据文件类型加载 PDF、DOCX、TXT 文档
- 使用文本切分器将文档拆分为可嵌入的 chunk
- 调用智谱嵌入模型生成向量并写入 Chroma
- 回调 Node 服务同步任务进度与 chunk 元数据

## 架构概览

### 请求入口

- `main.py` 暴露 `/health` 和 `/ingestion/jobs`
- `/ingestion/jobs` 接收 `IngestionJob`，并通过 `BackgroundTasks` 异步启动处理流程

### 目录组织

- `app/config.py`: 应用级运行时配置
- `app/knowledge_base/`: 知识库领域模块，集中放置入库相关操作
- 未来可新增 `app/chat/`: 聊天与检索编排能力

### 知识库核心模块

- `app/knowledge_base/schemas.py`: 定义入库任务、回调、chunk 同步等共享数据结构
- `app/knowledge_base/document_loader.py`: 按文件扩展名选择文档加载器
- `app/knowledge_base/embedding_model.py`: 创建嵌入模型客户端
- `app/knowledge_base/vector_store.py`: 封装 Chroma 的删除与批量写入
- `app/knowledge_base/ingestion_callback_client.py`: 回调 Node 服务，更新状态并同步 chunk 元数据
- `app/knowledge_base/ingestion_service.py`: 串联完整知识库入库流程

### 处理流程

1. Node 服务调用 `/ingestion/jobs` 提交任务
2. AI-server 校验共享密钥并把任务放入后台执行
3. `process_knowledge_ingestion_job` 校验文件是否存在
4. 根据扩展名加载文档内容
5. 使用 `RecursiveCharacterTextSplitter` 进行切块
6. 清理该文件旧的向量数据，避免重复索引
7. 为每个 chunk 生成向量 ID、摘要和元数据
8. 批量写入 Chroma collection
9. 将 chunk 元数据同步回 Node 服务
10. 回调最终任务状态 `success` 或 `failed`

## 目录说明

```text
AI-server/
├─ main.py                # FastAPI 入口
├─ requirements.txt       # Python 依赖
└─ app/
	├─ config.py                 # 环境配置
	└─ knowledge_base/
	   ├─ schemas.py            # Pydantic 数据模型
	   ├─ document_loader.py    # 文档加载器
	   ├─ embedding_model.py    # 嵌入模型工厂
	   ├─ vector_store.py       # Chroma 向量库封装
	   ├─ ingestion_callback_client.py  # Node 回调客户端
	   └─ ingestion_service.py  # 入库流程编排
```

## 运行准备

在当前目录下创建虚拟环境并安装依赖：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## 启动方式

激活虚拟环境后运行 FastAPI 服务：

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000
```

## 环境变量

- `ZHIPUAI_API_KEY`: 智谱嵌入模型密钥，必填
- `NODE_BASE_URL`: Node 服务基础地址，默认是 `http://127.0.0.1:3001/v1`
- `AI_SERVICE_SHARED_SECRET`: AI-server 与 Node 服务之间的共享密钥，建议配置
- `CHROMA_PERSIST_DIRECTORY`: Chroma 持久化目录，默认位于 `AI-server/ai_chroma`
- `CHROMA_COLLECTION_NAME`: 向量集合名，默认是 `knowledge_chunks`
- `INGEST_CHUNK_SIZE`: 文本切块长度，默认是 `800`
- `INGEST_CHUNK_OVERLAP`: 相邻 chunk 重叠长度，默认是 `120`
- `EMBEDDING_BATCH_SIZE`: 向量写入批大小，默认是 `64`
- `NODE_CALLBACK_TIMEOUT_SECONDS`: 回调 Node 服务的超时时间，默认是 `10`

## 对接约定

- 请求头 `x-ai-service-secret` 用于 AI-server 与 Node 服务之间的简单鉴权
- `fileId` 用于删除旧向量和关联 chunk 元数据
- `taskId` 用于驱动前端或上游任务状态展示
- `contentMd5` 会写入向量 metadata，便于后续做内容级追踪或去重

## 当前实现说明

- 当前服务聚焦摄取链路，不负责检索和问答生成
- 文件类型目前支持 `pdf`、`docx`、`txt`
- 向量存储使用本地持久化 Chroma，适合本地开发与轻量部署
