const CheckRecord = require('./checkRecord')

const moment = require('moment')
moment.locale('zh-CN');

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

class Certificate {
  _id = undefined;
  outing_count = 0;
  residence = {
    id: undefined,
    building: undefined,
    room: undefined
  };
  qrcode_url = undefined;
  status = 0;// -1: deleted, 0: valid, 1: invalid
  revision = 0;
  created_at = undefined;
  created_by = undefined;
  updated_at = undefined;
  updated_by = undefined;

  constructor(jsonObject) {
    Object.assign(this, jsonObject);
  }

  //TODO
  async bindTo(user) {
    console.info(`Binding certificate: ${this._id} to user: ${JSON.stringify(user)}`);

    const wxContext = cloud.getWXContext();
    user.certificate.id = this._id;
    user.certificate.qr_code_url = this.qrcode_url;
    user.certificate.approved_by = wxContext.OPENID;
    user.certificate.approved_at = new Date();

    console.info(`Binding certificate: ${this._id} succeed.`);
  }

  checkOut(user) {
    console.info(`Check-out certificate: ${this._id}.`);
    if (this.status !== 0) {
      throw new Error(`Invalid status for certificate: ${JSON.stringify(this)}`);
    }

    this.outing_count++;

    const wxContext = cloud.getWXContext();
    let record = new CheckRecord();
    record.check_type = 0;
    record.checked_by = wxContext.OPENID;
    record.certificate_id = this._id;
    record.user = {
      id: user._id,
      name: user.name,
      residence: this.residence
    };
    return record;
  }

  checkIn(user) {
    console.info(`Check-in certificate: ${this._id}.`);
    if (this.status !== 0) {
      throw new Error(`Invalid status for certificate: ${JSON.stringify(this)}`);
    }

    this.outing_count++;

    const wxContext = cloud.getWXContext();
    let record = new CheckRecord();
    record.check_type = 1;
    record.checked_by = wxContext.OPENID;
    record.certificate_id = this._id;
    record.user = {
      id: user._id,
      name: user.name,
      residence: this.residence
    };
    return record;
  }

  //TODO
  async reset() {

  }
}

module.exports = Certificate;