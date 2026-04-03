# AI-server

AI-server 是本仓库中的 Python AI 服务，负责两类核心能力：

- 知识库文件入库、切块、向量化、写入 Chroma
- 基于知识库检索结果的流式聊天生成

当前实现基于 FastAPI，对外提供摄取任务接口、向量删除接口和聊天流式接口，作为 Node backend 的 AI 执行层。

## 技术栈

- FastAPI
- LangChain
- Chroma
- Zhipu Embeddings
- OpenAI 兼容聊天模型接口

## 目录结构

```text
AI-server/
├─ main.py
├─ requirements.txt
├─ .env.example
├─ ai_chroma/
└─ app/
   ├─ config.py
   ├─ chat/
   │  ├─ llm.py
   │  ├─ prompts.py
   │  ├─ retriever.py
   │  ├─ schemas.py
   │  └─ service.py
   └─ knowledge_base/
      ├─ document_loader.py
      ├─ embedding_model.py
      ├─ ingestion_callback_client.py
      ├─ ingestion_service.py
      ├─ schemas.py
      └─ vector_store.py
```

## 主要接口

- `GET /health`: 健康检查
- `POST /ingestion/jobs`: 接收 Node 服务提交的入库任务
- `DELETE /vectors/files/{file_id}`: 删除某个文件在向量库中的所有 chunk
- `POST /chat/stream`: 执行一次基于知识库的流式聊天

## 环境变量

建议从 `.env.example` 复制一份到 `.env` 后再填写。不是所有配置都必须填写，按功能分组如下。

- 必填，知识库入库功能需要：`ZHIPUAI_API_KEY`
- 必填，聊天功能需要：`OPENAI_API_KEY`
- 建议显式填写，聊天功能通常需要：`OPENAI_CHAT_MODEL`
- 可选，有默认值：`NODE_BASE_URL`、`CHROMA_PERSIST_DIRECTORY`、`CHROMA_COLLECTION_NAME`、`INGEST_CHUNK_SIZE`、`INGEST_CHUNK_OVERLAP`、`EMBEDDING_BATCH_SIZE`、`NODE_CALLBACK_TIMEOUT_SECONDS`、`CHAT_RETRIEVAL_TOP_K`、`CHAT_RETRIEVAL_SCORE_THRESHOLD`、`CHAT_CONTEXT_MESSAGE_LIMIT`、`HOST`、`PORT`
- 可选，按部署情况填写：`AI_SERVICE_SHARED_SECRET`、`OPENAI_BASE_URL`

如果你只验证知识库入库，不跑聊天，可以先不填 `OPENAI_API_KEY`。

如果你只验证聊天，不跑新的向量入库，可以先不填 `ZHIPUAI_API_KEY`。

`CHAT_RETRIEVAL_TOP_K` 控制最多返回多少个候选 chunk；`CHAT_RETRIEVAL_SCORE_THRESHOLD` 控制最低相关性阈值，范围是 `0` 到 `1`，越高越严格。若问题与知识库无关，命中结果可能少于 `top_k`，甚至为 `0`。

## 安装依赖

```powershell
cd AI-server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## 启动服务

```powershell
cd AI-server
.\.venv\Scripts\Activate.ps1
python main.py
```

服务默认地址：`http://127.0.0.1:8000`

`main.py` 会读取 `.env` 中的 `HOST` 和 `PORT`；未配置时默认使用 `127.0.0.1:8000`。

## 运行流程

### 知识库入库

1. backend-server 接收上传文件并写入文件元数据
2. backend-server 调用 `POST /ingestion/jobs`
3. AI-server 后台解析文件并切块
4. 生成向量并写入 Chroma
5. 回调 backend-server 更新任务状态与 chunk 元数据

### 聊天问答

1. client 调用 backend-server 的聊天接口
2. backend-server 转发请求到 AI-server 的聊天流接口
3. AI-server 检索知识库相关内容
4. 组装 prompt 并调用聊天模型流式生成
5. 以 SSE 事件形式返回增量内容与引用来源

## 注意事项

- 当前知识库默认支持 `pdf`、`docx`、`txt`
- `langchain-openai` 负责调用 OpenAI 兼容聊天模型，所以 `OPENAI_BASE_URL` 可接入阿里百炼等兼容接口
- 本地开发默认使用持久化 Chroma，目录位于 `AI-server/ai_chroma`
- 若配置了 `AI_SERVICE_SHARED_SECRET`，Node 侧回调和调用都必须携带相同密钥
