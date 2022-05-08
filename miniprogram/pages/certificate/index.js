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
      Toast.loading({ message: '正在加载', forbidClick: true, });

      app.watchUserLogin((user) => {
        Toast.clear();
        this.data.currentUser = user;
        this.loadCertificate();
      });
    } else {
      this.data.currentUser = app.globalData.loginUser;
    }
  },

  onReady() { },

  onShow() { },

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
      return;
    }

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'certificateService',
        method: 'findById',
        args: certificate._id
      }
    }).then((resp) => {
      this.setData({
        user: loginUser,
        certificate: resp.result.data,
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