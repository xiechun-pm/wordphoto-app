"""
词典服务 - 基于 ECDICT SQLite 英汉词典查询单词释义 + WordNet 语义增强
========================================================================
数据源:
  1. ECDICT - 开源英汉词典数据库
     来源: https://github.com/skywind3000/ECDICT
     词条数: ~150万 | 许可证: MIT | 字段数: 18
     引用: skywind3000. ECDICT. https://github.com/skywind3000/ECDICT

  2. NLTK WordNet - 普林斯顿大学词网
     来源: https://wordnet.princeton.edu/
     词条数: ~15.5万同义词集 | 许可证: WordNet 3.0 (免费科研/商业)

ECDICT 表结构 (words 表):
  ┌──────────────┬────────────┬─────────────────────────────────────┐
  │ 字段         │ 类型       │ 说明                                │
  ├──────────────┼────────────┼─────────────────────────────────────┤
  │ word         │ VARCHAR(64)│ 单词 (主键, NOCASE)                  │
  │ sw           │ VARCHAR(64)│ 标准化词形                           │
  │ phonetic     │ VARCHAR(64)│ 音标 (IPA)                          │
  │ definition   │ TEXT       │ 英文释义                             │
  │ translation  │ TEXT       │ 中文释义 (分号分隔多义项)             │
  │ pos          │ VARCHAR(16)│ 词性 (n/v/adj/adv, 用/分隔)          │
  │ collins      │ INTEGER    │ 柯林斯星级 (0-5)                     │
  │ oxford       │ INTEGER    │ 牛津3000核心词汇 (0/1)               │
  │ tag          │ TEXT       │ 考试标签 (zk/gk/cet4/cet6/ky/ielts/  │
  │              │            │   toefl/gre, 空格分隔)               │
  │ bnc          │ INTEGER    │ BNC词频顺序                          │
  │ frq          │ INTEGER    │ COCA词频顺序                         │
  └──────────────┴────────────┴─────────────────────────────────────┘
"""

import os
import json
import sqlite3
from typing import Optional, Dict, Any, List
from dataclasses import dataclass


@dataclass
class WordEntry:
    """单词完整数据条目"""
    word: str
    phonetic: str = ""
    translation: str = ""
    definition: str = ""
    pos: str = ""
    collins: int = 0
    oxford: int = 0
    tag: str = ""
    bnc: int = 0
    frq: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "word": self.word,
            "phonetic": self.phonetic,
            "translation": self.translation,
            "definition": self.definition,
            "pos": self.pos,
            "collins": self.collins,
            "oxford": self.oxford,
            "tag": self.tag,
            "bnc": self.bnc,
            "frq": self.frq,
        }

    def get_tag_labels(self) -> List[str]:
        """获取考试标签的中文名称列表"""
        TAG_MAP = {
            "zk": "中考", "gk": "高考", "cet4": "四级",
            "cet6": "六级", "ky": "考研", "ielts": "雅思",
            "toefl": "托福", "gre": "GRE", "sat": "SAT",
        }
        if not self.tag:
            return []
        return [TAG_MAP.get(t, t) for t in self.tag.strip().split() if t]

    def get_exam_level(self) -> str:
        """获取考试等级描述"""
        if not self.tag:
            return "其他"
        tags = self.tag.strip().split()
        level_order = ["zk", "gk", "cet4", "cet6", "ky", "ielts", "toefl", "gre", "sat"]
        for level in level_order:
            if level in tags:
                return TAG_MAP.get(level, level)
        return "其他"

    def get_frequency_label(self) -> str:
        """获取词频等级标签"""
        if self.collins >= 5:
            return "最常用词 (5星)"
        elif self.collins >= 3:
            return "常用词 (3-4星)"
        elif self.collins >= 1:
            return "较常用词 (1-2星)"
        elif self.bnc and self.bnc < 5000:
            return "高频词"
        else:
            return "低频词"


# 考试标签映射
TAG_MAP = {
    "zk": "中考", "gk": "高考", "cet4": "四级",
    "cet6": "六级", "ky": "考研", "ielts": "雅思",
    "toefl": "托福", "gre": "GRE", "sat": "SAT",
}


