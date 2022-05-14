const BizError = require('../bizError')
const { BaseService, cloud } = require('./baseService')
const Certificate = require('./certificate')

const moment = require('moment')
moment.locale('zh-CN');

const db = cloud.database();
const _ = db.command;

const COLLECTION_CERTIFICATE = 'certificate';
const QR_CODE_TARGET_PAGE = 'pages/check/index';

class CertificateService extends BaseService {

  constructor(context) {
    super(COLLECTION_CERTIFICATE, context);
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
      throw new BizError('用户非法访问他人出入证.');
    }

    return await super.findById(_id);
  }

  async findByResidence(residence) {
    if (!residence || !residence._id) {
      throw new Error(`Invalid residence: ${JSON.stringify(residence)} to find certificate.`);
    }

    const result = await this.findBy({
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

    if (result.length <= 0) {
      console.warn(`Cannot find certificate for residence: ${JSON.stringify(residence)}`);
    }
    return result[0];
  }

  async toggle(certificate) {
    if (!certificate) {
      throw new Error('Certificate not found.');
    }

    const user = this.context.user;
    const managedBuildings = user.managed_buildings || [];
    if (!user.role.superAdmin && !managedBuildings.find(e => e.id === certificate.residence.building.id)) {
      throw new BizError('只能操作自己管理的楼栋数据');
    }

    const status = 1 - certificate.status;
    return await this.update(certificate, { status: status });
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
}

module.exports = CertificateService;