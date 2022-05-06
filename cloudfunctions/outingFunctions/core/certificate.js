const CheckRecord = require('./checkRecord')
const CheckRecordService = require('./checkRecordService')

const moment = require('moment')
moment.locale('zh-CN');

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const wxContext = cloud.getWXContext();
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

  constructor(jsonObject) {
    Object.assign(this, jsonObject);
  }

  //TODO
  bindTo(user) {
    console.info(`Binding certificate: ${this._id} to user: ${JSON.stringify(user)}`);

    user.certificate.id = this._id;
    user.certificate.qr_code_url = this.qrcode_url;
    user.certificate.approved_by = wxContext.OPENID;
    user.certificate.approved_at = new Date();

    console.info(`Binding certificate: ${this._id} succeed.`);
  }

  checkOut() {
    console.info(`Check-out certificate: ${this._id}.`);
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
    console.info(`Check-in certificate: ${this._id}.`);
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
}

module.exports = Certificate;