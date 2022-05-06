// pages/check/index.js
import * as logger from '../../utils/log';
import CertificateService from '../../core/certificateService';
import Toast from '@vant/weapp/toast/toast';

const app = getApp();
const certificateService = new CertificateService();

Page({

  data: {
    certificate: undefined,
  },

  onLoad(options) {
    // const certId = options.id;
    const certId = 'J_NlSuiOPOfmzWA0EQIbb';
    if (certId) {
      certificateService.findById(certId)
        .then((resp) => {
          let data = resp.data;
          logger.debug(`Find certificate by id: ${certId} returned: ${JSON.stringify(data)}`);
          this.setData({ certificate: data })
        })
        .catch((error) => {
          logger.error(`Find certificate by id: ${certId} failed with: ${JSON.stringify(error)}`);
          Toast.fail('加载出行证出错，请联系管理员');
        });
    }
  },

  onReady() { },

  onShow() {
    this.getTabBar().init();
  },

  onShareAppMessage() {

  },

  onClickScan() {
    wx.scanCode()
      .then((resp) => {
        logger.info(resp);
        return wx.navigateTo({ url: resp.result })
      })
      .catch((err) => {
        logger.error(err);
        Toast.fail('二维码扫描出错，请重试。');
      });
  }
})