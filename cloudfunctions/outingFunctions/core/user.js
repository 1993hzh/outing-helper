const BizError = require('../bizError')

class User {

  _id = undefined;
  wx_open_id = '';
  wx_nick_name = undefined;
  wx_avatar_url = undefined;
  name = '';
  contact_number = '';
  residence = {
    _id: undefined,
    building: undefined,
    room: undefined
  };
  certificate = {
    _id: undefined
  };
  // for role
  role = {
    resident: undefined,
    checker: undefined,
    admin: undefined,
    superAdmin: undefined
  };
  managed_buildings = {};
  // for approval
  pending_data = {
    _id: undefined,
    wx_nick_name: undefined,
    wx_avatar_url: undefined,
    name: undefined,
    contact_number: undefined,
    residence: {
      _id: undefined,
      building: undefined,
      room: undefined
    },
    certificate: {
      _id: undefined
    },
  };
  status = 0;// -1: deleted, 0: initial, 1: valid, 10: hasPendingRecord
  revision = 0;
  created_at = undefined;
  created_by = undefined;
  updated_at = undefined;
  updated_by = undefined;

  constructor(jsonObject) {
    Object.assign(this, jsonObject);
  }

  bind(certificate) {
    certificate.bindTo(this);
    //TODO
  }
}

module.exports = User;