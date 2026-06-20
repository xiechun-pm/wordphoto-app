/**
 * 本地导出模块
 * 
 * 功能：将单词列表生成为指定格式的文本内容，支持 9 种导出格式
 * 
 * 所有格式生成均使用纯字符串拼接，无需 Node.js Buffer，兼容微信小程序环境
 * 
 * 使用方式：
 *   const exportUtil = require('./export');
 *   const result = exportUtil.generateExport('csv', [{word: 'apple', meaning: '苹果'}]);
 *   // result = { content: '...', filename: 'words_csv_xxx.csv', ext: 'csv' }
 */

// ========== XML 转义辅助函数 ==========
// 将特殊字符转义为 XML 实体，确保生成合法的 XML 文档
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ========== 9 种格式生成器 ==========
// 每个生成器接收 words 数组 [{word, meaning}, ...]，返回纯文本字符串

/**
 * TXT 格式：每行一个单词，纯文本列表
 * 适用于通用文本编辑器导入
 */
function generateTXT(words) {
  var lines = [];
  for (var i = 0; i < words.length; i++) {
    var w = words[i].word;
    if (w) {
      lines.push(w);
    }
  }
  return lines.join('\n') + '\n';
}

/**
 * CSV 格式：word,meaning 两列，包含 BOM 头以兼容 Excel 打开中文
 * 适用于 Excel、Google Sheets 等电子表格软件
 */
function generateCSV(words) {
  // BOM 头确保 Excel 正确识别 UTF-8 编码的中文
  var content = '\uFEFFword,meaning\n';
  for (var i = 0; i < words.length; i++) {
    content += (words[i].word || '') + ',' + (words[i].meaning || '') + '\n';
  }
  return content;
}

/**
 * Anki CSV 格式：分号分隔单词和释义
 * 适用于 Anki 间隔重复记忆软件
 */
function generateAnki(words) {
  var lines = [];
  for (var i = 0; i < words.length; i++) {
    lines.push((words[i].word || '') + ';' + (words[i].meaning || ''));
  }
  return lines.join('\n') + '\n';
}

/**
 * 墨墨背单词格式：纯单词列表，每行一个
 * 适用于墨墨背单词 App 导入
 */
function generateMomo(words) {
  var lines = [];
  for (var i = 0; i < words.length; i++) {
    var w = words[i].word;
    if (w) {
      lines.push(w);
    }
  }
  return lines.join('\n') + '\n';
}

/**
 * 不背单词格式：纯单词列表，每行一个
 * 适用于不背单词 App 导入
 */
function generateBubei(words) {
  var lines = [];
  for (var i = 0; i < words.length; i++) {
    var w = words[i].word;
    if (w) {
      lines.push(w);
    }
  }
  return lines.join('\n') + '\n';
}

/**
 * 欧路词典格式：StudyList.xml 格式
 * 适用于欧路词典生词本导入
 */
function generateEudic(words) {
  var xml = '<?xml version="1.0" encoding="utf-8"?>\n<wordbook>\n';
  for (var i = 0; i < words.length; i++) {
    var word = escapeXml(words[i].word || '');
    var meaning = words[i].meaning || '';
    xml += '  <item>\n';
    xml += '    <word>' + word + '</word>\n';
    xml += '    <trans><![CDATA[' + meaning + ']]></trans>\n';
    xml += '    <tags><![CDATA[]]></tags>\n';
    xml += '  </item>\n';
  }
  xml += '</wordbook>\n';
  return xml;
}

/**
 * 百词斩格式：逗号分隔单词和释义，每行一条
 * 适用于百词斩自定义词书导入
 */
function generateBaicizhan(words) {
  var lines = [];
  for (var i = 0; i < words.length; i++) {
    if (words[i].word) {
      lines.push(words[i].word + ',' + (words[i].meaning || ''));
    }
  }
  return lines.join('\n') + '\n';
}

/**
 * 有道词典格式：XML 格式，包含单词和释义
 * 适用于有道词典生词本导入
 */
function generateYoudao(words) {
  var xml = '<?xml version="1.0" encoding="utf-8"?>\n<wordbook>\n';
  for (var i = 0; i < words.length; i++) {
    var word = escapeXml(words[i].word || '');
    var meaning = words[i].meaning || '';
    xml += '  <item>\n';
    xml += '    <word>' + word + '</word>\n';
    xml += '    <trans><![CDATA[' + meaning + ']]></trans>\n';
    xml += '  </item>\n';
  }
  xml += '</wordbook>\n';
  return xml;
}

/**
 * Quizlet 格式：CSV 两列 term/definition
 * 适用于 Quizlet 学习集导入
 */
function generateQuizlet(words) {
  var content = 'term,definition\n';
  for (var i = 0; i < words.length; i++) {
    content += (words[i].word || '') + ',' + (words[i].meaning || '') + '\n';
  }
  return content;
}

// ========== 格式生成器映射表 ==========
// 每个格式对应一个生成函数和文件扩展名
var GENERATORS = {
  txt:       { fn: generateTXT,       ext: 'txt' },
  csv:       { fn: generateCSV,       ext: 'csv' },
  anki:      { fn: generateAnki,      ext: 'csv' },
  momo:      { fn: generateMomo,      ext: 'txt' },
  bubei:     { fn: generateBubei,     ext: 'txt' },
  eudic:     { fn: generateEudic,     ext: 'xml' },
  baicizhan: { fn: generateBaicizhan, ext: 'txt' },
  youdao:    { fn: generateYoudao,    ext: 'xml' },
  quizlet:   { fn: generateQuizlet,   ext: 'csv' },
};

// 支持的格式列表（用于错误提示）
var SUPPORTED_FORMATS = Object.keys(GENERATORS);

/**
 * 生成导出文件
 * 根据指定的格式，调用对应的生成器函数，返回文件内容、文件名和扩展名
 * 
 * @param {string} format - 导出格式标识符（txt/csv/anki/momo/bubei/eudic/baicizhan/youdao/quizlet）
 * @param {Array<Object>} words - 单词数组，每项为 {word: string, meaning: string}
 * @returns {Object} { content: string, filename: string, ext: string }
 *   - content: 文件内容字符串
 *   - filename: 带时间戳的唯一文件名
 *   - ext: 文件扩展名
 * @throws {Error} 如果格式不支持或单词列表为空
 * 
 * 示例：
 *   generateExport('csv', [{word: 'apple', meaning: '苹果'}])
 *   // => { content: '\uFEFFword,meaning\napple,苹果\n', filename: 'words_csv_1234567890.csv', ext: 'csv' }
 */
function generateExport(format, words) {
  // 校验格式参数
  if (!format) {
    throw new Error('缺少导出格式参数 (format)');
  }

  // 校验单词列表
  if (!words || !Array.isArray(words) || words.length === 0) {
    throw new Error('单词列表不能为空');
  }

  // 查找对应的格式生成器
  var generator = GENERATORS[format];
  if (!generator) {
    throw new Error(
      '不支持的导出格式: ' + format + '，支持: ' + SUPPORTED_FORMATS.join(', ')
    );
  }

  // 调用生成器函数，生成纯文本内容
  var content = generator.fn(words);

  // 生成带时间戳的文件名，确保唯一性
  var timestamp = Date.now();
  var filename = 'words_' + format + '_' + timestamp + '.' + generator.ext;

  // 返回生成结果
  return {
    content: content,
    filename: filename,
    ext: generator.ext,
  };
}

// 导出 generateExport 函数
module.exports = {
  generateExport: generateExport,
};