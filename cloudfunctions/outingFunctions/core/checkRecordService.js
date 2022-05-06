const BaseService = require('./baseService')
const CheckRecord = require('./checkRecord')

const moment = require('moment')
moment.locale('zh-CN');

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const COLLECTION_CHECK_RECORD = 'check_record';

class CheckRecordService extends BaseService {

  constructor() {
    super(COLLECTION_CHECK_RECORD);
  }

  transform(jsonObject) {
    return new CheckRecord(jsonObject);
  }

  async findByCertificate(ceritificate_id) {
    const thisMonday = moment().weekday(0);
    return db
      .collection(COLLECTION_CHECK_RECORD)
      .where(_.and([
        {
          status: _.gte(0)
        },
        {
          certificate: {
            id: ceritificate_id
          }
        },
        {
          checked_at: _.gte(thisMonday)
        }
      ]))
      .orderBy('checked_at', 'asc')
      .get()
      .then((response) => {
        if (response.data) {
          response.data.map(e => this.transform(e));
        }
      });
  }
}

module.exports = CheckRecordService;