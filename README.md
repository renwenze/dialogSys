### Persuasion Dialogue System

1. 调用NLU，获取用户输入的情感、立场、场景等信息。
2. 调用RAG，根据用户输入和场景信息，从知识库中获取相关信息。
3. 调用LLM，根据用户输入、情感、立场、场景和RAG结果，生成最终回复。

### Usage
1. 配置APIKEY
2. cd backend  python main.py 开启后端
3. cd frontend node sys.js 开启前端


