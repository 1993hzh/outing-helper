const BizError = require('../bizError')
const { BaseService, cloud } = require('./baseService')
const Certificate = require('./certificate')
const CheckRecord = require('./checkRecord')
const CertificateService = require('./certificateService')

const moment = require('moment')
moment.locale('zh-CN');

const db = cloud.database();
const _ = db.command;

const COLLECTION_CHECK_RECORD = 'check_record';

class CheckRecordService extends BaseService {

  certificateService = undefined;

  constructor(context) {
    super(COLLECTION_CHECK_RECORD, context);
    this.certificateService = new CertificateService(context);
  }

  transform(jsonObject) {
    return new CheckRecord(jsonObject);
  }

  async findByCertificate(certificate_id) {
    if (!certificate_id) {
      throw new BizError('出入证不存在');
    }

    const user = this.context.user;
    if (user.certificate._id !== certificate_id) {
      console.error(`User: ${user._id} trying to access checkRecord of certificate: ${certificate_id}`);
      throw new BizError('用户非法访问他人出入记录.');
    }

    const thisMonday = moment()
      .weekday(0).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .toDate();
    return await this.findBy({
      criteria: {
        certificate: {
          _id: certificate_id
        },
        created_at: _.gte(thisMonday)
      },
      orderBy: [
        { prop: 'created_at', type: 'asc' }
      ],
    });
  }

  async findLastOutRecord(certificate_id) {
    if (!certificate_id) {
      throw new BizError('出入证不存在');
    }

    const thisMonday = moment()
      .weekday(0).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .toDate();
    return await this.findBy({
      criteria: {
        certificate: {
          _id: certificate_id
        },
        status: 0,
        created_at: _.gte(thisMonday),
      },
      orderBy: [
        { prop: 'created_at', type: 'desc' }
      ],
      limit: 1,
    });
  }

  async checkOut(certId) {
    if (!certId) {
      throw new BizError('出入证不存在');
    }

    const certificate = await this.certificateService.findById(certId);
    const checkRecord = certificate.checkOut();
    const savedRecord = await this.saveCheckOut(checkRecord);
    await this.certificateService.update(certificate, { outing_count: certificate.outing_count });
    return savedRecord;
  }

  async saveCheckOut(record) {
    const checker = this.context.user;
    record.out = {
      checked_at: new Date(),
      checked_by: {
        _id: checker._id,
        name: checker.name,
      }
    };
    return await this.insert(record);
  }

  async checkIn(certId) {
    if (!certId) {
      throw new BizError('出入证不存在');
    }

    const certificate = await this.certificateService.findById(certId);
    const inRecord = certificate.checkIn();
    const outRecords = await this.findLastOutRecord(certId);
    const outRecord = outRecords[0];
    return await this.saveCheckIn({ outRecord, inRecord });
  }

  async saveCheckIn({ outRecord, inRecord }) {
    const checker = this.context.user;
    inRecord.in = {
      checked_at: new Date(),
      checked_by: {
        _id: checker._id,
        name: checker.name,
      }
    };
    
    if (!outRecord) {
      console.error(`Check-in a record without outRecord: ${JSON.stringify(inRecord)}`);
      return await this.insert(inRecord);
    }

    delete inRecord.certificate;
    delete inRecord._id;
    delete inRecord.out;
    return await this.update(outRecord, inRecord);
  }
}

module.exports = CheckRecordService;