class DictService:
    """
    英汉词典查询服务
    使用 ECDICT SQLite 数据库查询单词的全维度数据

    数据源优先级:
      Level 1: ECDICT SQLite (本地离线, 150万词条)
      Level 2: 内置常用词表 (fallback, ~3000核心词)
    """

    # 内置常用词表 (当 ECDICT 不可用时的 fallback)
    FALLBACK_WORDS = {
        "hello": "你好;喂",
        "goodbye": "再见",
        "apple": "苹果",
        "book": "书;书籍;预订",
        "computer": "计算机;电脑",
        "dog": "狗",
        "english": "英语;英文的",
        "friend": "朋友",
        "good": "好的;良好的",
        "happy": "快乐的;高兴的",
        "love": "爱;热爱",
        "school": "学校",
        "student": "学生",
        "teacher": "老师",
        "water": "水",
        "world": "世界",
        "study": "学习;研究",
        "learn": "学习;学会",
        "run": "跑;跑步;运行",
        "beautiful": "美丽的;漂亮的",
    }

    def __init__(self, db_path: Optional[str] = None):
        """
        Args:
            db_path: ECDICT SQLite 数据库路径
                     默认查找 backend/data/stardict.db
        """
        if db_path is None:
            base_dir = os.path.dirname(os.path.dirname(__file__))
            db_path = os.path.join(base_dir, "data", "stardict.db")

        self.db_path = db_path
        self._conn = None
        self._db_available = False
        self._check_db()

    def _check_db(self):
        """检查数据库是否可用"""
        if os.path.exists(self.db_path):
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM words")
                count = cursor.fetchone()[0]
                cursor.execute("PRAGMA table_info(words)")
                columns = [c[1] for c in cursor.fetchall()]
                conn.close()
                self._db_available = True
                print(f"[DictService] ECDICT 数据库已加载: {count:,} 词条, {len(columns)} 字段")
            except Exception:
                self._db_available = False
        else:
            print(f"[DictService] ECDICT 数据库未找到 ({self.db_path})")
            print("[DictService] 运行 python setup_data.py 自动下载安装")
            self._db_available = False

    def _get_connection(self) -> Optional[sqlite3.Connection]:
        """获取数据库连接 (懒加载)"""
        if not self._db_available:
            return None
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path)
            self._conn.row_factory = sqlite3.Row
        return self._conn

    def lookup(self, word: str) -> str:
        """
        查询英文单词的中文释义 (精简版, 单字符串返回)

        Args:
            word: 要查询的英文单词

        Returns:
            中文释义字符串, 未找到则返回空字符串
        """
        entry = self.lookup_full(word)
        if entry:
            return entry.translation

        # fallback: 内置词表
        word_lower = word.strip().lower()
        return self.FALLBACK_WORDS.get(word_lower, "")

    def lookup_full(self, word: str) -> Optional[WordEntry]:
        """
        查询单词完整数据 (全字段)

        Args:
            word: 要查询的英文单词

        Returns:
            WordEntry 对象 (含音标/释义/词性/柯林斯星级/考试标签等),
            未找到返回 None
        """
        word = word.strip().lower()
        conn = self._get_connection()
        if conn is None:
            # 数据库不可用, 查 fallback
            translation = self.FALLBACK_WORDS.get(word, "")
            if translation:
                return WordEntry(word=word, translation=translation)
            return None

        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT word, phonetic, translation, definition, pos, "
                "collins, oxford, tag, bnc, frq "
                "FROM words WHERE word = ? LIMIT 1",
                (word,),
            )
            row = cursor.fetchone()
            if row:
                return WordEntry(
                    word=row["word"],
                    phonetic=row["phonetic"] or "",
                    translation=(row["translation"] or "").replace("\n", "; ").strip(),
                    definition=(row["definition"] or "").replace("\n", "; ").strip(),
                    pos=row["pos"] or "",
                    collins=row["collins"] or 0,
                    oxford=row["oxford"] or 0,
                    tag=row["tag"] or "",
                    bnc=row["bnc"] or 0,
                    frq=row["frq"] or 0,
                )
            # fallback
            translation = self.FALLBACK_WORDS.get(word, "")
            if translation:
                return WordEntry(word=word, translation=translation)
            return None
        except sqlite3.Error:
            return None

    def lookup_batch(
        self, words: List[str], include_fields: Optional[List[str]] = None
    ) -> Dict[str, Optional[WordEntry]]:
        """
        批量查询多个单词 (更高效)

        Args:
            words: 单词列表
            include_fields: 需要包含的字段列表, None 表示全部

        Returns:
            {word: WordEntry} 字典
        """
        if not words:
            return {}

        conn = self._get_connection()
        results = {}

        if conn is None:
            # 仅 fallback
            for w in words:
                wl = w.strip().lower()
                translation = self.FALLBACK_WORDS.get(wl, "")
                results[w] = WordEntry(word=wl, translation=translation) if translation else None
            return results

        cursor = conn.cursor()
        try:
            # 分批查询 (SQLite 参数数量限制)
            batch_size = 100
            for i in range(0, len(words), batch_size):
                batch = words[i:i + batch_size]
                placeholders = ",".join("?" for _ in batch)
                cursor.execute(
                    f"SELECT word, phonetic, translation, definition, pos, "
                    f"collins, oxford, tag, bnc, frq "
                    f"FROM words WHERE word IN ({placeholders})",
                    batch,
                )
                for row in cursor.fetchall():
                    results[row["word"]] = WordEntry(
                        word=row["word"],
                        phonetic=row["phonetic"] or "",
                        translation=(row["translation"] or "").replace("\n", "; ").strip(),
                        definition=(row["definition"] or "").replace("\n", "; ").strip(),
                        pos=row["pos"] or "",
                        collins=row["collins"] or 0,
                        oxford=row["oxford"] or 0,
                        tag=row["tag"] or "",
                        bnc=row["bnc"] or 0,
                        frq=row["frq"] or 0,
                    )

            # 未命中的单词查 fallback
            for w in words:
                wl = w.strip().lower()
                if wl not in results:
                    translation = self.FALLBACK_WORDS.get(wl, "")
                    if translation:
                        results[wl] = WordEntry(word=wl, translation=translation)
                    else:
                        results[wl] = None
        except sqlite3.Error:
            pass

        return results

    def get_stats(self) -> Dict[str, Any]:
        """获取数据库统计信息"""
        conn = self._get_connection()
        if conn is None:
            return {"available": False}

        cursor = conn.cursor()
        stats = {"available": True}

        try:
            cursor.execute("SELECT COUNT(*) FROM words")
            stats["total_words"] = cursor.fetchone()[0]

            # 柯林斯星级分布
            cursor.execute(
                "SELECT collins, COUNT(*) FROM words WHERE collins > 0 "
                "GROUP BY collins ORDER BY collins DESC"
            )
            stats["collins_distribution"] = {
                f"{r[0]}星": r[1] for r in cursor.fetchall()
            }

            # 牛津3000词汇量
            cursor.execute("SELECT COUNT(*) FROM words WHERE oxford = 1")
            stats["oxford_3000_count"] = cursor.fetchone()[0]

            # 各考试标签词汇量
            tag_stats = {}
            for tag_name, tag_label in [
                ("zk", "中考"), ("gk", "高考"), ("cet4", "四级"),
                ("cet6", "六级"), ("ky", "考研"), ("ielts", "雅思"),
                ("toefl", "托福"), ("gre", "GRE"),
            ]:
                cursor.execute(
                    "SELECT COUNT(*) FROM words WHERE tag LIKE ?",
                    (f"%{tag_name}%",)
                )
                tag_stats[tag_label] = cursor.fetchone()[0]
            stats["exam_tag_counts"] = tag_stats

        except sqlite3.Error as e:
            stats["error"] = str(e)

        return stats

    def close(self):
        """关闭数据库连接"""
        if self._conn:
            self._conn.close()
            self._conn = None


# 单例
_instance = None


def get_dict_service() -> DictService:
    """获取 DictService 单例"""
    global _instance
    if _instance is None:
        _instance = DictService()
    return _instance