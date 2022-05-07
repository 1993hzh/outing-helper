// app.js
const { envList } = require('./envList.js');
import * as logger from './utils/log';

App({
  globalData: {
    loginUser: {}
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: envList[0],
        traceUser: true,
      });

      this.userLogin();
    }
  },

  userLogin() {
    return wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'userService',
        method: 'login',
      }
    }).then((resp) => {
      const user = resp.result?.data;
      if (!user) {
        throw new Error(`User login failed with no db data.`);
      }

      logger.info(`User: ${JSON.stringify(user)} login succeed.`);
      this.globalData.loginUser = user;
      return user;
    }).catch((err) => {
      logger.error(`User login failed.`, err);
    });
  },

  watchUserLogin: function (callback) {
    const globalData = this.globalData;
    Object.defineProperty(globalData, "loginUser", {
      configurable: true,
      enumerable: true,
      set(value) {
        this._user = value;
        callback(value);
      },
      get() {
        return this._user
      }
    })
  },

  onShow: function () {
  },

  onHide: function () {
  },
});
