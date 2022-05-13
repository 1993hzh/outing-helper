const BizError = require('../bizError')

class CheckRecord {

  _id = undefined;
  certificate = {
    _id: undefined,
    residence: {
      _id: undefined,
      building: {
        id: undefined,
        name: undefined,
      },
      room: undefined,
    },
    user: {
      _id: undefined,
    },
  };
  out = {
    checked_at: undefined,
    checked_by: undefined,
  };
  in = {
    checked_at: undefined,
    checked_by: undefined,
  };
  status = 0;// -1: deleted, 0: outed, 1: in
  revision = 0;
  created_at = undefined;
  created_by = undefined;
  updated_at = undefined;
  updated_by = undefined;

  constructor(jsonObject) {
    Object.assign(this, jsonObject);
  }

  static inRecord({ user = {}, certificate }) {
    if (!certificate) {
      throw new Error('No certificate found when check in.');
    }

    const result = new CheckRecord();
    result.certificate = {
      _id: certificate._id,
      residence: certificate.residence,
      user: {
        _id: user._id,
      },
    }
    result.status = 1;
    return result;
  }

  static outRecord({ user = {}, certificate }) {
    if (!certificate) {
      throw new Error('No certificate found when check in.');
    }

    const result = new CheckRecord();
    result.certificate = {
      _id: certificate._id,
      residence: certificate.residence,
      user: {
        _id: user._id,
      },
    }
    result.status = 0;
    return result;
  }

  // addTo(certificate) {
  //   if (!certificate) {
  //     throw new Error(`Found invalid certificate: ${certificate}`);
  //   }

  //   certificate.outingRecords.push({
  //     _id: this._id,
  //     user: this.user,
  //     checked_by: this.checked_by,
  //     check_type: this.check_type
  //   });
  // }
}

module.exports = CheckRecord;