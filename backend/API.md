# 后端 API 接口说明

- 基础地址：`http://localhost:8000`
- 内容类型：
  - 普通请求：`Content-Type: application/json`
  - 流式请求（SSE）：`Accept: text/event-stream`
- CORS：已启用跨域，允许浏览器进行预检（`OPTIONS`）。

## 工具接口

- `POST /tool_call/rag`
  - 请求体：`{ "query": string }`
  - 响应体：`{ "message": string }`（RAG 长文本）
  - 示例：
    ```bash
    curl -X POST http://localhost:8000/tool_call/rag \
      -H "Content-Type: application/json" \
      -d '{"query":"请生成与主题相关的论据"}'
    ```

- `POST /tool_call/rag_stream`（SSE 流式）
  - 请求体：`{ "query": string }`
  - 响应：`text/event-stream`，逐条发送 `data: <chunk>`；结束时发送 `event: done`。
  - 示例：
    ```bash
    curl -N http://localhost:8000/tool_call/rag_stream \
      -H "Accept: text/event-stream" \
      -H "Content-Type: application/json" \
      -d '{"query":"请生成与主题相关的论据"}'
    ```

- `POST /tool_call/stance_cls`
  - 请求体：`{ "query": string }`
  - 响应体：`{ "message": "支持" | "反对" }`
  - 示例：
    ```bash
    curl -X POST http://localhost:8000/tool_call/stance_cls \
      -H "Content-Type: application/json" \
      -d '{"query":"我认为应该支持巴勒斯坦"}'
    ```

- `POST /tool_call/emo_cls`
  - 请求体：`{ "query": string }`
  - 响应体：`{ "message": "积极" | "消极" }`
  - 示例：
    ```bash
    curl -X POST http://localhost:8000/tool_call/emo_cls \
      -H "Content-Type: application/json" \
      -d '{"query":"我非常担心当前局势"}'
    ```

- `POST /tool_call/scene_cls`
  - 请求体：`{ "query": string }`
  - 响应体：`{ "message": string }`（如：`政治`、`军事`、`经济`、`宗教`、`科技`、`娱乐` 等）
  - 示例：
    ```bash
    curl -X POST http://localhost:8000/tool_call/scene_cls \
      -H "Content-Type: application/json" \
      -d '{"query":"从技术角度看待当前冲突的影响"}'
    ```

## 最终回复接口

- `POST /persu_talk/`
  - 请求体：
    ```json
    {
      "query": "string",
      "stance": "string",      // 可选：支持/反对
      "sentiment": "string",   // 可选：积极/消极
      "scene": "string",       // 可选：场景标签
      "rag": "string"          // 可选：RAG 长文本
    }
    ```
  - 响应体：`{ "message": string }`（最终生成的回复文本）
  - 示例：
    ```bash
    curl -X POST http://localhost:8000/persu_talk/ \
      -H "Content-Type: application/json" \
      -d '{
        "query":"您好，我们讨论一下巴以冲突",
        "stance":"支持",
        "sentiment":"积极",
        "scene":"政治",
        "rag":"...长文本..."
      }'
    ```

- `POST /persu_talk/stream`（SSE 流式）
  - 请求体：同上（支持携带 `stance/sentiment/scene/rag`）
  - 响应：`text/event-stream`，逐条发送 `data: <chunk>`；结束时发送 `event: done`。
  - 示例：
    ```bash
    curl -N http://localhost:8000/persu_talk/stream \
      -H "Accept: text/event-stream" \
      -H "Content-Type: application/json" \
      -d '{
        "query":"您好，我们讨论一下巴以冲突",
        "stance":"支持",
        "sentiment":"积极",
        "scene":"政治",
        "rag":"...长文本..."
      }'
    ```

## 约定
- 所有接口统一使用 `POST` 与 `application/json` 请求体。
- 前端默认并行调用四个工具接口获取结果，随后调用 `/persu_talk/stream` 流式生成最终回复。
- 若仅需同步回复，可调用 `/persu_talk/`。
