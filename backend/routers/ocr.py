"""
OCR 识别路由 - POST /ocr/recognize
"""
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.ocr_service import OcrService
from services.word_parser import WordParser
from services.dict_service import DictService

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ocr_service = OcrService()
word_parser = WordParser()
dict_service = DictService()


@router.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    """
    接收上传图片 → OCR 识别 → 词形还原 → 查词典 → 返回单词+释义
    """
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
        # 1. OCR 识别
        raw_text = ocr_service.recognize(filepath)

        # 2. 提取单词 + 词形还原
        lemmatized_words = word_parser.extract_and_lemmatize(raw_text)

        # 3. 查询释义
        meanings = {}
        for word in lemmatized_words:
            meaning = dict_service.lookup(word)
            if meaning:
                meanings[word] = meaning

        # 去重保序
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
        if os.path.exists(filepath):
            os.remove(filepath)