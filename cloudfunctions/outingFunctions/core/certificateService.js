const BaseService = require('./baseService')
const Certificate = require('./certificate')
const CheckRecordService = require('./checkRecordService')

const moment = require('moment')
moment.locale('zh-CN');

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;
const COLLECTION_CERTIFICATE = 'certificate';
const QR_CODE_TARGET_PAGE = 'pages/check/index';
/* service */
const checkRecordService = new CheckRecordService();

class CertificateService extends BaseService {

  constructor(tx) {
    super(COLLECTION_CERTIFICATE, tx);
  }

  transform(jsonObject) {
    return new Certificate(jsonObject);
  }

  async findByResidence(residence) {
    return this.findBy({
      criteria: {
        residence: {
          id: residence._id
        }
      },
      orderBy: [
        { prop: 'created_at', type: 'desc' }
      ]
    });
  }

  async createQRcode(certificate) {
    try {
      // 生成无数量限制的二维码
      const resp = await cloud.openapi.wxacode.getUnlimited({
        "scene": `id=${certificate._id}`,
        "page": QR_CODE_TARGET_PAGE,
        "checkPath": true,
        "envVersion": 'release'
      });

      const { buffer } = resp;
      const upload = await cloud.uploadFile({// 将图片上传云存储空间
        cloudPath: `QRcode/${certificate.residence.building.name}/${certificate.residence.room}/`,
        fileContent: buffer
      });
      console.log(`Upload QRcode: ${certificate._id} succeed with response: ${JSON.stringify(upload)}`);

      let filePath = upload.fileID;
      certificate.qrcode_url = filePath;
      await this.update(certificate, { qrcode_url: filePath });
      return {
        success: true,
        data: certificate
      }
    } catch (error) {
      console.error(`create QR code for certificate: ${JSON.stringify(certificate)} failed.`, error);
      return {
        success: false,
        errorCode: error.errCode,
        errorMessage: error.errMsg
      };
    }
  }

  async checkIn(certificate) {
    if (!certificate || !certificate._id) {
      throw new Error(`Invalid certificate:${JSON.stringify(certificate)} to checkin.`);
    }

    const cert = new Certificate(certificate);
    const checkRecord = cert.checkIn({});// user not implemented
    return this.persist(cert, checkRecord);
  }

  async checkOut(certificate) {
    if (!certificate || !certificate._id) {
      throw new Error(`Invalid certificate:${JSON.stringify(certificate)} to checkout.`);
    }

    const cert = new Certificate(certificate);
    const checkRecord = cert.checkOut({});// user not implemented
    return this.persist(cert, checkRecord);
  }

  // private
  async persist(certificate, checkRecord) {
    const transaction = await db.startTransaction();
    try {
      const inserted = await new CheckRecordService(transaction).insert(checkRecord);
      await this.update(certificate, { outing_count: certificate.outing_count });
      await transaction.commit();
      return {
        success: true,
        data: {
          certificate: certificate,
          checkRecord: inserted
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error(`certificate: ${JSON.stringify(certificate)} persist failed.`, error);
      return {
        success: false,
        error: error
      };
    }
  }
}

module.exports = CertificateService;