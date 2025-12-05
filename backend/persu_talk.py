from fastapi import FastAPI, Request, APIRouter, Response
from fastapi.responses import StreamingResponse
from agent import persu_agent

persu_talk_router = APIRouter()
agent = persu_agent()

@persu_talk_router.post("/")
async def handle_persu_talk(request: Request):
    data = await request.json()
    query = data.get("query", "")
    rag = data.get("rag", "")
    stance = data.get("stance", "中立")
    sentiment = data.get("sentiment", "中性")
    scene = data.get("scene", "通用")
    output = agent.generate(query, rag, stance, sentiment)
    return {"message": output}

@persu_talk_router.post("/stream")
async def handle_persu_talk_stream(request: Request):
    data = await request.json()
    query = data.get("query", "")
    rag = data.get("rag", "")
    stance = data.get("stance", "中立")
    sentiment = data.get("sentiment", "中性")
    scene = data.get("scene", "通用")
    text = agent.generate(query, rag, stance, sentiment) or ""
    def gen():
        import time
        for i in range(0, len(text), 40):
            chunk = text[i:i+40]
            yield f"data: {chunk}\n\n"
            time.sleep(0.02)
        yield "event: done\ndata: done\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")

@persu_talk_router.options("/")
async def options_persu_talk():
    return Response(status_code=200)

@persu_talk_router.options("/stream")
async def options_persu_talk_stream():
    return Response(status_code=200)
