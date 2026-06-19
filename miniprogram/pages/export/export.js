/**
 * 导出页
 * 选择导出格式 → 调用云函数生成文件 → 返回云存储下载链接
 */
const api = require('../../utils/api');

Page({
  data: {
    // 导出格式选项
    formats: [
      { id: 'txt', name: 'TXT 格式', desc: '每行一个单词，适合通用导入', icon: '📄' },
      { id: 'csv', name: 'CSV 格式', desc: 'word,meaning 两列，可用 Excel 打开', icon: '📊' },
      { id: 'anki', name: 'Anki CSV', desc: '分号分隔，适合 Anki 间隔重复软件', icon: '🃏' },
      { id: 'momo', name: '墨墨背单词', desc: '纯单词列表，导入墨墨背单词', icon: '📝' },
      { id: 'bubei', name: '不背单词', desc: '纯单词列表，导入不背单词', icon: '📋' },
      { id: 'eudic', name: '欧路词典', desc: 'StudyList.xml 格式，导入欧路词典', icon: '📖' },
      { id: 'baicizhan', name: '百词斩', desc: '逗号分隔单词+释义，导入百词斩自定义词书', icon: '✂️' },
      { id: 'youdao', name: '有道词典', desc: 'XML 格式，导入有道词典生词本', icon: '📘' },
      { id: 'quizlet', name: 'Quizlet', desc: 'CSV 两列 term/definition，导入Quizlet', icon: '🎴' },
    ],
    // 当前选中的格式 ID
    selectedFormat: 'csv',
    // 是否正在导出中
    exporting: false,
    // 单词数据（从全局获取）
    words: [],
  },

  onLoad() {
    const app = getApp();
    const words = app.globalData.ocrResult || [];

    if (words.length === 0) {
      wx.showToast({ title: '没有可导出的单词', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.setData({ words });
  },

  /**
   * 选择导出格式
   */
  onSelectFormat(e) {
    const formatId = e.currentTarget.dataset.id;
    this.setData({ selectedFormat: formatId });
  },

  /**
   * 确认导出 — 调用云函数生成文件
   */
  onConfirmExport() {
    const { selectedFormat, words } = this.data;
    if (words.length === 0) {
      wx.showToast({ title: '单词列表为空', icon: 'none' });
      return;
    }

    this.setData({ exporting: true });
    wx.showLoading({ title: '生成导出文件...', mask: true });

    api.generateExport(selectedFormat, words).then((res) => {
      wx.hideLoading();
      this.setData({ exporting: false });

      if (res.code === 0 && res.data) {
        const downloadUrl = res.data.download_url;

        // 复制下载链接到剪贴板
        wx.setClipboardData({
          data: downloadUrl,
          success: () => {
            wx.showModal({
              title: '导出成功',
              content: `文件 ${res.data.filename} 已生成。\n\n下载链接已复制到剪贴板，请到浏览器中打开下载。\n\n注意：链接有效期为 2 小时，请尽快下载。`,
              confirmText: '知道了',
              success: () => {
                // 可在此记录导出历史（P2 功能预留）
              },
            });
          },
          fail: () => {
            wx.showModal({
              title: '导出成功',
              content: `文件 ${res.data.filename} 已生成。\n\n下载链接:\n${downloadUrl}\n\n请复制链接到浏览器中打开下载。`,
              confirmText: '知道了',
            });
          },
        });
      } else {
        wx.showToast({ title: res.message || '导出失败', icon: 'none' });
      }
    }).catch((err) => {
      wx.hideLoading();
      this.setData({ exporting: false });
      wx.showToast({ title: err.message || '云函数调用失败', icon: 'none' });
    });
  },
});