"""
OCR 识别路由 - POST /ocr/recognize
接收图片 → PaddleOCR 识别 → 词形还原 → 查词典 → 返回结果
"""
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.ocr_service import OcrService
from services.word_parser import WordParser
from services.dict_service import DictService

router = APIRouter()

# 上传图片临时存储目录
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ocr_service = OcrService()
word_parser = WordParser()
dict_service = DictService()


@router.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    """
    接收上传的图片，执行 OCR 识别，返回单词列表和中文释义

    请求: multipart/form-data, 字段名 file
    响应: {"code":0,"data":{"words":["hello"],"meanings":{"hello":"你好"}}}
    """
    # 校验文件类型
    allowed_types = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if file.content_type and file.content_type not in allowed_types:
        # 如果 content_type 为空，仍尝试基于扩展名处理
        pass

    # 保存上传文件
    ext = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    try:
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")

    try:
        # 1. OCR 识别图片中的英文文本
        raw_text = ocr_service.recognize(filepath)

        # 2. 解析提取单词并词形还原
        lemmatized_words = word_parser.extract_and_lemmatize(raw_text)

        # 3. 查询中文释义
        meanings = {}
        for word in lemmatized_words:
            meaning = dict_service.lookup(word)
            if meaning:
                meanings[word] = meaning

        # 去重但保留顺序
        seen = set()
        unique_words = []
        for w in lemmatized_words:
            if w not in seen:
                seen.add(w)
                unique_words.append(w)

        return {
            "code": 0,
            "data": {
                "words": unique_words,
                "meanings": {w: meanings.get(w, "") for w in unique_words},
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 处理失败: {str(e)}")
    finally:
        # 清理临时图片文件
        if os.path.exists(filepath):
            os.remove(filepath)