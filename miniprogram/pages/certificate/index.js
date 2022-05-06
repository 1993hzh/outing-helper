// pages/certificate/index.js
import * as logger from '../../utils/log';

const app = getApp();

Page({

  data: {
    hasQRcode: true,
    codeSrc: 'cloud://cloud1-9ggmda0qb8fc88af.636c-cloud1-9ggmda0qb8fc88af-1311685783/QRcode/qrcode_img01.yzcdn.cn.png'
  },

  onLoad(options) {
    // wx.cloud.callFunction({
    //   name: 'outingFunctions',
    //   data: {
    //     service: 'residenceService',
    //     method: 'create',
    //     args: ['56号楼', '403']
    //   }
    // }).then((resp) => {
    //   return wx.cloud.callFunction({
    //     name: 'outingFunctions',
    //     data: {
    //       service: 'residenceService',
    //       method: 'certify',
    //       args: resp.result
    //     }
    //   });
    // }).then((resp) => {
    //   logger.info(JSON.stringify(resp))
    // }).catch((error) => {
    //   logger.error(JSON.stringify(error))
    // });
  },

  onReady() {

  },

  onShow() {
    this.getTabBar().init();
  },

  onHide() {

  },

  onUnload() {

  },

  onPullDownRefresh() {

  },

  onReachBottom() {

  },

  onShareAppMessage() {

  }
})