/**
 * 拍照识词导出助手 - 小程序入口
 * 全局配置与生命周期 · 基于微信云开发
 */
App({
  /**
   * 当小程序初始化完成时触发（全局只触发一次）
   */
  onLaunch() {
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        // env 参数说明：
        // 使用默认环境（第一个创建的环境），也可以指定环境 ID
        // env: 'your-env-id',  // 如需指定环境，取消注释并填入环境 ID
        traceUser: true,  // 记录用户访问，用于云函数分析
      });
    }

    // 获取系统信息
    const sysInfo = wx.getSystemInfoSync();
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