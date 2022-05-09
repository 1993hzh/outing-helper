// pages/approval/index.js
import * as logger from '../../utils/log';
import Toast from '@vant/weapp/toast/toast';
import BizError from '../../utils/bizError';

const app = getApp();

Page({

  data: {
    showBuildingPopup: false,
    buildingInput: {
      currentBuilding: {},
      buildings: [],
      loadBuildings: false
    },
  },

  onLoad(options) {

  },

  onReady() { },

  onShow() { },

  onPullDownRefresh() { },

  onClosePopup() {
    this.setData({
      showBuildingPopup: false
    });
  },

  onClickBuildingInput() {
    if (this.data.buildingInput.buildings?.length > 0) {
      this.setData({
        showBuildingPopup: true,
      });
      return;
    }

    this.setData({
      showBuildingPopup: true,
      'buildingInput.loadBuildings': true,
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
        'buildingInput.buildings': resp.result.data,
        'buildingInput.loadBuildings': false,
      });
    }).catch((err) => {
      if (err instanceof BizError) {
        Toast.fail({ message: err.errorMessage, zIndex: 999999 });
      } else {
        Toast.fail({ message: '加载出错，请联系管理员', zIndex: 999999 });
      }
      logger.error('Load buildings failed.', err)
    });
  },

  onBuildingPickerConfirm(event) {
    const picker = event.detail;
    this.setData({
      'buildingInput.currentBuilding': picker.value,
    });
    this.onClosePopup();
  },

  onSubmitResidences(event) {
    const formValues = event.detail.value;
    const building = this.data.buildingInput.currentBuilding;

    wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        service: 'residenceService',
        method: 'batchCreate',
        args: {
          building: this.data.buildingInput.currentBuilding,
          rooms: formValues.roomList
        }
      }
    }).then((resp) => {
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      Toast.success('批量创建成功');
    }).catch((err) => {
      if (err instanceof BizError) {
        Toast.fail({ message: err.errorMessage });
      } else {
        Toast.fail('批量创建出错，请联系管理员');
      }
      logger.error(`Batch create residences for building: ${JSON.stringify(building)} failed.`, err);
    });
  }
})