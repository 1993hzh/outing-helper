class User {

  _id = undefined;
  wx_open_id = '';
  name = '';
  contact_number = '';
  residence = {
    id: undefined,
    building: undefined,
    room: undefined
  };
  certificate = {
    id: '',
    qrcode_url: ''
  };
  managed_buildings = {};
  status = 0;// -1: deleted, 0: valid
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