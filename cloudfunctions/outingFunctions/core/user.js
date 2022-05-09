const BizError = require('../bizError')

class User {

  _id = undefined;
  wx_open_id = '';
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
  check_points = undefined;
  managed_buildings = {};
  // for approval
  pending_record = {
    _id: undefined,
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
  status = 0;// -1: deleted, 0: valid, 10: hasPendingRecord
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