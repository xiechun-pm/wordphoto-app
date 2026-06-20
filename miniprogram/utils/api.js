/**
 * API 请求封装工具 · 本地离线版本
 * 
 * 所有后端能力已从云函数迁移到本地模块：
 *   - OCR 识别：返回演示模式数据（无需云开发）
 *   - 词典查词：委托给本地 dict.js 模块
 *   - 导出文件：委托给本地 export.js 模块
 * 
 * 所有函数均返回 Promise，与原有云函数调用保持一致的接口风格
 */

// 引入本地模块
var dict = require('./dict');
var exportUtil = require('./export');

/**
 * OCR 图片识别（演示模式）
 * 
 * 由于已移除云开发依赖，此函数返回演示模式结果，
 * 调用方可据此判断当前处于离线/演示模式并展示示例数据
 * 
 * @param {string} filePath - 图片临时路径（演示模式下不使用）
 * @returns {Promise<Object>} { code: 0, data: { words: [], demo_mode: true, hint: '演示模式' } }
 */
function recognizeImage(filePath) {
  return Promise.resolve({
    code: 0,
    data: {
      // 演示模式下不返回 OCR 识别结果
      words: [],
      // 标记为演示模式，供调用方判断
      demo_mode: true,
      // 提示信息
      hint: '演示模式',
    },
  });
}

/**
 * 词典查词（本地）
 * 
 * 调用本地 dict.js 模块的 lookupBatch 函数进行单词查询，
 * 将结果包装为与云函数一致的返回格式
 * 
 * @param {Array<string>} words - 待查询的单词数组
 * @returns {Promise<Object>} { code: 0, data: { meanings, not_found, total, matched } }
 */
function dictLookup(words) {
  return new Promise(function (resolve) {
    // 调用本地词典模块进行批量查询
    var result = dict.lookupBatch(words);
    
    // 包装为统一响应格式
    resolve({
      code: 0,
      data: {
        // 单词到释义的映射表
        meanings: result.meanings,
        // 未找到释义的单词列表
        not_found: result.notFound,
        // 查询总数
        total: words.length,
        // 匹配成功数量
        matched: Object.keys(result.meanings).length,
      },
    });
  });
}

/**
 * 导出文件生成（本地）
 * 
 * 调用本地 export.js 模块的 generateExport 函数生成文件内容，
 * 将结果包装为与云函数一致的返回格式
 * 
 * @param {string} format - 导出格式（txt/csv/anki/momo/bubei/eudic/baicizhan/youdao/quizlet）
 * @param {Array<Object>} words - 单词数组 [{word: string, meaning: string}, ...]
 * @returns {Promise<Object>} { code: 0, data: { format, word_count, content, filename } }
 */
function generateExport(format, words) {
  return new Promise(function (resolve, reject) {
    try {
      // 调用本地导出模块生成文件内容
      var result = exportUtil.generateExport(format, words);
      
      // 包装为统一响应格式
      resolve({
        code: 0,
        data: {
          // 导出格式标识
          format: format,
          // 单词数量
          word_count: words.length,
          // 文件内容字符串
          content: result.content,
          // 文件名
          filename: result.filename,
        },
      });
    } catch (err) {
      // 捕获导出过程中的错误
      reject(err);
    }
  });
}

/**
 * 健康检查
 * 
 * 由于已移除云开发依赖，始终返回成功状态
 * 
 * @returns {Promise<Object>} { code: 0 }
 */
function healthCheck() {
  return Promise.resolve({ code: 0 });
}

// 导出所有 API 函数
module.exports = {
  recognizeImage: recognizeImage,
  dictLookup: dictLookup,
  generateExport: generateExport,
  healthCheck: healthCheck,
};