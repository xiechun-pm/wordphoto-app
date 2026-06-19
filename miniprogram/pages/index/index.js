/**
 * 首页 - 拍照/相册选择入口
 * 提供拍照和从相册选择图片两种方式
 */
const api = require('../../utils/api');

Page({
  data: {
    // 是否正在请求中
    loading: false,
  },

  onLoad() {
    // 页面加载时可做健康检查
    this._healthCheck();
  },

  /**
   * 健康检查
   */
  _healthCheck() {
    api.healthCheck().then((res) => {
      console.log('后端连接正常', res);
    }).catch((err) => {
      console.warn('后端连接异常', err);
      // 不阻塞用户操作，仅在控制台输出警告
    });
  },

  /**
   * 拍照识别
   */
  onTakePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this._handleImage(tempFilePath);
      },
      fail: (err) => {
        if (err.errMsg.includes('cancel')) return;
        wx.showToast({ title: '拍照失败', icon: 'none' });
      },
    });
  },

  /**
   * 从相册选择图片
   */
  onSelectFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this._handleImage(tempFilePath);
      },
      fail: (err) => {
        if (err.errMsg.includes('cancel')) return;
        wx.showToast({ title: '选择失败', icon: 'none' });
      },
    });
  },

  /**
   * 处理选中的图片：跳转到结果页并传递临时路径
   * @param {string} tempFilePath - 图片临时文件路径
   */
  _handleImage(tempFilePath) {
    wx.navigateTo({
      url: `/pages/result/result?imagePath=${encodeURIComponent(tempFilePath)}`,
    });
  },
});