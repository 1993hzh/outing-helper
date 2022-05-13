const BizError = require('../bizError')
const CheckRecord = require('./checkRecord')

const moment = require('moment')
moment.locale('zh-CN');

class Certificate {
  _id = undefined;
  outing_count = 0;
  residence = {
    _id: undefined,
    building: undefined,
    room: undefined
  };
  user = {
    _id: undefined,
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
    if (!this._id) {
      throw new Error('Invalid certificate to bindTo user.');
    }

    return user.bind(this);
  }

  checkOut(user = {}) {
    console.info(`Check-out certificate: ${this._id}.`);
    if (this.status !== 1) {
      console.error(`Cannot do checkOut for invalid certificate: ${JSON.stringify(this)}`);
      throw new BizError('出入证暂时无效，不可使用');
    }

    this.outing_count++;
    return CheckRecord.outRecord({
      user: user,
      certificate: this,
    });
  }

  checkIn(user = {}) {
    console.info(`Check-in certificate: ${this._id}.`);
    if (this.status !== 1) {
      console.error(`Cannot do checkIn for invalid certificate: ${JSON.stringify(this)}`);
      throw new BizError('出入证暂时无效，不可使用');
    }

    return CheckRecord.inRecord({
      user: user,
      certificate: this,
    });
  }

  //TODO
  async reset() {

  }
}

module.exports = Certificate;