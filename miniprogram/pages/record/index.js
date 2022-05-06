// pages/record/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';

const app = getApp();

Page({

  data: {
    checkRecords: [],
    isRefreshing: false
  },

  onLoad(options) {
    this.loadData();
  },

  onShow() {
    this.getTabBar().init();
  },

  onShareAppMessage() {
    return {
      title: '出行记录'
    }
  },

  onScrollRefresh(){
    this.loadData()
  },

  loadData() {
    const certId = 'wxpkz9dCoabo3V81tC8UA';
    // const certId = app.globalData.loginUser?.certificate?._id;
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
      let data = resp.result.data;
      logger.info(`Find checkRecord by certId: ${certId} returned: ${JSON.stringify(data)}`);
      this.setData({
        checkRecords: this.processCheckRecord(data),
        isRefreshing: false
      });

      Toast.clear();
    }).catch((error) => {
      logger.error(`check load by id: ${certId} failed with: ${JSON.stringify(error)}`);
      Toast.fail('加载出错，请联系管理员');
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