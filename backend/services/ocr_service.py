"""
OCR 服务封装 - 基于 PaddleOCR 进行英文文本识别
"""
import numpy as np
from paddleocr import PaddleOCR


class OcrService:
    """
    PaddleOCR 英文识别服务
    使用 PP-OCRv3 轻量模型，启用英文识别（lang='en'）
    """

    def __init__(self):
        # 初始化 PaddleOCR，只启用英文识别
        # use_angle_cls=True 启用文本方向分类，提高倾斜文本识别率
        self.ocr = PaddleOCR(
            use_angle_cls=True,
            lang='en',
            use_gpu=False,        # CPU 推理，生产环境可配置 GPU
            show_log=False,       # 关闭日志输出
        )

    def recognize(self, image_path: str) -> str:
        """
        识别图片中的英文文本

        Args:
            image_path: 图片文件路径

        Returns:
            识别出的原始文本字符串，单词间以空格分隔
        """
        result = self.ocr.ocr(image_path, cls=True)

        if not result or not result[0]:
            return ""

        # 提取所有识别的文本行并拼接
        text_lines = []
        for line in result[0]:
            # line 结构: [bbox, (text, confidence)]
            text = line[1][0] if len(line[1]) > 0 else ""
            if text.strip():
                text_lines.append(text.strip())

        return " ".join(text_lines)