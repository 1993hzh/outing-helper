const BaseService = require('./baseService')
const Certificate = require('./certificate')

const moment = require('moment')
moment.locale('zh-CN');

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const COLLECTION_CERTIFICATE = 'certificate';
const QR_CODE_TARGET_PAGE = 'pages/check/index';

class CertificateService extends BaseService {

  constructor() {
    super(COLLECTION_CERTIFICATE);
  }

  transform(jsonObject) {
    return new Certificate(jsonObject);
  }

  async findByResidence(residence) {
    return db
      .collection(COLLECTION_CERTIFICATE)
      .where(_.and([
        {
          status: _.gte(0)
        },
        {
          residence: {
            id: residence._id
          }
        }
      ]))
      .orderBy('created_at', 'desc')
      .get()
      .then((response) => {
        if (response.data) {
          response.data.map(e => this.transform(e));
        }
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
      const updateResult = await this.update(certificate);
      if (updateResult <= 0) {
        throw new Error(`Update certificate: ${certificate._id} with qrcode: ${filePath} failed.`);
      }

      return {
        success: true,
        data: certificate
      }
    } catch (error) {
      console.error(JSON.stringify(error));
      return {
        success: false,
        errorCode: error.errCode,
        errorMessage: error.errMsg
      };
    }
  }
}

module.exports = CertificateService;