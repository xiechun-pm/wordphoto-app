/**
 * 拍照识词导出助手 - 小程序入口
 * 全局配置与生命周期 · 本地离线版本
 */
App({
  /**
   * 当小程序初始化完成时触发（全局只触发一次）
   */
  onLaunch() {
    // 获取系统信息
    var sysInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = sysInfo;
  },

  /**
   * 全局数据
   */
  globalData: {
    systemInfo: null,
    // OCR 识别结果缓存（从 result 页传到 export 页）
    ocrResult: null,
  },
});