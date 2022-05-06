class CheckRecord {

  _id = undefined;
  certificate_id = undefined;
  user = {
    id: undefined,
    name: undefined,
    residence: {
      id: '',
      building_id: -1,
      building: '',
      room: ''
    }
  };
  checked_by = '';// checker name
  check_type = 0;// 0: out, 1: in
  status = 0;// -1: deleted, 0: normal
  revision = 0;
  created_at = undefined;
  created_by = undefined;
  updated_at = undefined;
  updated_by = undefined;

  constructor(jsonObject) {
    Object.assign(this, jsonObject);
  }

  addTo(certificate) {
    if (!certificate) {
      throw new Error(`Found invalid certificate: ${certificate}`);
    }

    certificate.outingRecords.push({
      _id: this._id,
      user: this.user,
      checked_by: this.checked_by,
      check_type: this.check_type
    });
  }
}

module.exports = CheckRecord;