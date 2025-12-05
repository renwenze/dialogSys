# 对话系统 API 规范

## 通用
- 基础路径：相对（同域）或通过前端 `api.js` 的 `API_BASE` 自行扩展。
- 内容类型：请求 `Content-Type: application/json`，响应 `application/json`。
- CORS：响应头包含 `Access-Control-Allow-Origin: *`、`Access-Control-Allow-Headers: Content-Type`，支持预检 `OPTIONS`。

## 1) 外源知识引用
- 路径：`POST /api/citations`
- 请求体：
  - `query`：string，用户输入文本或检索查询
- 响应体：
  - `citations`：数组，每项字段：
    - `title`：string，引用标题
    - `url`：string，来源链接
    - `snippet`：string，简要说明或摘要
- 示例：
```json
{
  "query": "如何使用向量数据库做检索增强"
}
```
```json
{
  "citations": [
    {"title":"关于 检索 的权威资料","url":"https://www.bing.com/search?q=%E6%A3%80%E7%B4%A2","snippet":"基于公开来源检索到与「检索」相关的结果，供参考。"}
  ]
}
```

## 2) 复杂自然语言理解（NLU）
- 路径：`POST /api/nlu`
- 请求体：
  - `query`：string，原始用户输入
- 响应体：
  - `nlu`：对象，字段：
    - `intent`：string，识别的意图
    - `entities`：数组，元素 `{ type: string, value: string }`
    - `steps`：string[]，推理/处理步骤
    - `confidence`：number，置信度 0–1
    - `sentiment`：string，情感识别（`积极`/`消极`/`中性`）
    - `stance`：string，立场识别（`支持`/`反对`/`中立`）
    - `scene`：string，场景识别（如 `产品`/`技术`/`会议`/`通用`）
- 示例：
```json
{
  "query": "为什么我的索引构建这么慢？"
}
```
```json
{
  "nlu": {
    "intent":"原因解释",
    "entities":[{"type":"数值","value":"10"}],
    "steps":["定位原因或机制","结合案例说明","给出建议与改进"],
    "confidence":0.82,
    "sentiment":"中性",
    "stance":"中立",
    "scene":"技术"
  }
}
```

## 3) FastAPI 后端接口（对齐当前后端）

- 路径：`POST /tool_call/rag`
  - 请求体：`{ "query": string }`
  - 响应体：`{ "message": string }`（RAG 长文本）

- 路径：`POST /tool_call/stance_cls`
  - 请求体：`{ "query": string }`
  - 响应体：`{ "message": "支持" | "反对" }`

- 路径：`POST /tool_call/emo_cls`
  - 请求体：`{ "query": string }`
  - 响应体：`{ "message": "积极" | "消极" }`

- 路径：`POST /tool_call/scene_cls`
  - 请求体：`{ "query": string }`
  - 响应体：`{ "message": string }`（如：`政治`/`军事`/`经济`/`宗教`/`科技`/`娱乐` 等）

- 路径：`POST /persu_talk/`
  - 请求体：`{ "query": string }`
  - 响应体：`{ "message": string }`（最终回复文本）

说明：前端先并行调用四个工具端点，读取各接口返回的 `message` 字段；随后再调用 `/persu_talk/` 生成最终回复。若你扩展 `/persu_talk/` 支持融合工具结果，可把请求体扩展为：

```json
{
  "query": "...",
  "stance": "支持",
  "sentiment": "积极",
  "scene": "技术",
  "rag": "...RAG 长文本..."
}
```

## 错误
- 失败时返回 HTTP 4xx/5xx，响应体：
```json
{"error":"not_found"}
```

## 前端封装
- 前端 API 封装位于 `front/api.js`：
  - `API.getCitationsAndNLU(text)`：并行请求 `/tool_call/` 与 `/persu_talk/`，负载统一为 `{query:text}`，失败自动回退到模拟
  - `API.getChat(text, nlu, citations)`：调用 `/persu_talk/` 生成回复，负载 `{query:text}`，失败回退为本地合成
- 如需改为调用你的后端域名，设置 `API_BASE`（在 `front/api.js` 顶部）指向你的服务地址。
