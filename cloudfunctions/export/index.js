/**
 * 云函数：导出文件生成
 * 
 * 功能：将单词列表生成为指定格式文件，上传到云存储，返回下载链接
 * 
 * 调用方式：wx.cloud.callFunction({ name: 'export', data: { format: 'csv', words: [...] } })
 * 
 * 输入参数：
 *   - format: 导出格式（txt/csv/anki/momo/bubei/eudic/baicizhan/youdao/quizlet）
 *   - words: 单词列表 [{word, meaning}, ...]
 * 
 * 输出：
 *   - fileID: 云存储文件 ID
 *   - download_url: 临时下载链接（2小时有效）
 *   - filename: 文件名
 *   - format: 格式标识
 *   - word_count: 单词数量
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ========== 格式 → 扩展名映射 ==========
const EXT_MAP = {
  txt: 'txt',
  csv: 'csv',
  anki: 'csv',
  momo: 'txt',
  bubei: 'txt',
  eudic: 'xml',
  baicizhan: 'txt',
  youdao: 'xml',
  quizlet: 'csv',
};

// ========== 各格式生成器 ==========

function generateTXT(words) {
  return words.map(item => item.word).filter(Boolean).join('\n') + '\n';
}

function generateCSV(words) {
  let content = '\uFEFFword,meaning\n'; // BOM 兼容 Excel 中文
  for (const item of words) {
    content += `${item.word || ''},${item.meaning || ''}\n`;
  }
  return content;
}

function generateAnki(words) {
  return words.map(item => `${item.word || ''};${item.meaning || ''}`).join('\n') + '\n';
}

function generateMomo(words) {
  return words.map(item => item.word).filter(Boolean).join('\n') + '\n';
}

function generateBubei(words) {
  return words.map(item => item.word).filter(Boolean).join('\n') + '\n';
}

function generateEudic(words) {
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n<wordbook>\n';
  for (const item of words) {
    const word = escapeXml(item.word || '');
    const meaning = item.meaning || '';
    xml += '  <item>\n';
    xml += `    <word>${word}</word>\n`;
    xml += `    <trans><![CDATA[${meaning}]]></trans>\n`;
    xml += '    <tags><![CDATA[]]></tags>\n';
    xml += '  </item>\n';
  }
  xml += '</wordbook>\n';
  return xml;
}

function generateBaicizhan(words) {
  return words
    .filter(item => item.word)
    .map(item => `${item.word},${item.meaning || ''}`)
    .join('\n') + '\n';
}

function generateYoudao(words) {
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n<wordbook>\n';
  for (const item of words) {
    const word = escapeXml(item.word || '');
    const meaning = item.meaning || '';
    xml += '  <item>\n';
    xml += `    <word>${word}</word>\n`;
    xml += `    <trans><![CDATA[${meaning}]]></trans>\n`;
    xml += '  </item>\n';
  }
  xml += '</wordbook>\n';
  return xml;
}

function generateQuizlet(words) {
  let content = 'term,definition\n';
  for (const item of words) {
    content += `${item.word || ''},${item.meaning || ''}\n`;
  }
  return content;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 格式生成器映射
const GENERATORS = {
  txt: { fn: generateTXT, ext: 'txt' },
  csv: { fn: generateCSV, ext: 'csv' },
  anki: { fn: generateAnki, ext: 'csv' },
  momo: { fn: generateMomo, ext: 'txt' },
  bubei: { fn: generateBubei, ext: 'txt' },
  eudic: { fn: generateEudic, ext: 'xml' },
  baicizhan: { fn: generateBaicizhan, ext: 'txt' },
  youdao: { fn: generateYoudao, ext: 'xml' },
  quizlet: { fn: generateQuizlet, ext: 'csv' },
};

/**
 * 云函数入口
 */
exports.main = async (event) => {
  const { format, words } = event;

  if (!format) {
    return { code: -1, message: '缺少导出格式 (format)' };
  }
  if (!words || !Array.isArray(words) || words.length === 0) {
    return { code: -1, message: '单词列表不能为空' };
  }

  const generator = GENERATORS[format];
  if (!generator) {
    return {
      code: -1,
      message: `不支持的导出格式: ${format}`,
      supported_formats: Object.keys(GENERATORS),
    };
  }

  try {
    // 生成文件内容
    const content = generator.fn(words);
    const timestamp = Date.now();
    const filename = `words_${format}_${timestamp}.${generator.ext}`;

    // 上传到云存储
    const cloudPath = `exports/${filename}`;
    const uploadResult = await cloud.uploadFile({
      cloudPath,
      fileContent: Buffer.from(content, 'utf-8'),
    });

    // 获取临时下载链接（有效期 2 小时）
    const downloadResult = await cloud.getTempFileURL({
      fileList: [uploadResult.fileID],
    });

    const downloadUrl = downloadResult.fileList[0].tempFileURL;

    return {
      code: 0,
      message: 'success',
      data: {
        fileID: uploadResult.fileID,
        download_url: downloadUrl,
        filename,
        format,
        word_count: words.length,
      },
    };
  } catch (err) {
    console.error('[Export] 导出失败:', err);
    return {
      code: -1,
      message: '导出失败: ' + (err.message || '未知错误'),
    };
  }
};