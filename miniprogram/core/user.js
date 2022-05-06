class User {

  _id = undefined;
  name = '';
  wx_open_id = '';
  residence_id = '';
  contact_number = '';
  status = 0;
  
  certificate = {
    id: '',
    qrcode_url: '',
    requested_at: undefined,
    approved_by: '',
    approved_at: undefined,
  };

  managed_buildings = {

  };

  constructor(id) {
    this._id = id;
  }

  bind(certificate) {
    certificate.bindTo(this);
    
  }
}

export default User;