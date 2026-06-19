"""
导出服务 - 生成多种背词软件导入格式文件
"""
import os
import uuid
from typing import List, Dict, Tuple, Optional
from xml.sax.saxutils import escape


class ExportService:
    """
    多格式导出服务
    支持格式: txt, csv, anki, momo, bubei, eudic, baicizhan, youdao, quizlet
    """

    def __init__(self, export_dir: Optional[str] = None):
        """
        Args:
            export_dir: 导出文件存放目录，默认 backend/exports/
        """
        if export_dir is None:
            base_dir = os.path.dirname(os.path.dirname(__file__))
            export_dir = os.path.join(base_dir, "exports")
        self.export_dir = export_dir
        os.makedirs(self.export_dir, exist_ok=True)

    def generate(self, fmt: str, words: List[Dict[str, str]]) -> Tuple[str, str]:
        """
        根据指定格式生成导出文件

        Args:
            fmt: 格式标识（txt / csv / anki / momo / bubei / eudic / baicizhan / youdao / quizlet）
            words: 单词列表，每项含 word 和 meaning

        Returns:
            (filename, download_url) 元组
        """
        generator = {
            "txt": self._generate_txt,
            "csv": self._generate_csv,
            "anki": self._generate_anki,
            "momo": self._generate_momo,
            "bubei": self._generate_bubei,
            "eudic": self._generate_eudic,
            "baicizhan": self._generate_baicizhan,
            "youdao": self._generate_youdao,
            "quizlet": self._generate_quizlet,
        }

        if fmt not in generator:
            raise ValueError(f"不支持的导出格式: {fmt}")

        content, ext = generator[fmt](words)
        filename = f"words_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(self.export_dir, filename)

        # 写入文件
        with open(filepath, "wb") as f:
            if isinstance(content, str):
                f.write(content.encode("utf-8"))
            else:
                f.write(content)

        # 返回下载链接（/downloads/ 由 main.py 的 StaticFiles 挂载）
        download_url = f"/downloads/{filename}"
        return filename, download_url

    # ---------- 各格式生成方法 ----------

    def _generate_txt(self, words: List[Dict[str, str]]) -> Tuple[str, str]:
        """TXT 格式：每行一个单词"""
        lines = [item["word"] for item in words if item.get("word")]
        return "\n".join(lines) + "\n", "txt"

    def _generate_csv(self, words: List[Dict[str, str]]) -> Tuple[str, str]:
        """CSV 格式：word,meaning 两列，UTF-8 with BOM 兼容 Excel"""
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["word", "meaning"])
        for item in words:
            writer.writerow([item.get("word", ""), item.get("meaning", "")])
        # 加 BOM 以兼容 Excel 中文显示
        content = "\ufeff" + output.getvalue()
        return content, "csv"

    def _generate_anki(self, words: List[Dict[str, str]]) -> Tuple[str, str]:
        """Anki CSV 格式：分号分隔，无 BOM"""
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output, delimiter=";")
        for item in words:
            writer.writerow([item.get("word", ""), item.get("meaning", "")])
        return output.getvalue(), "csv"

    def _generate_momo(self, words: List[Dict[str, str]]) -> Tuple[str, str]:
        """墨墨背单词格式：每行一个单词"""
        lines = [item["word"] for item in words if item.get("word")]
        return "\n".join(lines) + "\n", "txt"

    def _generate_bubei(self, words: List[Dict[str, str]]) -> Tuple[str, str]:
        """不背单词格式：纯单词列表，无释义"""
        lines = [item["word"] for item in words if item.get("word")]
        return "\n".join(lines) + "\n", "txt"

    def _generate_eudic(self, words: List[Dict[str, str]]) -> Tuple[str, str]:
        """
        欧路词典格式：StudyList.xml
        格式参考：
        <wordbook>
          <item>
            <word>hello</word>
            <trans><![CDATA[你好]]></trans>
            <tags><![CDATA[]]></tags>
          </item>
        </wordbook>
        """
        lines = ['<?xml version="1.0" encoding="utf-8"?>']
        lines.append("<wordbook>")
        for item in words:
            word = escape(item.get("word", ""))
            meaning = item.get("meaning", "")
            lines.append("  <item>")
            lines.append(f"    <word>{word}</word>")
            lines.append(f"    <trans><![CDATA[{meaning}]]></trans>")
            lines.append("    <tags><![CDATA[]]></tags>")
            lines.append("  </item>")
        lines.append("</wordbook>")
        return "\n".join(lines), "xml"

    # ========== 新增格式 ==========

    def _generate_baicizhan(self, words: List[Dict[str, str]]) -> Tuple[str, str]:
        """
        百词斩格式：每行 "单词,释义"
        百词斩"创建自定义词书"支持 TXT 每行一个单词 或 逗号分隔的单词+释义
        参考: https://g.pconline.com.cn/x/1903/19036876.html
        """
        import csv
        import io

        output = io.StringIO()
        for item in words:
            word = item.get("word", "")
            meaning = item.get("meaning", "")
            if word:
                output.write(f"{word},{meaning}\n")
        return output.getvalue(), "txt"

    def _generate_youdao(self, words: List[Dict[str, str]]) -> Tuple[str, str]:
        """
        有道词典格式：XML 生词本格式
        有道词典支持导入 XML 格式的单词本文件
        格式: <wordbook><item><word>hello</word><trans><![CDATA[你好]]></trans></item></wordbook>
        参考: https://g.pconline.com.cn/x/2006/20065213.html
        """
        lines = ['<?xml version="1.0" encoding="utf-8"?>']
        lines.append("<wordbook>")
        for item in words:
            word = escape(item.get("word", ""))
            meaning = item.get("meaning", "")
            lines.append("  <item>")
            lines.append(f"    <word>{word}</word>")
            lines.append(f"    <trans><![CDATA[{meaning}]]></trans>")
            lines.append("  </item>")
        lines.append("</wordbook>")
        return "\n".join(lines), "xml"

    def _generate_quizlet(self, words: List[Dict[str, str]]) -> Tuple[str, str]:
        """
        Quizlet 格式：CSV 两列 (term, definition)
        Quizlet 支持导入 CSV / TXT 格式，两列分别为术语和定义
        参考: https://help.quizlet.com
        """
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["term", "definition"])
        for item in words:
            writer.writerow([item.get("word", ""), item.get("meaning", "")])
        return output.getvalue(), "csv"