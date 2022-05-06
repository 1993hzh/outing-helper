import * as logger from '../utils/log';
import CheckRecord from './checkRecord';
import User from './user';
import CheckRecordService from './checkRecordService';
import Moment from 'moment';
Moment.locale('zh-CN');

const app = getApp();
const checkRecordService = new CheckRecordService();

class Certificate {
  _id = undefined;
  outingRecords = [];
  residence = {
    id: undefined,
    building: undefined,
    room: undefined
  };
  qrcode_url = '';
  status = 0;// -1: deleted, 0: valid, 1: invalid
  created_at = undefined;
  created_by = {};
  updated_at = undefined;
  updated_by = {};

  constructor(object) {
    Object.assign(this, object);
  }

  //TODO
  bindTo(user) {
    logger.info(`Binding certificate: ${this._id} to user: ${JSON.stringify(user)}`);

    user.certificate.id = this._id;
    user.certificate.qr_code_url = this.qrcode_url;
    user.certificate.approved_by = app.globalData.loginUser._id;
    user.certificate.approved_at = new Date();

    logger.info(`Binding certificate: ${this._id} succeed.`);
  }

  checkOut() {
    logger.info(`Check-out certificate: ${this._id}.`);
    if (this.status !== 0) {
      throw new Error(`Invalid status for certificate: ${JSON.stringify(this)}`);
    }

    let record = new CheckRecord();
    record.certficate = {
      id: this._id,
      residence: this.residence
    };
    record.check_type = 0;
    return checkRecordService.insert(record);
  }

  checkIn() {
    logger.info(`Check-in certificate: ${this._id}.`);
    if (this.status !== 0) {
      throw new Error(`Invalid status for certificate: ${JSON.stringify(this)}`);
    }

    let record = new CheckRecord();
    record.certficate = {
      id: this._id,
      residence: this.residence
    };
    record.check_type = 1;
    return checkRecordService.insert(record);
  }

  //TODO
  reset() {

  }

  createQRcode() {
    return wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        type: 'createQRcode',
        certificate: this
      }
    }).then((response) => {
      let result = response.result;
      if (!response.success) {
        throw new Error(response.errorMessage);
      }

      this.qrcode_url = filePath;
      return this;
    });
  }
}

export default Certificate;