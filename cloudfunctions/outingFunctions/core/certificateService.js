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

class CertificateService extends BaseService {

  checkRecordService = undefined;

  constructor(context) {
    super(COLLECTION_CERTIFICATE, context);
    this.checkRecordService = new CheckRecordService(context);
  }

  transform(jsonObject) {
    return new Certificate(jsonObject);
  }

  async findByResidence(residence) {
    if (!residence || !residence._id) {
      throw new Error(`Invalid residence: ${JSON.stringify(residence)} to find certificate.`);
    }

    return this.findBy({
      criteria: {
        residence: {
          _id: residence._id
        }
      },
      orderBy: [
        { prop: 'created_at', type: 'desc' }
      ],
      limit: 1
    });
  }

  async certify(residence) {
    if (!residence || !residence._id) {
      throw new Error(`Invalid residence to certify: ${JSON.stringify(residence)}.`);
    }

    console.info(`Certify Residence: ${JSON.stringify(residence)}`);

    const certificate = new Certificate();
    certificate.residence = {
      _id: residence._id,
      building: residence.building,
      room: residence.room
    };

    const result = await this.insert(certificate);
    const cert = result.data;
    console.info(`Successfully certified: ${JSON.stringify(cert)}`);
    this.createQRcode(cert);
    return cert;
  }

  async createQRcode(certificate) {
    try {
      // 生成无数量限制的二维码
      const resp = await cloud.openapi.wxacode.getUnlimited({
        "scene": `${certificate._id}`,
        "page": QR_CODE_TARGET_PAGE,
        "checkPath": true,
        "envVersion": 'release'
      });

      const { buffer } = resp;
      const upload = await cloud.uploadFile({// 将图片上传云存储空间
        cloudPath: `QRcode/${certificate.residence.building.name}/${certificate.residence.room}/${certificate._id}`,
        fileContent: buffer
      });
      console.log(`Upload QRcode: ${certificate._id} succeed with result: ${JSON.stringify(upload)}`);

      let filePath = upload.fileID;
      certificate.qrcode_url = filePath;
      await this.update(certificate, { qrcode_url: filePath });
      return certificate;
    } catch (error) {
      console.error(`create QR code for certificate: ${JSON.stringify(certificate)} failed.`, error);
      throw error;
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
    try {
      const inserted = await new CheckRecordService(transaction).insert(checkRecord);
      await this.update(certificate, { outing_count: certificate.outing_count });
      return {
        success: true,
        data: {
          certificate: certificate,
          checkRecord: inserted.data
        }
      };
    } catch (error) {
      console.error(`certificate: ${JSON.stringify(certificate)} persist failed.`, error);
      return {
        success: false,
        error: error
      };
    }
  }
}

module.exports = CertificateService;