// pages/check/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';
import BizError from '../../utils/bizError';

const app = getApp();
const queryString = require('query-string');

Page({

  data: {
    showCheckPopup: false,
    certificate: undefined,
    checkRecords: [],
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

  onShow() {
    this.getTabBar().dynamicResetWhenShow();
  },

  onShareAppMessage() {
    return {
      title: '出行检查'
    }
  },

  // from external
  onScanQRcode(options) {
    const user = app.globalData.loginUser;
    if (!user.role?.checker) {
      // no permission, go to home
      wx.switchTab({
        url: '/pages/certificate/index',
      });
      return;
    }

    if (options?.scene) {
      this.loadData(options?.scene);
    }
  },

  // from internal
  onClickScan() {
    wx.scanCode()
      .then((resp) => {
        const path = resp?.path;
        const result = queryString.parseUrl(path);
        const certId = result?.query?.scene;
        logger.info(`Internal scan result: ${JSON.stringify(result)}`);

        if (result?.url === 'pages/check/index') {
          return this.loadData(certId)
        } else {
          Toast.fail({ message: '二维码不正确。', zIndex: 999999, });
        }
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
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      const data = result.data;
      const processedCheckRecord = this.processCheckRecord(data.checkRecord);
      this.data.checkRecords.push(processedCheckRecord);
      this.setData({
        certificate: data.certificate,
        checkRecords: this.data.checkRecords
      });

      Toast.clear();
    }).catch((err) => {
      if (err instanceof BizError) {
        Toast.fail({ message: err.errorMessage, zIndex: 999999, });
      } else {
        Toast.fail({ message: '检入发生错误，请联系管理员', zIndex: 999999, });
      }
      logger.error(`checkIn: ${this.data.certificate._id} failed.`, err);
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
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      const data = result.data;
      const processedCheckRecord = this.processCheckRecord(data.checkRecord);
      this.data.checkRecords.push(processedCheckRecord);
      this.setData({
        certificate: data.certificate,
        checkRecords: this.data.checkRecords
      });

      Toast.clear();
    }).catch((err) => {
      if (err instanceof BizError) {
        Toast.fail({ message: err.errorMessage, zIndex: 999999, });
      } else {
        Toast.fail({ message: '检出发生错误，请联系管理员', zIndex: 999999, });
      }
      logger.error(`checkOut: ${this.data.certificate._id} failed.}`, err);
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
    if (!certId) {
      Toast.fail({ message: '二维码不正确。', zIndex: 999999, });
    } else {
      Toast.loading({ message: '正在加载...', forbidClick: true, zIndex: 999999, });
    }

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'certificateService',
        method: 'findById',
        args: certId
      }
    }).then((resp) => {
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      let data = result.data;
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
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      const data = result.data;
      const displayData = data.map(e => this.processCheckRecord(e));
      logger.info(`Find checkRecord by certId: ${certId} returned: ${JSON.stringify(data)}`);
      this.setData({
        checkRecords: displayData,
        showCheckPopup: true
      });

      Toast.clear();
    }).catch((err) => {
      if (err instanceof BizError) {
        Toast.fail({ message: err.errorMessage, zIndex: 999999, });
      } else {
        Toast.fail({ message: '加载失败，请联系管理员', zIndex: 999999, });
      }
      logger.error(`Check cert by id: ${certId} failed.`, err);
    });
  },

  processCheckRecord(record) {
    if (record && !record.displayDateTime) {
      record.displayDateTime = new Date(record.created_at).toLocaleString('zh-CN');
    }
    return record;
  }
})