from fastapi import FastAPI, Request, APIRouter, Response
from fun_simu import generate_rag_context, generate_stance_cls, generate_emo_cls, generat_scene_cls
tool_call_router = APIRouter()

@tool_call_router.post("/rag")
async def tool_call_rag(request: Request):
    data = await request.json()
    query = data["query"]
    rag_result = generate_rag_context(query)
    return {"message": rag_result}

@tool_call_router.post("/stance_cls")
async def tool_call_stance(request: Request):
    data = await request.json()
    query = data["query"]
    stance_cls_result = generate_stance_cls(query)
    return {"message": stance_cls_result}

@tool_call_router.post("/emo_cls")
async def tool_call_emo(request: Request):
    data = await request.json()
    query = data["query"]
    emo_cls_result = generate_emo_cls(query)
    return {"message": emo_cls_result}
    
@tool_call_router.post("/scene_cls")
async def tool_call_scene(request: Request):
    data = await request.json()
    query = data["query"]
    scene_cls_result = generat_scene_cls(query)
    return {"message": scene_cls_result}

@tool_call_router.options("/rag")
async def options_rag():
    return Response(status_code=200)

@tool_call_router.options("/stance_cls")
async def options_stance():
    return Response(status_code=200)

@tool_call_router.options("/emo_cls")
async def options_emo():
    return Response(status_code=200)

@tool_call_router.options("/scene_cls")
async def options_scene():
    return Response(status_code=200)

from fastapi.responses import StreamingResponse

@tool_call_router.post("/rag_stream")
async def tool_call_rag_stream(request: Request):
    data = await request.json()
    query = data.get("query", "")
    text = generate_rag_context(query) or ""
    def gen():
        import time
        for i in range(0, len(text), 80):
            chunk = text[i:i+80]
            yield f"data: {chunk}\n\n"
            time.sleep(0.02)
        yield "event: done\ndata: done\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")
