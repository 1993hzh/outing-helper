const BizError = require('../bizError')
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
    _id: undefined,
    building: undefined,
    room: undefined
  };
  qrcode_url = undefined;
  status = 1;// -1: deleted, 1: valid, 0: invalid
  revision = 0;
  created_at = undefined;
  created_by = undefined;
  updated_at = undefined;
  updated_by = undefined;

  constructor(jsonObject) {
    Object.assign(this, jsonObject);
  }

  bindTo(user) {
    console.info(`Binding certificate: ${this._id} to user: ${JSON.stringify(user)}`);
    user.certificate._id = this._id;
    console.info(`Binding certificate: ${this._id} succeed.`);
    return user;
  }

  checkOut(user) {
    console.info(`Check-out certificate: ${this._id}.`);
    if (this.status !== 1) {
      console.error(`Cannot do checkOut for invalid certificate: ${JSON.stringify(this)}`);
      throw new BizError('出行证暂时无效，不可使用');
    }

    this.outing_count++;

    const wxContext = cloud.getWXContext();
    let record = new CheckRecord();
    record.check_type = 0;
    record.checked_by = wxContext.OPENID;
    record.certificate_id = this._id;
    record.user = {
      _id: user._id,
      name: user.name,
      residence: this.residence
    };
    return record;
  }

  checkIn(user) {
    console.info(`Check-in certificate: ${this._id}.`);
    if (this.status !== 1) {
      console.error(`Cannot do checkOut for invalid certificate: ${JSON.stringify(this)}`);
      throw new BizError('出行证暂时无效，不可使用');
    }

    this.outing_count++;

    const wxContext = cloud.getWXContext();
    let record = new CheckRecord();
    record.check_type = 1;
    record.checked_by = wxContext.OPENID;
    record.certificate_id = this._id;
    record.user = {
      _id: user._id,
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