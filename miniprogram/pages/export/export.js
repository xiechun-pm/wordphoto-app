/**
 * 导出页
 * 选择导出格式 → 调用本地导出模块生成文件 → 写入临时文件或复制到剪贴板
 */
var api = require('../../utils/api');

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

  onLoad: function () {
    var app = getApp();
    var words = app.globalData.ocrResult || [];

    if (words.length === 0) {
      wx.showToast({ title: '没有可导出的单词', icon: 'none' });
      setTimeout(function () {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ words: words });
  },

  /**
   * 选择导出格式
   */
  onSelectFormat: function (e) {
    var formatId = e.currentTarget.dataset.id;
    this.setData({ selectedFormat: formatId });
  },

  /**
   * 确认导出 — 调用本地导出模块生成文件内容
   * 
   * 流程：
   *   1. 调用 api.generateExport 生成本地文件内容
   *   2. 使用 wx.getFileSystemManager().writeFile 写入临时文件
   *   3. 将内容复制到剪贴板，方便用户粘贴使用
   */
  onConfirmExport: function () {
    var that = this;
    var selectedFormat = this.data.selectedFormat;
    var words = this.data.words;

    if (words.length === 0) {
      wx.showToast({ title: '单词列表为空', icon: 'none' });
      return;
    }

    this.setData({ exporting: true });
    wx.showLoading({ title: '生成导出文件...', mask: true });

    // 步骤 1：调用本地导出模块生成文件内容
    api.generateExport(selectedFormat, words).then(function (res) {
      wx.hideLoading();
      that.setData({ exporting: false });

      if (res.code === 0 && res.data) {
        var content = res.data.content;
        var filename = res.data.filename;
        var wordCount = res.data.word_count;

        // 步骤 2：将文件内容写入临时文件
        var fs = wx.getFileSystemManager();
        var tempFilePath = wx.env.USER_DATA_PATH + '/' + filename;

        try {
          fs.writeFileSync(tempFilePath, content, 'utf-8');

          // 步骤 3：将文件内容复制到剪贴板，同时显示保存提示
          wx.setClipboardData({
            data: content,
            success: function () {
              wx.showModal({
                title: '导出成功',
                content: '文件 ' + filename + ' 已生成（共 ' + wordCount + ' 个单词）。\n\n文件内容已复制到剪贴板，您可以直接粘贴到其他应用中。\n\n文件保存路径：\n' + tempFilePath,
                confirmText: '知道了',
                showCancel: true,
                cancelText: '分享文件',
                success: function (modalRes) {
                  if (modalRes.cancel) {
                    // 用户点击"分享文件"，尝试打开分享面板
                    wx.shareFileMessage({
                      filePath: tempFilePath,
                      fileName: filename,
                      fail: function () {
                        wx.showToast({ title: '当前版本不支持分享文件', icon: 'none' });
                      },
                    });
                  }
                },
              });
            },
            fail: function () {
              // 剪贴板复制失败，提示用户手动复制
              wx.showModal({
                title: '导出成功',
                content: '文件 ' + filename + ' 已生成（共 ' + wordCount + ' 个单词）。\n\n文件保存路径：\n' + tempFilePath + '\n\n请手动复制以上路径中的文件内容。',
                confirmText: '知道了',
              });
            },
          });
        } catch (writeErr) {
          // 文件写入失败，降级为仅复制到剪贴板
          console.error('[Export] 写入文件失败:', writeErr);
          wx.setClipboardData({
            data: content,
            success: function () {
              wx.showModal({
                title: '导出成功',
                content: '文件内容已生成（共 ' + wordCount + ' 个单词），已复制到剪贴板。\n\n请粘贴到文本编辑器并保存为 .' + res.data.format + ' 文件。',
                confirmText: '知道了',
              });
            },
            fail: function () {
              wx.showToast({ title: '导出失败，请重试', icon: 'none' });
            },
          });
        }
      } else {
        wx.showToast({ title: res.message || '导出失败', icon: 'none' });
      }
    }).catch(function (err) {
      wx.hideLoading();
      that.setData({ exporting: false });
      wx.showToast({ title: err.message || '导出失败', icon: 'none' });
    });
  },
});