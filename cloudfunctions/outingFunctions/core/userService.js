const BizError = require('../bizError')
const { BaseService, cloud } = require('./baseService')
const CertificateService = require('./certificateService')
const User = require('./user')

const moment = require('moment')
moment.locale('zh-CN');

const db = cloud.database()
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

  async findUsersByCriteria(criteria) {
    if (!criteria || Object.keys(criteria).length === 0) {
      throw new BizError('不支持无条件查询用户');
    }

    return await this.findBy({
      criteria: criteria,
      orderBy: [
        { prop: 'residence.building.id', type: 'asc' },
        { prop: 'residence.room', type: 'asc' }
      ],
    });
  }

  async listUsers({ building: building, status: status }) {
    if (building === undefined || status === undefined) {
      return;
    }

    const user = this.context.user;
    const managedBuildings = user.managed_buildings || [];
    if (!user.role.superAdmin && !managedBuildings.find(e => e.id === building)) {
      throw new BizError('只能查看自己管理的楼栋数据');
    }

    const residenceKey = status === 1 ? "residence" : "pending.data.residence";
    return await this.findBy({
      criteria: {
        "pending.status": status,
        [residenceKey]: {
          building: {
            id: building
          }
        }
      },
      orderBy: [
        { prop: `${residenceKey}.room`, type: 'asc' }
      ],
    });
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
    if (!user) {
      throw new Error('User not found when updateProfile.');
    }

    if (user._id != userProfile._id) {
      console.error(`User: ${user._id} trying to update profile of: ${userProfile._id}`);
      throw new BizError('用户只可以更新自己的信息');
    }

    return await this.update(user, {
      status: 10,
      pending: {
        comment: '',
        status: 0,
        data: {
          wx_nick_name: userProfile.wx_nick_name,
          wx_avatar_url: userProfile.wx_avatar_url,
          name: userProfile.name,
          contact_number: userProfile.contact_number,
          residence: {
            _id: userProfile.residence._id,
            building: userProfile.residence.building,
            room: userProfile.residence.room
          },
        },
      }
    });
  }

  async approveUserProfile(userDto) {
    const user = new User(userDto);
    if (!user || !user._id || !user.pending || !user.pending.data) {
      throw new Error('Invalid user for approval.', JSON.stringify(user));
    }

    const auditer = this.context.user;
    if (!auditer.role.superAdmin && auditer._id === user._id) {
      throw new BizError('不可以审核自己的出行信息，请联系管理员');
    }

    const pendingData = user.pending.data;
    const pendingResidence = pendingData.residence;
    const certificate = await this.certificateService.findByResidence(pendingResidence)
    if (!certificate) {
      console.error(`Cannot find cert for residence: ${JSON.stringify(pendingResidence)}`);
      throw new Error(`Cannot find cert for residence: ${pendingResidence._id}`);
    }

    certificate.bindTo(user);
    const updates = user.applyPendingData({ command: _ });
    return await this.update(user, updates);
  }

  async rejectUserProfile({ user: user, reason: reason }) {
    if (!user || !user.pending || !user.pending.data || user.pending.status !== 0) {
      throw new Error('Invalid user for approval.', JSON.stringify(user));
    }

    const auditer = this.context.user;
    if (!auditer.role.superAdmin && auditer._id === user._id) {
      throw new BizError('不可以审核自己的出行信息，请联系管理员');
    }

    return await this.update(user, {
      'pending.status': -1,
      'pending.comment': reason,
    });
  }

  async findByCertificate(certificate_id) {
    if (!certificate_id) {
      console.warn('Found empty certificate id.');
      return;
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