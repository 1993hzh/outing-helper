// app.js
const { envList } = require('./envList.js');

App({
  globalData: {
    loginUser: {

    }
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: envList[0],
        traceUser: true,
      });

      this.doLogin();
    }
  },

  doLogin: function () {
    //TODO     this.getTabBar().updateCheckRecord();
  },

  onShow: function () {
  },

  onHide: function () {
  }
});
