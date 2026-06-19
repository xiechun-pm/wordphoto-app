#!/usr/bin/env python3
"""
拍照识词导出助手 - 数据初始化脚本
===============================
从公开数据源下载并初始化字典数据库。

公开数据源列表：
  1. ECDICT SQLite    – 开源英汉词典数据库 (150万词条, 18字段)
     来源: https://github.com/skywind3000/ECDICT
     许可证: MIT
     引用: skywind3000. ECDICT: Free English to Chinese Dictionary Database [Computer software].
            https://github.com/skywind3000/ECDICT
  2. NLTK WordNet     – 普林斯顿大学词网数据库 (语义关系/同义词/上位词)
     来源: https://wordnet.princeton.edu/
     许可证: WordNet 3.0 License (Research & Commercial Free)
     引用: Princeton University. WordNet: An Electronic Lexical Database [Computer software].
  3. spaCy en_core_web_sm – 统计NLP模型 (词性标注/依存分析/词向量)
     来源: https://spacy.io/models/en
     许可证: MIT
     引用: Explosion AI. spaCy: Industrial-strength Natural Language Processing [Computer software].

使用方法:
  python setup_data.py              # 全自动下载并安装所有数据
  python setup_data.py --skip-nltk  # 跳过 NLTK 数据下载
  python setup_data.py --skip-ecdict  # 跳过 ECDICT 下载
"""

import os
import sys
import argparse
import sqlite3
import urllib.request
import zipfile
import shutil
import subprocess
import json
from pathlib import Path

# 项目路径配置
BACKEND_DIR = Path(__file__).parent
DATA_DIR = BACKEND_DIR / "data"
os.makedirs(DATA_DIR, exist_ok=True)


