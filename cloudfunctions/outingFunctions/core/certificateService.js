const BizError = require('../bizError')
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

  async findById(_id) {
    const user = this.context.user;
    if (!user) {
      throw new Error(`User not exists in context`);
    }

    if (!user.role.checker && !user.role.superAdmin && user.certificate._id !== _id) {
      console.error(`User: ${user._id} trying to access certificate: ${_id}`);
      throw new BizError('用户非法访问他人出行证.');
    }

    return await super.findById(_id);
  }

  async findByResidence(residence) {
    if (!residence || !residence._id) {
      throw new Error(`Invalid residence: ${JSON.stringify(residence)} to find certificate.`);
    }

    return await this.findBy({
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

    const cert = await this.insert(certificate);
    return await this.createQRcode(cert);
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

      return await this.update(certificate, { qrcode_url: upload.fileID });
    } catch (error) {
      console.error(`create QR code for certificate: ${certificate._id} failed.`, error);
      throw error;
    }
  }

  async checkIn(certificate) {
    if (!certificate || !certificate._id) {
      throw new BizError('出行证不存在');
    }

    const cert = new Certificate(certificate);
    const checkRecord = cert.checkIn({});// user not implemented
    return await this.persist(cert, checkRecord);
  }

  async checkOut(certificate) {
    if (!certificate || !certificate._id) {
      throw new BizError('出行证不存在');
    }

    const cert = new Certificate(certificate);
    const checkRecord = cert.checkOut({});// user not implemented
    return await this.persist(cert, checkRecord);
  }

  // private
  async persist(certificate, checkRecord) {
    try {
      const inserted = await this.checkRecordService.insert(checkRecord);
      const result = await this.update(certificate, { outing_count: certificate.outing_count });
      return {
        certificate: result,
        checkRecord: inserted,
      };
    } catch (error) {
      console.error(`certificate: ${JSON.stringify(certificate)} persist failed.`, error);
      throw error
    }
  }
}

module.exports = CertificateService;