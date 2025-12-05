from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from persu_talk import persu_talk_router
from tool_call import tool_call_router


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"] ,
    allow_headers=["*"],
)
app.include_router(persu_talk_router, prefix="/persu_talk")
app.include_router(tool_call_router, prefix="/tool_call")

@app.get("/")
async def root():
    return {"message": "Link Success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
