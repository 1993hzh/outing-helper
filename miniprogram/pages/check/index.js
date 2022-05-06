// pages/check/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';

const app = getApp();

Page({

  data: {
    showCheckPopup: false,
    certificate: undefined,
    checkRecords: []
  },

  onLoad(options) {
    // const certId = options.id;
    const certId = 'wxpkz9dCoabo3V81tC8UA';
    if (certId) {
      this.loadData(certId);
    }
  },

  onReady() { },

  onShow() {
    this.getTabBar().init();
  },

  onShareAppMessage() {

  },

  onClickScan() {
    wx.scanCode()
      .then((resp) => {
        logger.info(resp);
        return wx.navigateTo({ url: resp.result })
      })
      .catch((err) => {
        logger.error(err);
        Toast.fail('二维码扫描出错，请重试。');
      });
  },

  onClickCheckIn(event) {
    Toast.loading({ message: '检入中，请稍后...', forbidClick: true, });

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'certificateService',
        method: 'checkIn',
        args: this.data.certificate
      }
    }).then((resp) => {
      const result = resp.result.data;
      const checkRecords = this.data.checkRecords;
      checkRecords.push(result.checkRecord);
      this.setData({
        certificate: result.certificate,
        checkRecords: this.processCheckRecord(checkRecords)
      });

      Toast.clear();
    }).catch((err) => {
      logger.error(JSON.stringify(err));
      Toast.fail('检入发生错误，请联系管理员');
    });
  },

  onClickCheckOut(event) {
    Toast.loading({ message: '检出中，请稍后...', forbidClick: true, });

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'certificateService',
        method: 'checkOut',
        args: this.data.certificate
      }
    }).then((resp) => {
      const result = resp.result.data;
      const checkRecords = this.data.checkRecords;
      checkRecords.push(result.checkRecord);
      this.setData({
        certificate: result.certificate,
        checkRecords: this.processCheckRecord(checkRecords)
      });

      Toast.clear();
    }).catch((err) => {
      logger.error(JSON.stringify(err));
      Toast.fail('检出发生错误，请联系管理员');
    });
  },

  onClosePopup() {
    this.setData({
      showCheckPopup: false,
      certificate: undefined,
      checkRecords: []
    });
  },

  loadData(certId) {
    Toast.loading({ message: '正在加载...', forbidClick: true, });

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'certificateService',
        method: 'findById',
        args: certId
      }
    }).then((resp) => {
      let data = resp.result;
      logger.info(`Find certificate by id: ${certId} returned: ${JSON.stringify(data)}`);
      this.setData({
        certificate: data
      });
    }).then((resp) => {
      return wx.cloud.callFunction({
        name: 'outingFunctions',
        data: {
          service: 'checkRecordService',
          method: 'findByCertificate',
          args: certId
        }
      });
    }).then((resp) => {
      let data = resp.result.data;
      logger.info(`Find checkRecord by certId: ${certId} returned: ${JSON.stringify(data)}`);
      this.setData({
        checkRecords: this.processCheckRecord(data),
        showCheckPopup: true
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