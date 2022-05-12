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
  managed_buildings = undefined;
  // for approval
  pending = {
    status: undefined,// -1: rejected; 0: initial; 1: approved
    comment: undefined,
    data: {
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
    }
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
    if (!this._id) {
      throw new Error(`Invalid user to bind certificate.`);
    }

    const pendingCert = this.pending.data.certificate;
    pendingCert._id = certificate._id;
    console.info(`Binding certificate: ${certificate._id} to user: ${this._id}.`);
    return this;
  }

  applyPendingData({ command: command }) {
    return {
      ...this.pending.data,
      ...{
        role: {
          resident: true,
        },
        status: 1,
        pending: command.set({// clear pending data
          data: {
            residence: {},
            certificate: {},
          },
          comment: '',
          status: 1,
        }),
      }
    };
  }
}

module.exports = User;