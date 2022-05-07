// pages/profile/profile.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';

const app = getApp();
const PHONE_REGEX = /^1[3-9]\d{9}$/;

Page({

  data: {
    user: {},
    nameInputError: false,
    contactInputError: false,
    buildingInputError: false,
    roomInputError: false,
    residenceInputs: {
      currentBuilding: {},
      currentResidence: {},
      buildingErrorMsg: '',
      showResidencePopup: false,
      buildingInput: {
        showBuildingPicker: false,
        loadBuildings: true,
        buildings: [],
      },
      roomInput: {
        showResidencePicker: false,
        loadResidences: true,
        residences: [],
      }
    }
  },

  onLoad(options) {

  },

  onReady() { },

  onShow() {
    this.getTabBar().init();
  },

  onPullDownRefresh() {

  },

  onShareAppMessage() {
    return {
      title: '出行信息'
    }
  },

  onClickBuildingInput() {
    if (this.data.buildings?.length > 0) {
      this.setData({
        'residenceInputs.showResidencePopup': true,
        'residenceInputs.buildingInput.showBuildingPicker': true,
        'residenceInputs.buildingInput.loadBuildings': false,
      });
      return;
    }

    this.setData({
      'residenceInputs.showResidencePopup': true,
      'residenceInputs.buildingInput.showBuildingPicker': true,
      'residenceInputs.buildingInput.loadBuildings': true,
    });
    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'buildingService',
        method: 'list'
      }
    }).then((resp) => {
      this.setData({
        'residenceInputs.buildingInput.buildings': resp.result,
        'residenceInputs.buildingInput.loadBuildings': false,
      });
    }).catch((err) => {
      logger.error('Load buildings failed.', err)
      Toast.fail({ message: '加载出错，请联系管理员', zIndex: 999999 });
    });
  },

  onClickRoomInput() {
    const currentBuilding = this.data.residenceInputs.currentBuilding;
    if (!currentBuilding?.id) {
      this.setData({
        'residenceInputs.buildingErrorMsg': '请先选择楼栋号',
      });
      return;
    }

    this.setData({
      'residenceInputs.showResidencePopup': true,
      'residenceInputs.roomInput.showResidencePicker': true,
      'residenceInputs.roomInput.loadResidences': true,
    });
    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'residenceService',
        method: 'listByBuilding',
        args: currentBuilding
      }
    }).then((resp) => {
      this.setData({
        'residenceInputs.roomInput.loadResidences': false,
        'residenceInputs.roomInput.residences': resp.result.data,
      });
    }).catch((err) => {
      logger.error('Load buildings failed.', err)
      Toast.fail({ message: '加载出错，请联系管理员', zIndex: 999999 });
    });
  },

  onClosePopup() {
    this.setData({
      'residenceInputs.showResidencePopup': false,
      'residenceInputs.buildingInput.showBuildingPicker': false,
      'residenceInputs.roomInput.showResidencePicker': false,
    });
  },

  onBuildingPickerConfirm(event) {
    const picker = event.detail;
    this.setData({
      'residenceInputs.buildingErrorMsg': '',
      'residenceInputs.currentBuilding': picker.value,
    });
    this.onClosePopup();
  },

  onResidencePickerConfirm(event) {
    const picker = event.detail;
    this.setData({ 
      'residenceInputs.currentResidence': picker.value 
    });
    this.onClosePopup();
  },

  onSubmitProfile(event) {
    const formValues = event.detail.value;
    const nameInputError = !formValues.userName?.trim();
    const contactInputError = !PHONE_REGEX.test(formValues.contactNumber);
    const residenceInputError = !this.data.residenceInputs.currentResidence?._id;
    if (nameInputError || contactInputError || residenceInputError) {
      this.setData({
        nameInputError: nameInputError,
        contactInputError: contactInputError,
        residenceInputError: residenceInputError,
      });
      return;
    }

    const loginUser = app.globalData.loginUser;
  },
})