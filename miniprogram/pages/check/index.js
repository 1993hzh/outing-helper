// pages/check/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';
import BizError from '../../utils/bizError';
import functionTemplate from '../../utils/functionTemplate';

const app = getApp();
const queryString = require('query-string');

Page({

  data: {
    showCheckPopup: false,
    certificate_id: '',
    checkRecord: {},
  },

  onLoad(options) {
    app.watchUserLogin((user) => {
      Toast.clear();
      this.onScanQRcode(options);
    });
    
    if (!app.globalData.hasUser) {// user not login
      Toast.loading({ message: '正在登录', forbidClick: true, });
    } else {
      this.onScanQRcode(options);
    }
  },

  onReady() { },

  onShow() {
    this.getTabBar().onPageShow();
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
        if (err.errMsg === "scanCode:fail cancel") {
          return;
        }

        logger.error(err);
        Toast.fail({ message: '二维码扫描出错，请重试。', zIndex: 999999, });
      });
  },

  onClickCheckIn(event) {
    functionTemplate.send({
      message: '检入中，请稍后...',
      errorMessage: '检入发生错误，请联系管理员',
      request: {
        service: 'checkRecordService',
        method: 'checkIn',
        args: this.data.certificate_id
      },
      action: (result) => {
        const checkRecord = result.data;
        this.processCheckRecord(checkRecord);
        this.setData({
          checkRecord: checkRecord,
        });
      },
    });
  },

  onClickCheckOut(event) {
    functionTemplate.send({
      message: '检出中，请稍后...',
      errorMessage: '检出发生错误，请联系管理员',
      request: {
        service: 'checkRecordService',
        method: 'checkOut',
        args: this.data.certificate_id
      },
      action: (result) => {
        const checkRecord = result.data;
        this.processCheckRecord(checkRecord);
        this.setData({
          checkRecord: checkRecord,
        });
      },
    });
  },

  onClosePopup() {
    this.setData({
      showCheckPopup: false,
      certificate_id: '',
      checkRecord: {}
    });
  },

  loadData(certId) {
    if (!certId) {
      Toast.fail({ message: '二维码不正确。', zIndex: 999999, });
    }

    functionTemplate.send({
      message: '正在加载...',
      errorMessage: '加载失败，请联系管理员',
      request: {
        service: 'checkRecordService',
        method: 'findLastOutRecord',
        args: certId
      },
      action: async (result) => {
        const checkRecords = result.data;
        this.processCheckRecord(checkRecords[0]);
        this.setData({
          certificate_id: certId,
          checkRecord: checkRecords[0],
          showCheckPopup: true,
        });
      },
    });
  },

  processCheckRecord(record) {
    const outDateTime = record?.out?.checked_at;
    if (outDateTime) {
      record.out.checked_at = new Date(outDateTime).toLocaleString('zh-CN');
    }
    const inDateTime = record?.in?.checked_at;
    if (inDateTime) {
      record.in.checked_at = new Date(inDateTime).toLocaleString('zh-CN');
    }
  }
})