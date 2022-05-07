// pages/certificate/index.js
import * as logger from '../../utils/log';

const app = getApp();

Page({

  data: {
    certificate: {}
  },

  onLoad(options) {
    app.watchUserLogin(this.loadCertificate);
  },

  onReady() { },

  onShow() {
    this.getTabBar().init();
  },

  onPullDownRefresh() {
    this.loadCertificate();
  },

  onShareAppMessage() {
    return {
      title: '出行证'
    }
  },

  loadCertificate() {
    const loginUser = app.globalData.loginUser;
    const certificate = loginUser?.certificate;
    if (!certificate || !certificate.id) {
      logger.info(`No valid certificate found for currentUser: ${JSON.stringify(loginUser)}`);
      return;
    }

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'certificateService',
        method: 'findById',
        args: certificate.id
      }
    }).then((resp) => {
      this.setData({
        certificate: resp.result.data
      });
      wx.stopPullDownRefresh();
    });
  },

  onClickRegisterUser() {
    wx.switchTab({
      url: '/pages/profile/index',
    })
  },
})