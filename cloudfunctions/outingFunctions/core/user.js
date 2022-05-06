class User {

  _id = undefined;
  name = '';
  wx_open_id = '';
  contact_number = '';
  status = 0;
  certificate = {
    id: '',
    qrcode_url: ''
  };

  managed_buildings = {

  };

  constructor(id) {
    this._id = id;
  }

  bind(certificate) {
    certificate.bindTo(this);
    //TODO
  }
}

module.exports = User;