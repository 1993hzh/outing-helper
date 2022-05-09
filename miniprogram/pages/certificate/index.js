// pages/certificate/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';

const app = getApp();

Page({

  data: {
    currentUser: {},
    certificate: {},
  },

  onLoad(options) {
    if (!app.globalData.hasUser) {// user not login
      Toast.loading({ message: '正在登录', forbidClick: true, });
      app.watchUserLogin((user) => {
        Toast.clear();
        this.data.currentUser = user;
        this.loadCertificate();
      });
    } else {
      this.data.currentUser = app.globalData.loginUser;
      this.loadCertificate();
    }
  },

  onReady() { },

  onShow() {
    this.getTabBar().dynamicResetWhenShow();
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
    if (!certificate?._id) {
      logger.info(`No valid certificate found for currentUser: ${JSON.stringify(loginUser)}`);
      this.setData({ currentUser: loginUser });
      wx.stopPullDownRefresh();
      return;
    }

    Toast.loading({ message: '加载出行证...', forbidClick: true, });

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'certificateService',
        method: 'findById',
        args: certificate._id
      }
    }).then((resp) => {
      const cert = resp.result.data;
      loginUser.certificate.outing_count = cert.outing_count;

      this.setData({
        currentUser: loginUser,
        certificate: cert
      });
      this.getTabBar().dynamicResetWhenShow();

      Toast.clear();
      wx.stopPullDownRefresh();
    }).catch((err) => {
      Toast.fail({ message: '加载失败', forbidClick: true, });
      logger.error(`Load certificate: ${certificate._id} failed.`, err);
    });
  },

  onClickRegisterUser() {
    wx.switchTab({
      url: '/pages/profile/index',
    })
  },
})