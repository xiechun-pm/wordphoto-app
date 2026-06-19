/**
 * 云函数：OCR 文字识别
 * 
 * 功能：接收图片，识别其中的英文文本，提取单词并返回
 * 
 * 调用方式：wx.cloud.callFunction({ name: 'ocr', data: { fileID: 'cloud://...' } })
 * 
 * 输入参数：
 *   - fileID: 云存储文件 ID（图片上传到云存储后的 fileID）
 * 
 * 输出：
 *   - raw_text: 识别出的原始文本
 *   - words: 提取的单词列表（去重、去停用词、去除非英文）
 *   - total: 单词总数
 * 
 * 说明：
 *   本函数为 OCR 引擎的接入层。
 *   生产环境可接入：
 *   - 腾讯云 OCR API（推荐，与微信云开发同生态）
 *   - 百度 OCR API
 *   - 或其他第三方 OCR 服务
 * 
 *   当前版本提供基础文本提取能力，适合演示。
 *   如需完整 OCR 能力，请按下方「接入腾讯云 OCR」注释启用。
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ========== 停用词列表 ==========
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'shall', 'should', 'may', 'might', 'must', 'can',
  'could', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'out', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because',
  'and', 'but', 'or', 'if', 'while', 'although', 'this', 'that',
  'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our',
  'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
  'what', 'which', 'who', 'whom', 'any', 'anybody', 'anyone',
  'anything', 'each', 'everybody', 'everyone', 'everything',
  'no', 'nobody', 'none', 'nothing', 'somebody', 'someone',
  'something', 'one', 'two', 'three', 'also', 's', 't', 're',
  've', 'll', 'd', 'm',
]);

/**
 * 从文本中提取英文单词（去重、去停用词、词形规范化）
 */
function extractWords(text) {
  if (!text || !text.trim()) return [];

  // 清理文本：只保留英文字母和空格
  const cleaned = text
    .replace(/[^a-zA-Z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // 分词
  const tokens = cleaned.split(/\s+/);

  // 过滤、去重
  const seen = new Set();
  const words = [];

  for (const token of tokens) {
    // 只保留纯字母单词（允许连字符和撇号）
    if (!/^[a-z]+(['-][a-z]+)*$/.test(token)) continue;
    if (token.length < 2) continue;
    if (token.length > 45) continue;
    if (STOP_WORDS.has(token)) continue;
    if (seen.has(token)) continue;

    seen.add(token);
    words.push(token);
  }

  return words;
}

/**
 * 云函数入口
 */
exports.main = async (event) => {
  const { fileID } = event;

  if (!fileID) {
    return { code: -1, message: '缺少图片 fileID' };
  }

  try {
    // ========================================================
    // 方案 A：使用腾讯云 OCR API（推荐生产环境启用）
    // 
    // 1. 开通腾讯云 OCR 服务：https://console.cloud.tencent.com/ocr
    // 2. 获取 SecretId 和 SecretKey
    // 3. 安装 SDK：npm install tencentcloud-sdk-nodejs-ocr
    // 4. 取消下方注释并填入密钥
    // ========================================================
    //
    // const tencentcloud = require('tencentcloud-sdk-nodejs-ocr');
    // const OcrClient = tencentcloud.ocr.v20181119.Client;
    // const client = new OcrClient({
    //   credential: {
    //     secretId: process.env.TENCENT_SECRET_ID,
    //     secretKey: process.env.TENCENT_SECRET_KEY,
    //   },
    //   region: 'ap-guangzhou',
    // });
    //
    // // 下载云存储图片为 base64
    // const downloadResult = await cloud.downloadFile({ fileID });
    // const imgBase64 = downloadResult.fileContent.toString('base64');
    //
    // const ocrResult = await client.GeneralBasicOCR({
    //   ImageBase64: imgBase64,
    //   LanguageType: 'eng',
    // });
    //
    // const rawText = ocrResult.TextDetections
    //   .map(item => item.DetectedText)
    //   .join(' ');

    // ========================================================
    // 方案 B：演示模式 — 从云存储下载图片，返回基础文本占位
    // 实际未执行 OCR，仅验证图片可达性
    // ========================================================
    const downloadResult = await cloud.downloadFile({ fileID });

    // 演示模式：返回提示信息
    // 实际 OCR 需要接入第三方 API（见上方方案 A）
    return {
      code: 0,
      message: 'success (demo mode — 请接入腾讯云 OCR API 启用完整识别)',
      data: {
        raw_text: '',
        words: [],
        total: 0,
        demo_mode: true,
        hint: '当前为演示模式。请参考云函数代码中的"方案 A"注释，接入腾讯云 OCR API 后即可启用完整 OCR 识别能力。',
      },
    };
  } catch (err) {
    console.error('[OCR] 识别失败:', err);
    return {
      code: -1,
      message: 'OCR 识别失败: ' + (err.message || '未知错误'),
    };
  }
};