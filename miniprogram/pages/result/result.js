/**
 * 识别结果页
 * 接收图片路径 → OCR 识别英文单词 → 本地词典查词 → 展示单词列表
 *
 * OCR 使用 OCR.space 免费 API，识别失败时自动降级为演示模式。
 * 首次使用需在微信小程序管理后台添加 request 合法域名：
 *   https://api.ocr.space
 * 或在开发工具中勾选「不校验合法域名」。
 */
var api = require('../../utils/api');

Page({
  data: {
    // 页面状态: loading / ready / error / demo
    status: 'loading',
    // 错误消息
    errorMsg: '',
    // 提示信息（演示模式说明等）
    noticeMsg: '',
    // 单词列表 [{word, meaning, checked}]
    wordList: [],
    // 已选数量
    checkedCount: 0,
    // 是否全选
    allChecked: false,
    // 原始图片路径
    imagePath: '',
    // 是否为演示模式
    demoMode: false,
    // OCR API 返回的提示信息
    ocrHint: '',
  },

  onLoad(options) {
    if (options.imagePath) {
      var imagePath = decodeURIComponent(options.imagePath);
      this.setData({ imagePath: imagePath });
      this._startOcr(imagePath);
    } else {
      this.setData({
        status: 'error',
        errorMsg: '未获取到图片路径',
      });
    }
  },

  /**
   * 调用 API 进行 OCR 识别 + 词典查词
   *
   * 流程：
   *   1. 调用 api.recognizeImage（真实 OCR 或降级演示模式）
   *   2. 如为演示模式，提示用户配置域名白名单后可使用真实 OCR
   *   3. 调用本地词典批量查词
   *   4. 构建前端展示列表
   *
   * @param {string} imagePath - 图片临时路径
   */
  _startOcr: function (imagePath) {
    var that = this;
    wx.showLoading({ title: '识别中...', mask: true });

    // 步骤 1：OCR 识别
    api.recognizeImage(imagePath).then(function (ocrRes) {
      // 如果识别失败或返回错误
      if (ocrRes.code !== 0 || !ocrRes.data) {
        wx.hideLoading();
        that.setData({
          status: 'error',
          errorMsg: ocrRes.message || 'OCR 识别失败，请重试',
        });
        return;
      }

      var words = ocrRes.data.words || [];
      var isDemo = ocrRes.data.demo_mode === true;
      var hint = ocrRes.data.hint || '';

      // 演示模式说明
      if (isDemo) {
        // 提示用户如何启用真实 OCR
        that.setData({
          ocrHint: hint,
          noticeMsg: '当前为演示模式。使用真实 OCR 需在微信小程序管理后台「开发 → 开发管理 → 开发设置 → 服务器域名」中添加 request 合法域名：https://api.ocr.space',
          status: 'demo',
        });
      }

      // 如果真实 OCR 没识别到单词，也不填充演示数据
      // 让用户知道图片中没识别到英文单词
      if (words.length === 0 && !isDemo) {
        wx.hideLoading();
        that.setData({
          status: 'error',
          errorMsg: '未识别到英文单词，请确保图片中包含清晰的英文文字',
        });
        return;
      }

      // 演示模式下如果也没有识别到单词，使用演示数据
      if (words.length === 0 && isDemo) {
        words = [
          'algorithm',
          'artificial',
          'database',
          'machine',
          'neural',
          'feedback',
          'optimization',
          'framework',
          'deploy',
          'pipeline',
        ];
      }

      // 步骤 2：调用本地词典查词（批量查询释义）
      api.dictLookup(words).then(function (dictRes) {
        wx.hideLoading();

        var meanings = {};
        if (dictRes.code === 0 && dictRes.data) {
          meanings = dictRes.data.meanings || {};
        }

        // 构建前端展示列表，每个单词附带释义和选中状态
        var wordList = [];
        for (var i = 0; i < words.length; i++) {
          var wl = String(words[i]).trim().toLowerCase();
          wordList.push({
            word: wl,
            meaning: meanings[wl] || '',
            checked: true,
          });
        }

        that.setData({
          status: 'ready',
          wordList: wordList,
          allChecked: true,
          checkedCount: wordList.length,
          demoMode: isDemo,
        });
      }).catch(function (dictErr) {
        wx.hideLoading();
        console.warn('[Result] 词典查词失败，使用空释义:', dictErr);

        // 即使词典查词失败，也展示单词列表（释义为空）
        var wordList = [];
        for (var i = 0; i < words.length; i++) {
          var wl = String(words[i]).trim().toLowerCase();
          wordList.push({
            word: wl,
            meaning: '',
            checked: true,
          });
        }

        that.setData({
          status: 'ready',
          wordList: wordList,
          allChecked: true,
          checkedCount: wordList.length,
          demoMode: isDemo,
        });
      });
    }).catch(function (err) {
      wx.hideLoading();
      that.setData({
        status: 'error',
        errorMsg: err.message || '识别失败，请重试',
      });
    });
  },

  /**
   * 切换单个词条的选中状态
   */
  onToggleItem: function (e) {
    var index = e.currentTarget.dataset.index;
    var key = 'wordList[' + index + '].checked';
    var newVal = !this.data.wordList[index].checked;
    this.setData({ [key]: newVal });
    this._updateAllChecked();
  },

  /**
   * 全选/取消全选
   */
  onToggleAll: function () {
    var newChecked = !this.data.allChecked;
    var wordList = this.data.wordList.map(function (item) {
      return {
        word: item.word,
        meaning: item.meaning,
        checked: newChecked,
      };
    });
    var checkedCount = newChecked ? wordList.length : 0;
    this.setData({ wordList: wordList, allChecked: newChecked, checkedCount: checkedCount });
  },

  /**
   * 更新全选状态
   */
  _updateAllChecked: function () {
    var wordList = this.data.wordList;
    var allChecked = wordList.length > 0 && wordList.every(function (item) {
      return item.checked;
    });
    var checkedCount = wordList.filter(function (item) {
      return item.checked;
    }).length;
    this.setData({ allChecked: allChecked, checkedCount: checkedCount });
  },

  /**
   * 编辑单词
   */
  onEditWord: function (e) {
    var index = e.currentTarget.dataset.index;
    var item = this.data.wordList[index];
    var that = this;

    wx.showModal({
      title: '编辑单词',
      editable: true,
      content: item.word,
      placeholderText: '输入单词',
      success: function (res) {
        if (res.confirm && res.content.trim()) {
          that.setData({ ['wordList[' + index + '].word']: res.content.trim() });
        }
      },
    });
  },

  /**
   * 编辑释义
   */
  onEditMeaning: function (e) {
    var index = e.currentTarget.dataset.index;
    var item = this.data.wordList[index];
    var that = this;

    wx.showModal({
      title: '编辑释义',
      editable: true,
      content: item.meaning,
      placeholderText: '输入中文释义',
      success: function (res) {
        if (res.confirm) {
          that.setData({ ['wordList[' + index + '].meaning']: res.content.trim() });
        }
      },
    });
  },

  /**
   * 删除单词
   */
  onDeleteWord: function (e) {
    var index = e.currentTarget.dataset.index;
    var that = this;

    wx.showModal({
      title: '确认删除',
      content: '确定删除"' + this.data.wordList[index].word + '"？',
      success: function (res) {
        if (res.confirm) {
          var wordList = that.data.wordList.filter(function (_, i) {
            return i !== index;
          });
          that.setData({ wordList: wordList }, function () {
            that._updateAllChecked();
            if (wordList.length === 0) {
              that.setData({
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
   * 重新识别（返回上一页重选图片）
   */
  onRetry: function () {
    wx.navigateBack();
  },

  /**
   * 跳转到导出页
   */
  onGoExport: function () {
    var selectedWords = this.data.wordList.filter(function (item) {
      return item.checked;
    });
    if (selectedWords.length === 0) {
      wx.showToast({ title: '请至少选择一个单词', icon: 'none' });
      return;
    }

    var app = getApp();
    app.globalData.ocrResult = selectedWords.map(function (item) {
      return {
        word: item.word,
        meaning: item.meaning,
      };
    });

    wx.navigateTo({ url: '/pages/export/export' });
  },
});