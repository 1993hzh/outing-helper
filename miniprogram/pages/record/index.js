// pages/record/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';
import BizError from '../../utils/bizError';

const app = getApp();

Page({

  data: {
    checkRecords: [],
    isRefreshing: false
  },

  onLoad(options) {
    if (app.globalData.hasUser) {
      this.loadData();
    } else {// user not login
      Toast.loading({ message: '正在加载', forbidClick: true, });
      app.watchUserLogin((user) => {
        Toast.clear();
        this.loadData();
      });
    }
  },

  onShow() {
    this.getTabBar().dynamicResetWhenShow();
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

    Toast.loading({ message: '加载中...', forbidClick: true, });
    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'checkRecordService',
        method: 'findByCertificate',
        args: certId
      }
    }).then((resp) => {
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      let data = result.data;
      logger.info(`Find checkRecord by certId: ${certId} returned: ${JSON.stringify(data)}`);
      this.setData({
        checkRecords: this.processCheckRecord(data),
        isRefreshing: false
      });

      Toast.clear();
    }).catch((err) => {
      if (err instanceof BizError) {
        Toast.fail({ message: err.message, });
      } else {
        Toast.fail('加载出错，请联系管理员');
      }
      logger.error(`check load by id: ${certId} failed.`, err);
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