const BizError = require('../bizError')
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
      throw new BizError('出行证不存在', certificate_id);
    }

    const user = this.context.user;
    if (!user.role.checker && !user.role.superAdmin && user.certificate._id !== certificate_id) {
      throw new BizError('用户非法访问他人出行记录.', user, certificate_id);
    }

    const thisMonday = moment()
      .weekday(0).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .toDate();
    return await this.findBy({
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