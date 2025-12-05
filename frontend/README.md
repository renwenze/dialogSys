# 前端对话系统

- 打开 `index.html` 即可使用，无需额外依赖。
- 左侧为主对话框，右侧为中间调用结果，包括：
  - 外源知识引用：基于输入关键字生成参考来源与链接（示例模拟）。
  - 复杂自然语言理解：展示意图、实体与推理步骤（示例模拟）。

## 使用说明
- 在输入框输入内容并发送，系统会异步生成中间结果与最终回复。
- 点击引用卡片中的链接可在浏览器打开搜索结果。

## 后续对接
- 后端接口已内置在本地服务器：
  - POST `/api/citations`  请求体：`{ "query": string }`  响应：`{ "citations": {title,url,snippet}[] }`
  - POST `/api/nlu`       请求体：`{ "text": string }`    响应：`{ "nlu": { intent:string, entities:{type,value}[], steps:string[], confidence:number } }`
  - POST `/api/chat`      请求体：`{ "text": string }`    响应：`{ "reply": string, "citations": [...], "nlu": {...} }`
  - 支持 CORS：`Access-Control-Allow-Origin: *`
- 前端已封装失败回退：若 `/api/*` 不可用则自动使用内置模拟逻辑。
- 可按需扩展 UI（如加入历史会话、标签页、加载骨架等）。
