"""
拍照识词导出助手 - FastAPI 后端主入口
"""
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import ocr, export

app = FastAPI(
    title="拍照识词导出助手 API",
    description="OCR 识别英文单词并导出为多种背词软件格式",
    version="1.0.0",
)

# CORS 配置，允许小程序请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载路由
app.include_router(ocr.router, prefix="/ocr", tags=["OCR识别"])
app.include_router(export.router, prefix="/export", tags=["导出服务"])

# 导出文件临时目录（应通过 Nginx 映射为静态资源）
EXPORT_DIR = os.path.join(os.path.dirname(__file__), "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

# 将导出目录挂载为静态文件，供用户下载
app.mount("/downloads", StaticFiles(directory=EXPORT_DIR), name="downloads")


@app.get("/")
async def root():
    """健康检查接口"""
    return {"code": 0, "message": "拍照识词导出助手 API 运行正常"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)