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
    if (!app.globalData.hasUser) {// user not login
      Toast.loading({ message: '正在加载', forbidClick: true, });
      app.watchUserLogin((user) => {
        Toast.clear();
        this.onScanQRcode(options);
      });
    } else {
      this.onScanQRcode(options);
    }
  },

  onReady() { },

  onShow() { },

  onShareAppMessage() {
    return {
      title: '出行检查'
    }
  },

  // from external
  onScanQRcode(options) {
    const user = app.globalData.loginUser;
    if (!user.role?.checker) {
      wx.switchTab({
        url: '/pages/certificate/index',
      });
    }
    if (!options?.scene) {
      logger.warn(`Cannot find scene from: ${JSON.stringify(options)}`);
      return;
    }

    const certId = options.scene;
    if (certId) {
      this.loadData(certId);
    } else {
      Toast.fail({ message: '二维码不正确。', zIndex: 999999, });
    }
  },

  // from internal
  onClickScan() {
    wx.scanCode()
      .then((resp) => {
        logger.info(`Scan qr code result: ${JSON.stringify(resp)}`);
        return wx.switchTab({ url: resp.path })
      })
      .catch((err) => {
        logger.error(err);
        Toast.fail({ message: '二维码扫描出错，请重试。', zIndex: 999999, });
      });
  },

  onClickCheckIn(event) {
    Toast.loading({ message: '检入中，请稍后...', forbidClick: true, zIndex: 999999, });

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'certificateService',
        method: 'checkIn',
        args: this.data.certificate
      }
    }).then((resp) => {
      const data = resp.result.data;
      const processedCheckRecord = this.processCheckRecord(data.checkRecord);
      this.data.checkRecords.push(processedCheckRecord);
      this.setData({
        certificate: data.certificate,
        checkRecords: this.data.checkRecords
      });

      Toast.clear();
    }).catch((err) => {
      logger.error(JSON.stringify(err));
      Toast.fail({ message: '检入发生错误，请联系管理员', zIndex: 999999, });
    });
  },

  onClickCheckOut(event) {
    Toast.loading({ message: '检出中，请稍后...', forbidClick: true, zIndex: 999999, });

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'certificateService',
        method: 'checkOut',
        args: this.data.certificate
      }
    }).then((resp) => {
      const data = resp.result.data;
      const processedCheckRecord = this.processCheckRecord(data.checkRecord);
      this.data.checkRecords.push(processedCheckRecord);
      this.setData({
        certificate: data.certificate,
        checkRecords: this.data.checkRecords
      });

      Toast.clear();
    }).catch((err) => {
      logger.error(JSON.stringify(err));
      Toast.fail({ message: '检出发生错误，请联系管理员', zIndex: 999999, });
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
    Toast.loading({ message: '正在加载...', forbidClick: true, zIndex: 999999, });

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'certificateService',
        method: 'findById',
        args: certId
      }
    }).then((resp) => {
      let data = resp.result.data;
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
      const data = resp.result.data;
      const displayData = data.map(e => this.processCheckRecord(e));
      logger.info(`Find checkRecord by certId: ${certId} returned: ${JSON.stringify(data)}`);
      this.setData({
        checkRecords: displayData,
        showCheckPopup: true
      });

      Toast.clear();
    }).catch((error) => {
      logger.error(`check load by id: ${certId} failed with: ${JSON.stringify(error)}`);
      Toast.fail({ message: '加载失败，请联系管理员', zIndex: 999999, });
    });
  },

  processCheckRecord(record) {
    if (record && !record.displayDateTime) {
      record.displayDateTime = new Date(record.created_at).toLocaleString('zh-CN');
    }
    return record;
  }
})