const BizError = require('../bizError')
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

    const result = await this.findBy({
      criteria: {
        wx_open_id: wx_open_id
      },
      orderBy: [
        { prop: 'created_at', type: 'desc' }
      ],
      limit: 1
    });

    if (result.length > 0) {
      console.log('User exists', JSON.stringify(result));
      return result[0];
    } else {
      return await this.create();
    }
  }

  async create() {
    const wx_open_id = cloud.getWXContext().OPENID;
    if (!wx_open_id) {
      console.error(`Invalid wxContext: ${JSON.stringify(cloud.getWXContext())}`);
      throw new Error('Found invalid wxContext');
    }

    const user = new User();
    user.wx_open_id = wx_open_id;
    return await this.insert(user);
  }

  async updateProfile(userProfile) {
    if (!userProfile || !userProfile.name || !userProfile.contact_number || !userProfile.residence) {
      throw new Error(`Found invalid user: ${JSON.stringify(userProfile)}.`);
    }

    const user = this.context.user;
    const updatedUser = await this.update(user, {
      wx_nick_name: userProfile.wx_nick_name,
      wx_avatar_url: userProfile.wx_avatar_url,
      name: userProfile.name,
      contact_number: userProfile.contact_number,
      residence: {
        _id: userProfile.residence._id,
        building: userProfile.residence.building,
        room: userProfile.residence.room
      },
      'role.resident': true,
      status: 1,
    });

    const certs = await this.certificateService.findByResidence(updatedUser.residence)
    let certificate = certs[0];
    if (!certificate) {
      certificate = await this.certificateService.certify(updatedUser.residence);
      console.log(`Create a new cert: ${JSON.stringify(certificate)}`);
    }
    certificate.bindTo(user);
    return await this.update(updatedUser, {
      certificate: {
        _id: certificate._id,
      },
    });
  }

  async findByCertificate(certificate_id) {
    if (!certificate_id) {
      throw new Error('Found empty certificate id.');
    }

    return await this.findBy({
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