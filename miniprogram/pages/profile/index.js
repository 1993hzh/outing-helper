// pages/profile/profile.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';
import BizError from '../../utils/bizError';

const app = getApp();
const PHONE_REGEX = /^1[3-9]\d{9}$/;

Page({

  data: {
    user: {
      status: 0,
      pending: {
        status: 0,
        comment: '',
        data: {},
      }
    },
    switcher: {
      show: false,
      checked: false,
    },
    editable: true,
    buildingInput: {
      error: false,
      current: {},
      showPicker: false,
      loading: true,
      values: [],
    },
    roomInput: {
      error: false,
      current: {},
      showPicker: false,
      loading: true,
      values: [],
    },
    nameInput: {
      error: false,
      current: '',
      show: false,
    },
    contactInput: {
      error: false,
      current: '',
      show: false,
    },
    wxProfileInput: {
      error: false,
      nickName: '',
      avatarUrl: '',
    },
  },

  onLoad(options) {
    if (!app.globalData.hasUser) {// user not login
      Toast.loading({ message: '正在登录', forbidClick: true, });
    } else {
      this.init({ user: app.globalData.loginUser });
    }

    app.watchUserLogin((user) => {
      Toast.clear();
      this.init({ user: user });
    });
  },

  onReady() { },

  onShow() {
    this.getTabBar().onPageShow();
  },

  onPullDownRefresh() {
    app.userLogin()
      .then((result) => {
        wx.stopPullDownRefresh();
      })
      .catch((err) => {
        wx.stopPullDownRefresh();
        Toast.fail({ message: '刷新失败，请联系管理员', zIndex: 999999, });
        logger.error(`User login failed.`, err);
      });
  },

  init({ user: user }) {
    if (!user) {
      user = app.globalData.loginUser;
    }

    if (user?.status === 0) {
      return;
    }

    this.setData({
      switcher: {
        show: user?.status === 10,
        checked: false,
      },
      editable: false,
      user: {
        status: user?.status,
        pending: user?.pending,
      },
      'buildingInput.current': user?.residence?.building || {},
      'roomInput.current': user?.residence || {},
      'nameInput.current': user?.name || {},
      'nameInput.show': true,
      'contactInput.current': user?.contact_number || '',
      'contactInput.show': true,
      'wxProfileInput.nickName': user?.wx_nick_name || '',
      'wxProfileInput.avatarUrl': user?.wx_avatar_url || '',
    });
  },

  onClickSwitch({ detail }) {
    const user = app.globalData.loginUser;
    const data = detail ? user?.pending.data : user;
    this.setData({
      'switcher.checked': detail,
      editable: false,
      'buildingInput.current': data?.residence?.building || {},
      'roomInput.current': data?.residence || {},
      'nameInput.current': data?.name || '',
      'nameInput.show': true,
      'contactInput.current': data?.contact_number || '',
      'contactInput.show': true,
      'wxProfileInput.nickName': data?.wx_nick_name || '',
      'wxProfileInput.avatarUrl': data?.wx_avatar_url || '',
    });
  },

  onClickBuildingInput() {
    if (this.data.buildings?.length > 0) {
      this.setData({
        'buildingInput.showPicker': true,
        'buildingInput.loading': false,
      });
      return;
    }

    this.setData({
      'buildingInput.showPicker': true,
      'buildingInput.loading': true,
    });
    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'buildingService',
        method: 'list'
      }
    }).then((resp) => {
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      this.setData({
        'buildingInput.loading': false,
        'buildingInput.values': result.data,
      });
    }).catch((err) => {
      this.setData({ 'buildingInput.loading': false });
      if (err instanceof BizError) {
        Toast.fail({ message: err.message, zIndex: 999999, });
      } else {
        Toast.fail({ message: '加载失败，请联系管理员', zIndex: 999999, });
      }
      logger.error('Load buildings failed.', err)
    });
  },

  onClickRoomInput() {
    const currentBuilding = this.data.buildingInput.current;
    if (!currentBuilding?.id) {
      this.setData({
        'buildingInput.error': true,
      });
      return;
    }

    this.setData({
      'roomInput.showPicker': true,
      'roomInput.loading': true,
    });
    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'residenceService',
        method: 'listByBuilding',
        args: currentBuilding
      }
    }).then((resp) => {
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      this.setData({
        'roomInput.loading': false,
        'roomInput.values': result.data,
      });
    }).catch((err) => {
      this.setData({ 'roomInput.loading': false });
      if (err instanceof BizError) {
        Toast.fail({ message: err.message, zIndex: 999999, });
      } else {
        Toast.fail({ message: '加载失败，请联系管理员', zIndex: 999999, });
      }
      logger.error('Load residences failed.', err)
    });
  },

  onClosePopup() {
    this.setData({
      'buildingInput.showPicker': false,
      'roomInput.showPicker': false,
    });
  },

  onBuildingPickerConfirm(event) {
    const value = event.detail?.value;
    if (value && value.id) {
      this.setData({
        'buildingInput.error': false,
        'buildingInput.current': value,
        'roomInput.current': {},
      });
    }
    this.onClosePopup();
  },

  onRoomPickerConfirm(event) {
    const value = event.detail?.value;
    if (value && value._id) {
      this.setData({
        'roomInput.error': false,
        'roomInput.current': value,
        'nameInput.show': true,
        'contactInput.show': true,
      });
    }
    this.onClosePopup();
  },

  onClickGetUserProfile(e) {
    wx.getUserProfile({
      desc: '用于完善出入信息以方便后续审核',
    }).then((resp) => {
      const userInfo = resp.userInfo;
      this.setData({
        'wxProfileInput.nickName': userInfo.nickName,
        'wxProfileInput.avatarUrl': userInfo.avatarUrl,
        'wxProfileInput.error': false,
      });
    }).catch((err) => {
      this.setData({ 'wxProfileInput.error': true, });
      logger.error(err);
    })
  },

  onResetProfile(event) {
    this.setData({ editable: true });
  },

  onSubmitProfile(event) {
    const formValues = event.detail.value;
    const buildingInputError = !formValues.building?.trim();
    const roomInputError = !formValues.room?.trim();
    const nameInputError = !formValues.userName?.trim();
    const contactInputError = !PHONE_REGEX.test(formValues.contactNumber);
    const wxProfileError = !formValues.nickName?.trim();
    this.setData({
      'buildingInput.error': buildingInputError,
      'roomInput.error': roomInputError,
      'nameInput.error': nameInputError,
      'contactInput.error': contactInputError,
      'wxProfileInput.error': wxProfileError,
    });

    if (nameInputError || contactInputError || buildingInputError || roomInputError || wxProfileError) {
      return;
    }

    const residence = this.data.roomInput.current;
    const wxProfile = this.data.wxProfileInput;
    const user = app.globalData.loginUser;
    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'userService',
        method: 'updateProfile',
        args: {
          wx_nick_name: wxProfile.nickName,
          wx_avatar_url: wxProfile.avatarUrl,
          name: formValues.userName,
          contact_number: formValues.contactNumber,
          residence: residence,
        },
      }
    }).then((resp) => {
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      app.globalData.loginUser = result.data;//TODO
      logger.info(`updateProfile returned: ${JSON.stringify(resp)}`);
    }).catch((err) => {
      if (err instanceof BizError) {
        Toast.fail({ message: err.message, });
      } else {
        Toast.fail('更新出错，请联系管理员');
      }
      logger.error(`updateProfile for user: ${JSON.stringify(user)} failed.`, err);
    });
  },
})