// pages/record/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';
import BizError from '../../utils/bizError';
import functionTemplate from '../../utils/functionTemplate';

const app = getApp();

Page({

  data: {
    checkRecords: [],
    isRefreshing: false
  },

  onLoad(options) {
    app.watchUserLogin((user) => {
      Toast.clear();
      this.loadData();
    });
    
    if (app.globalData.hasUser) {
      this.loadData();
    } else {// user not login
      Toast.loading({ message: '正在加载', forbidClick: true, });
    }
  },

  onShow() {
    this.getTabBar().onPageShow();
  },

  onShareAppMessage() {
    return {
      title: '出入记录'
    }
  },

  onScrollRefresh() {
    this.loadData()
  },

  loadData() {
    const certId = app.globalData.loginUser?.certificate?._id;
    if (!certId) {
      return;
    }

    functionTemplate.send({
      message: '正在加载...',
      errorMessage: '加载失败，请联系管理员',
      request: {
        service: 'checkRecordService',
        method: 'findByCertificate',
        args: certId
      },
      action: async (result) => {
        const checkRecords = result.data;
        this.setData({
          checkRecords: this.processCheckRecord(checkRecords),
          isRefreshing: false
        });
      },
    });
  },

  processCheckRecord(records) {
    records.forEach(e => {
      if (!e.displayDateTime) {
        e.displayDateTime = new Date(e.created_at).toLocaleString('zh-CN');
      }
    });
    return records;
  }
})