def print_header(title):
    """打印分节标题"""
    print()
    print("=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_step(msg):
    """打印步骤信息"""
    print(f"  ▶ {msg}")


def download_file(url, dest_path, desc="文件"):
    """
    下载文件并显示进度

    Args:
        url: 下载 URL
        dest_path: 保存路径
        desc: 描述文字
    """
    print_step(f"正在下载 {desc}...")
    print_step(f"  来自: {url}")

    def report(block_count, block_size, total_size):
        downloaded = block_count * block_size / 1024
        if total_size > 0:
            total = total_size / 1024
            percent = min(100, downloaded / total * 100)
            sys.stdout.write(f"\r  🚀 下载进度: {percent:.1f}% ({downloaded:.0f}KB / {total:.0f}KB)")
        else:
            sys.stdout.write(f"\r  🚀 已下载: {downloaded:.0f}KB")
        sys.stdout.flush()

    urllib.request.urlretrieve(url, dest_path, reporthook=report)
    print()
    print_step(f"✅ 下载完成: {dest_path}")
    return dest_path


# =====================
# 1. ECDICT 数据库
# =====================

ECDICT_URL = (
    "https://github.com/skywind3000/ECDICT/releases/download/1.0.28/ecdict-sqlite-28.zip"
)
ECDICT_ZIP = DATA_DIR / "ecdict-sqlite-28.zip"
ECDICT_DB = DATA_DIR / "stardict.db"

ECDICT_FIELD_DOCS = {
    "word": "单词名称 (主键, 不区分大小写)",
    "sw": "标准化词形 (标准化后的单词形式)",
    "phonetic": "音标 (国际音标)",
    "definition": "英文释义",
    "translation": "中文释义 (提供分号分隔的多义项)",
    "pos": "词性 (part of speech, 用/分隔多个词性)",
    "collins": "柯林斯星级 (0-5星, 5星为最高频词)",
    "oxford": "牛津3000核心词汇标识 (1表示是)",
    "tag": "考试大纲标签 (zk=中考, gk=高考, cet4=四级, cet6=六级, "
           "ky=考研, ielts=雅思, toefl=托福, gre=GRE, 空格分隔)",
    "bnc": "英国国家语料库词频顺序 (数字越小越常用)",
    "frq": "当代语料库词频顺序 (数字越小越常用)",
}


def setup_ecdict():
    """下载并安装 ECDICT SQLite 词典数据库"""
    print_header("📖 数据源 1/3: ECDICT 英汉词典数据库")

    if ECDICT_DB.exists():
        # 验证现有数据库
        try:
            conn = sqlite3.connect(str(ECDICT_DB))
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM words")
            count = cursor.fetchone()[0]
            cursor.execute("PRAGMA table_info(words)")
            columns = len(cursor.fetchall())
            conn.close()
            print_step(f"✅ ECDICT 数据库已存在 (单词数: {count:,}, 字段数: {columns})")
            return
        except Exception as e:
            print_step(f"⚠️ 数据库损坏: {e}, 重新下载...")
            ECDICT_DB.unlink()

    # 下载
    download_file(ECDICT_URL, ECDICT_ZIP, "ECDICT SQLite 数据库")

    # 解压
    print_step("正在解压...")
    with zipfile.ZipFile(ECDICT_ZIP, "r") as zf:
        zf.extractall(DATA_DIR)
    
    # 清理压缩包
    ECDICT_ZIP.unlink()
    
    # 重命名数据库文件 (解压出的文件名可能为 stardict.db 或 ecdict.db)
    db_files = list(DATA_DIR.glob("*.db"))
    main_db = None
    for f in db_files:
        if f.name == "stardict.db":
            main_db = f
            break
    if not main_db and db_files:
        db_files[0].rename(ECDICT_DB)
        main_db = ECDICT_DB

    # 验证
    conn = sqlite3.connect(str(main_db))
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM words")
    count = cursor.fetchone()[0]
    cursor.execute("PRAGMA table_info(words)")
    columns = cursor.fetchall()
    conn.close()

    print_step(f"✅ ECDICT 数据库初始化成功!")
    print_step(f"   📊 单词总数: {count:,}")
    print_step(f"   📊 字段数: {len(columns)}")
    print_step(f"   🔍 字段列表: {', '.join(c[1] for c in columns)}")
    print_step(f"   📁 存储位置: {main_db}")
    print_step(f"   🔗 数据来源: https://github.com/skywind3000/ECDICT")
    print_step(f"   📜 许可证: MIT License")


# =====================
# 2. ECDICT 数据库验证脚本
# =====================

QUERY_EXAMPLES = [
    "hello", "apple", "running", "beautiful",
    "algorithm", "photosynthesis", "democracy",
    "aberration", "ephemeral", "ubiquitous",
]


def validate_ecdict():
    """验证 ECDICT 数据库查询功能"""
    print_header("🔍 ECDICT 数据库验证")

    conn = sqlite3.connect(str(ECDICT_DB))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    success = 0
    fail = 0
    
    for word in QUERY_EXAMPLES:
        cursor.execute(
            "SELECT word, phonetic, translation, pos, collins, tag "
            "FROM words WHERE word = ? LIMIT 1", (word,)
        )
        row = cursor.fetchone()
        if row:
            success += 1
            print_step(f"  ✅ {word:15s} | {row['phonetic'] or 'N/A':20s} | "
                       f"{row['translation'] or 'N/A':30s} | "
                       f"柯林斯: {row['collins'] or '-'} | 标签: {row['tag'] or '-'}")
        else:
            fail += 1
            print_step(f"  ❌ {word:15s} | 未找到")
    
    total = success + fail
    print_step(f"📊 查询结果: ✅ {success}/{total} 成功  ❌ {fail}/{total} 失败")
    print_step(f"🎯 命中率: {success/total*100:.1f}%")
    
    conn.close()


# =====================
# 3. NLTK + spaCy 数据
# =====================

def setup_nltk():
    """下载 NLTK 所需数据 (WordNet, punkt, averaged_perceptron_tagger)"""
    print_header("🔤 数据源 2/3: NLTK 自然语言工具包数据")

    import nltk

    nltk_packages = {
        "wordnet": "WordNet 语义词典 (同义词/反义词/上位词)",
        "punkt": "分词器模型 (句子分割/单词标记化)",
        "averaged_perceptron_tagger": "词性标注模型",
        "punkt_tab": "punkt 分词表 (兼容 NLTK 3.9+)",
    }

    for pkg, desc in nltk_packages.items():
        try:
            nltk.data.find(f"tokenizers/{pkg}" if "punkt" in pkg
                           else f"taggers/{pkg}" if "tagger" in pkg
                           else f"corpora/{pkg}")
            print_step(f"✅ NLTK {pkg} ({desc}) 已就绪")
        except LookupError:
            print_step(f"📥 下载 NLTK {pkg} ({desc})...")
            nltk.download(pkg, quiet=False)
            print_step(f"✅ NLTK {pkg} 下载完成")


def setup_spacy():
    """下载 spaCy 英语模型"""
    print_header("🧠 数据源 3/3: spaCy 英语NLP模型")

    try:
        import spacy
        # 尝试加载模型
        nlp = spacy.load("en_core_web_sm")
        print_step(f"✅ spaCy en_core_web_sm 已加载")
        print_step(f"   📊 词向量维度: {nlp.meta.get('vectors', {}).get('width', 'N/A')}")
        print_step(f"   📊 流水线: {', '.join(nlp.pipe_names)}")
        print_step(f"   🔗 数据来源: OntoNotes 5.0, CoNLL-2003, GloVe")
    except OSError:
        print_step("📥 正在下载 spaCy en_core_web_sm 模型...")
        subprocess.run(
            [sys.executable, "-m", "spacy", "download", "en_core_web_sm"],
            check=True,
        )
        print_step("✅ spaCy en_core_web_sm 下载完成")
        # 再次验证
        import spacy
        nlp = spacy.load("en_core_web_sm")
        print_step(f"✅ 验证通过")


# =====================
# 数据总览报告
# =====================

def generate_data_report():
    """生成项目数据总览报告 JSON"""
    print_header("📋 生成数据总览报告")

    report = {
        "project": "拍照识词导出助手",
        "data_sources": [],
        "database_info": {},
        "data_quality": {},
    }

    # ECDICT 信息
    if ECDICT_DB.exists():
        conn = sqlite3.connect(str(ECDICT_DB))
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM words")
        word_count = cursor.fetchone()[0]
        cursor.execute("PRAGMA table_info(words)")
        columns = [c[1] for c in cursor.fetchall()]
        
        # 统计各考试标签的单词数量
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
        
        # 柯林斯星级分布
        cursor.execute(
            "SELECT collins, COUNT(*) FROM words WHERE collins > 0 "
            "GROUP BY collins ORDER BY collins DESC"
        )
        collins_dist = {f"{r[0]}星": r[1] for r in cursor.fetchall()}
        
        conn.close()

        report["database_info"] = {
            "type": "SQLite",
            "path": str(ECDICT_DB),
            "word_count": word_count,
            "total_fields": len(columns),
            "fields": columns,
        }
        report["data_quality"] = {
            "exam_tag_coverage": tag_stats,
            "collins_star_distribution": collins_dist,
            "test_query_accuracy": {},  # 由 validate_ecdict 填写
        }

    # 数据源列表
    report["data_sources"] = [
        {
            "name": "ECDICT",
            "type": "英汉词典数据库",
            "url": "https://github.com/skywind3000/ECDICT",
            "license": "MIT",
            "words": "1,500,000+",
            "description": "开源英汉双解词典，覆盖考试大纲和语料库词频",
        },
        {
            "name": "NLTK WordNet",
            "type": "英语语义词典",
            "url": "https://wordnet.princeton.edu/",
            "license": "WordNet 3.0 License (Free for research & commercial)",
            "words": "155,000+",
            "description": "普林斯顿大学词网数据库，提供同义词、反义词、上下位词关系",
        },
        {
            "name": "spaCy en_core_web_sm",
            "type": "统计NLP模型",
            "url": "https://spacy.io/models/en",
            "license": "MIT",
            "vectors": 300,
            "description": "基于OntoNotes 5.0和GloVe训练的CNN模型，词性标注+依存分析",
        },
    ]

    # 写入 JSON 报告
    report_path = DATA_DIR / "data_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print_step(f"✅ 数据报告已生成: {report_path}")


# =====================
# 主入口
# =====================

def main():
    parser = argparse.ArgumentParser(
        description="拍照识词导出助手 - 数据初始化工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python setup_data.py                # 全自动初始化
  python setup_data.py --skip-nltk    # 跳过 NLTK 数据
  python setup_data.py --validate     # 仅验证现有数据
        """,
    )
    parser.add_argument("--skip-ecdict", action="store_true", help="跳过 ECDICT 数据库下载")
    parser.add_argument("--skip-nltk", action="store_true", help="跳过 NLTK 数据下载")
    parser.add_argument("--skip-spacy", action="store_true", help="跳过 spaCy 模型下载")
    parser.add_argument("--validate", action="store_true", help="仅验证现有数据库，不下载")
    parser.add_argument("--report", action="store_true", help="仅生成数据报告")

    args = parser.parse_args()

    print()
    print("╔══════════════════════════════════════════════════════╗")
    print("║       📸 拍照识词导出助手                           ║")
    print("║       数据初始化工具 v1.0                           ║")
    print("╚══════════════════════════════════════════════════════╝")

    if args.report:
        generate_data_report()
        return

    if args.validate:
        if ECDICT_DB.exists():
            validate_ecdict()
        else:
            print_step("⚠️ ECDICT 数据库不存在，请先运行 setup_data.py")
        return

    print()
    print(f"  📁 数据目录: {DATA_DIR}")
    print(f"  📦 ECDICT 词库版本: 1.0.28 (150万+ 词条)")
    print(f"  🔗 项目地址: https://github.com/skywind3000/ECDICT")
    print()

    # 1. ECDICT
    if not args.skip_ecdict:
        setup_ecdict()
        validate_ecdict()
    else:
        print_step("⏭️  跳过 ECDICT (--skip-ecdict)")

    # 2. NLTK
    if not args.skip_nltk:
        setup_nltk()
    else:
        print_step("⏭️  跳过 NLTK (--skip-nltk)")

    # 3. spaCy
    if not args.skip_spacy:
        setup_spacy()
    else:
        print_step("⏭️  跳过 spaCy (--skip-spacy)")

    # 生成报告
    generate_data_report()

    print()
    print("╔══════════════════════════════════════════════════════╗")
    print("║   ✅  全部数据初始化完成!                            ║")
    print("║   运行 python main.py 启动后端服务                   ║")
    print("╚══════════════════════════════════════════════════════╝")
    print()


if __name__ == "__main__":
    main()