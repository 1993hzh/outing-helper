const BaseService = require('./baseService')
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

  constructor(tx) {
    super(COLLECTION_USER, tx);
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

  async register(user) {
    if (!user || !user.name || !user.contact_number || !user.residence) {
      throw new Error(`Found invalid user: ${JSON.stringify(user)}.`);
    }

    return this.update(user,
      {
        name: user.name,
        contact_number: user.contact_number,
        residence: user.residence,
      }
    );
  }

  async bindCertificate(user) {
    if (!user || !user.certificate) {
      throw new Error('Found invalid user.');
    }

    return this.update(user,
      {
        certificate: user.certificate,
      }
    );
  }

  async findByCertificate(certificate_id) {
    if (!certificate_id) {
      throw new Error('Found empty certificate id.');
    }

    return this.findBy({
      criteria: {
        certificate: {
          id: certificate_id
        }
      },
      orderBy: [
        { prop: 'created_at', type: 'asc' }
      ]
    });
  }
}

module.exports = UserService;