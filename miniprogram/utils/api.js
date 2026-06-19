/**
 * API 请求封装工具 · 基于云开发云函数调用
 * 所有后端能力通过 wx.cloud.callFunction() 调用
 */

/**
 * 通用云函数调用封装
 * @param {string} name   - 云函数名称
 * @param {object} data   - 传入参数
 * @returns {Promise}
 */
const callFunction = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        resolve(res.result);
      },
      fail: (err) => {
        console.error(`[CloudFunc] ${name} 调用失败:`, err);
        reject(new Error(err.errMsg || '云函数调用失败'));
      },
    });
  });
};

/**
 * OCR 识别 — 先上传图片到云存储，再调用云函数识别
 * 流程：选择图片 → 上传到云存储 → 调用 ocr 云函数 → 返回结果
 * 
 * @param {string} filePath - 图片临时路径
 * @returns {Promise}
 */
const recognizeImage = async (filePath) => {
  // 1. 上传图片到云存储
  const timestamp = Date.now();
  const cloudPath = `ocr_images/${timestamp}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  
  const uploadRes = await new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: resolve,
      fail: reject,
    });
  });

  // 2. 调用 OCR 云函数
  return callFunction('ocr', { fileID: uploadRes.fileID });
};

/**
 * 词典查词 — 批量查询单词释义
 * @param {Array} words - 单词列表
 * @returns {Promise}
 */
const dictLookup = (words) => {
  return callFunction('dictLookup', { words });
};

/**
 * 导出文件生成 — 调用云函数生成并返回下载链接
 * @param {string} format - 导出格式
 * @param {Array} words   - 单词列表 [{word, meaning}, ...]
 * @returns {Promise}
 */
const generateExport = (format, words) => {
  return callFunction('export', { format, words });
};

/**
 * 健康检查 — 验证云开发环境是否可用
 * @returns {Promise}
 */
const healthCheck = () => {
  return callFunction('dictLookup', { words: ['test'] });
};

module.exports = {
  recognizeImage,
  dictLookup,
  generateExport,
  healthCheck,
};