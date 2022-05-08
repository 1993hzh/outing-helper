const BaseService = require('./baseService')
const CertificateService = require('./certificateService')
const User = require('./user')

const moment = require('moment')
moment.locale('zh-CN');

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const COLLECTION_USER = 'user';

class UserService extends BaseService {

  certificateService = undefined;

  constructor(context) {
    super(COLLECTION_USER, context);
    this.certificateService = new CertificateService(context);
  }

  transform(jsonObject) {
    return new User(jsonObject);
  }

  async login() {
    const wx_open_id = cloud.getWXContext().OPENID;
    if (!wx_open_id) {
      console.error(`Invalid wxContext: ${JSON.stringify(cloud.getWXContext())}`);
      throw new Error('Found invalid wxContext');
    }

    return this.findBy({
      criteria: {
        wx_open_id: wx_open_id
      },
      orderBy: [
        { prop: 'created_at', type: 'desc' }
      ],
      limit: 1
    }).then((result) => {
      if (result.data.length > 0) {
        result.data = result.data[0];
        return result;
      } else {
        return this.create();
      }
    });
  }

  async create() {
    const wx_open_id = cloud.getWXContext().OPENID;
    if (!wx_open_id) {
      console.error(`Invalid wxContext: ${JSON.stringify(cloud.getWXContext())}`);
      throw new Error('Found invalid wxContext');
    }

    const user = new User();
    user.wx_open_id = wx_open_id;
    return this.insert(user);
  }

  async updateProfile(user) {
    if (!user || !user.name || !user.contact_number || !user.residence) {
      throw new Error(`Found invalid user: ${JSON.stringify(user)}.`);
    }

    return this.update(user,
      {
        name: user.name,
        contact_number: user.contact_number,
        residence: user.residence,
      }
    ).then((result) => {
      return this.certificateService.findByResidence(user.residence)
    }).then((result) => {
      const certs = result.data;
      if (certs.length <= 0) {
        return this.certificateService.certify(user.residence);
      } else {
        return result.data[0];
      }
    }).then((result) => {
      console.log(`Find or certify a cert: ${JSON.stringify(result)}`);
      const cert = result;
      cert.bindTo(user);
      return this.update(user,
        {
          certificate: {
            id: cert._id,
          },
        });
    });
  }

  async findByCertificate(certificate_id) {
    if (!certificate_id) {
      throw new Error('Found empty certificate id.');
    }

    return this.findBy({
      criteria: {
        certificate: {
          _id: certificate_id
        }
      },
      orderBy: [
        { prop: 'created_at', type: 'asc' }
      ]
    });
  }
}

module.exports = UserService;