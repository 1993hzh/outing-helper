class CheckRecord {

  _id = undefined;
  certificate = {
    id: '',
    residence: {
      id: '',
      building_id: -1,
      building: '',
      room: ''
    }
  };
  user = {
    id: '',
    name: ''
  };
  check_type = '';// 0: out, 1: in
  created_at = undefined;
  created_by = {};
  updated_at = undefined;
  updated_by = {};

  constructor(object) {
    Object.assign(this, object);
  }
}

export default CheckRecord;