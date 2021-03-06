// pages/certificate/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';
import BizError from '../../utils/bizError';
import functionTemplate from '../../utils/functionTemplate';

const app = getApp();

Page({

  data: {
    currentUser: {},
    certificate: {},
  },

  onLoad(options) {
    app.watchUserLogin((user) => {
      Toast.clear();
      this.data.currentUser = user;
      this.loadCertificate();
    });
    
    if (!app.globalData.hasUser) {// user not login
      Toast.loading({ message: '正在登录', forbidClick: true, });
    } else {
      this.data.currentUser = app.globalData.loginUser;
      this.loadCertificate();
    }
  },

  onReady() { },

  onShow() {
    this.getTabBar().onPageShow();
  },

  onPullDownRefresh() {
    this.loadCertificate();
  },

  onShareAppMessage() {
    return {
      title: '出入证'
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

    functionTemplate.send({
      message: '加载出入证...',
      errorMessage: '加载失败',
      request: {
        service: 'certificateService',
        method: 'findById',
        args: certificate._id
      },
      action: (result) => {
        const cert = result.data;
        loginUser.certificate.outing_count = cert.outing_count;
        this.setData({
          currentUser: loginUser,
          certificate: cert
        });
        wx.stopPullDownRefresh();
      },
    });
  },

  onClickRegisterUser() {
    wx.switchTab({
      url: '/pages/profile/index',
    })
  },
})