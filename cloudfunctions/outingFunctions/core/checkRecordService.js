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

  constructor(context) {
    super(COLLECTION_CHECK_RECORD, context);
  }

  transform(jsonObject) {
    return new CheckRecord(jsonObject);
  }

  async findByCertificate(certificate_id) {
    if (!certificate_id) {
      throw new Error('Found empty certificate id.');
    }

    const thisMonday = moment()
      .weekday(0).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .toDate();
    return this.findBy({
      criteria: {
        certificate_id: certificate_id,
        created_at: _.gte(thisMonday)
      },
      orderBy: [
        { prop: 'created_at', type: 'asc' }
      ]
    });
  }
}

module.exports = CheckRecordService;