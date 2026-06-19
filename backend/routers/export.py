"""
导出文件生成路由 - POST /export/generate
"""
import os
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
from services.export_service import ExportService

router = APIRouter()
export_service = ExportService()


class WordItem(BaseModel):
    """单个单词条目"""
    word: str
    meaning: str = ""


class ExportRequest(BaseModel):
    """导出请求"""
    format: str = Field(..., description="导出格式：txt / csv / anki / momo / bubei / eudic / baicizhan / youdao / quizlet")
    words: List[WordItem] = Field(..., description="单词列表，每个元素含 word 和 meaning")


class ExportResponse(BaseModel):
    code: int
    data: dict


@router.post("/generate", response_model=ExportResponse)
async def generate_export(req: ExportRequest):
    """
    根据指定格式生成单词导出文件，返回下载链接

    请求体格式:
    {
        "format": "csv",
        "words": [{"word": "hello", "meaning": "你好"}, ...]
    }

    支持的 format 值:
    - txt       : TXT 每行一个单词
    - csv       : CSV 两列 (word, meaning)
    - anki      : Anki CSV 分号分隔
    - momo      : 墨墨背单词格式（每行一个单词）
    - bubei     : 不背单词格式（纯单词列表）
    - eudic     : 欧路词典 StudyList.xml
    - baicizhan : 百词斩格式（逗号分隔单词+释义）
    - youdao    : 有道词典 XML 格式
    - quizlet   : Quizlet CSV 格式 (term, definition)
    """
    valid_formats = {"txt", "csv", "anki", "momo", "bubei", "eudic", "baicizhan", "youdao", "quizlet"}
    if req.format not in valid_formats:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的导出格式 '{req.format}'，支持的格式: {', '.join(valid_formats)}",
        )

    if not req.words:
        raise HTTPException(status_code=400, detail="单词列表不能为空")

    try:
        words_data = [{"word": item.word, "meaning": item.meaning} for item in req.words]
        filename, download_url = export_service.generate(req.format, words_data)
        return {
            "code": 0,
            "data": {
                "download_url": download_url,
                "filename": filename,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出文件生成失败: {str(e)}")