/**
 * 识别结果页
 * 接收图片路径 → 上传云存储 → 调用 OCR 云函数 → 调用词典查词 → 展示单词列表
 */
const api = require('../../utils/api');

Page({
  data: {
    // 页面状态: loading / ready / error
    status: 'loading',
    // 错误消息
    errorMsg: '',
    // 单词列表 [{word, meaning, checked}]
    wordList: [],
    // 是否全选
    allChecked: false,
    // 原始图片路径
    imagePath: '',
  },

  onLoad(options) {
    if (options.imagePath) {
      const imagePath = decodeURIComponent(options.imagePath);
      this.setData({ imagePath });
      this._startOcr(imagePath);
    } else {
      this.setData({
        status: 'error',
        errorMsg: '未获取到图片路径',
      });
    }
  },

  /**
   * 调用云函数进行 OCR 识别 + 词典查词
   * 流程：上传图片 → OCR 云函数 → 词典查词云函数 → 展示结果
   * @param {string} imagePath - 图片临时路径
   */
  async _startOcr(imagePath) {
    wx.showLoading({ title: '识别中...', mask: true });

    try {
      // 步骤 1：OCR 识别
      const ocrRes = await api.recognizeImage(imagePath);
      
      if (ocrRes.code !== 0 || !ocrRes.data) {
        wx.hideLoading();
        this.setData({
          status: 'error',
          errorMsg: ocrRes.message || 'OCR 识别失败，请重试',
        });
        return;
      }

      const words = ocrRes.data.words || [];

      if (words.length === 0) {
        wx.hideLoading();
        // 如果是演示模式，给出提示
        if (ocrRes.data.demo_mode) {
          this.setData({
            status: 'error',
            errorMsg: '演示模式：OCR 功能需接入腾讯云 OCR API 后启用。\n请参考 cloudfunctions/ocr/index.js 中的方案 A。',
          });
        } else {
          this.setData({
            status: 'error',
            errorMsg: '未识别到任何英文单词，请尝试更清晰的图片',
          });
        }
        return;
      }

      // 步骤 2：词典查词（批量查询释义）
      let meanings = {};
      try {
        const dictRes = await api.dictLookup(words);
        if (dictRes.code === 0 && dictRes.data) {
          meanings = dictRes.data.meanings || {};
        }
      } catch (dictErr) {
        console.warn('[Result] 词典查词失败，使用空释义:', dictErr);
      }

      // 构建前端展示列表
      const wordList = words.map((w) => {
        const wl = w.trim().toLowerCase();
        return {
          word: wl,
          meaning: meanings[wl] || '',
          checked: true,
        };
      });

      wx.hideLoading();
      this.setData({
        status: 'ready',
        wordList,
        allChecked: true,
      });

    } catch (err) {
      wx.hideLoading();
      this.setData({
        status: 'error',
        errorMsg: err.message || '云函数调用失败，请检查云开发环境是否开通',
      });
    }
  },

  /**
   * 切换单个词条的选中状态
   */
  onToggleItem(e) {
    const index = e.currentTarget.dataset.index;
    const key = `wordList[${index}].checked`;
    const newVal = !this.data.wordList[index].checked;
    this.setData({ [key]: newVal });
    this._updateAllChecked();
  },

  /**
   * 全选/取消全选
   */
  onToggleAll() {
    const newChecked = !this.data.allChecked;
    const wordList = this.data.wordList.map((item) => ({
      ...item,
      checked: newChecked,
    }));
    this.setData({ wordList, allChecked: newChecked });
  },

  /**
   * 更新全选状态
   */
  _updateAllChecked() {
    const allChecked = this.data.wordList.every((item) => item.checked);
    this.setData({ allChecked });
  },

  /**
   * 编辑单词
   */
  onEditWord(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.wordList[index];

    wx.showModal({
      title: '编辑单词',
      editable: true,
      content: item.word,
      placeholderText: '输入单词',
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          this.setData({ [`wordList[${index}].word`]: res.content.trim() });
        }
      },
    });
  },

  /**
   * 编辑释义
   */
  onEditMeaning(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.wordList[index];

    wx.showModal({
      title: '编辑释义',
      editable: true,
      content: item.meaning,
      placeholderText: '输入中文释义',
      success: (res) => {
        if (res.confirm) {
          this.setData({ [`wordList[${index}].meaning`]: res.content.trim() });
        }
      },
    });
  },

  /**
   * 删除单词
   */
  onDeleteWord(e) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认删除',
      content: `确定删除"${this.data.wordList[index].word}"？`,
      success: (res) => {
        if (res.confirm) {
          const wordList = this.data.wordList.filter((_, i) => i !== index);
          this.setData({ wordList }, () => {
            this._updateAllChecked();
            if (wordList.length === 0) {
              this.setData({
                status: 'error',
                errorMsg: '单词列表已清空',
              });
            }
          });
        }
      },
    });
  },

  /**
   * 重新识别（重选图片）
   */
  onRetry() {
    wx.navigateBack();
  },

  /**
   * 跳转到导出页
   */
  onGoExport() {
    const selectedWords = this.data.wordList.filter((item) => item.checked);
    if (selectedWords.length === 0) {
      wx.showToast({ title: '请至少选择一个单词', icon: 'none' });
      return;
    }

    const app = getApp();
    app.globalData.ocrResult = selectedWords.map((item) => ({
      word: item.word,
      meaning: item.meaning,
    }));

    wx.navigateTo({ url: '/pages/export/export' });
  },
});