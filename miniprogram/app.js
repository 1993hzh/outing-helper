// app.js
const { envList } = require('./envList.js');
import * as logger from './utils/log';
import BizError from './utils/bizError';

App({
  globalData: {
    hasUser: false,
    loginUser: {},
  },

  _loginUserWatchers: [],

  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: envList[0],
        traceUser: true,
      });

      this.observeLoginUser();
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
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      const user = resp.result.data;
      if (!user) {
        throw new Error(`User login failed with no db data.`);
      }
      logger.info(`Login succeed, user: ${JSON.stringify(user)}`);
      this.globalData.loginUser = user;
      this.globalData.hasUser = true;
      return user;
    }).catch((err) => {
      logger.error(`User login failed.`, err);
    });
  },

  watchUserLogin: function (callback) {
    this._loginUserWatchers.push(callback);
  },

  observeLoginUser: function () {
    const app = this;
    Object.defineProperty(app.globalData, "loginUser", {
      configurable: true,
      enumerable: true,
      set(value) {
        if (value === this._user) {
          return;
        }

        this._user = value;
        logger.info(`Notify watchers: ${app._loginUserWatchers}`);
        app._loginUserWatchers.forEach(call => call(value));
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
