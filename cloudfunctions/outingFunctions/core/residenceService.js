const BizError = require('../bizError')
const { BaseService, cloud } = require('./baseService')
const BuidingService = require('./buildingService')
const CertificateService = require('./certificateService')

const moment = require('moment')
moment.locale('zh-CN');

const db = cloud.database();
const _ = db.command;

const COLLECTION_RESIDENCE = 'residence';
const buidingService = new BuidingService();

class ResidenceService extends BaseService {

  certificateService = undefined;

  constructor(context) {
    super(COLLECTION_RESIDENCE, context);
    this.certificateService = new CertificateService(context);
  }

  async listByBuilding({ building_id: building_id, status: status = 1 }) {
    if (!building_id) {
      throw new Error(`Invalid building: ${building_id}.`);
    }

    return await this.findBy({
      criteria: {
        building: {
          id: building_id
        },
        status: status,
      },
      orderBy: [
        { prop: 'room', type: 'asc' }
      ],
    });
  }

  async toggle(residence) {
    if (!residence) {
      throw new Error('Residence not found.');
    }

    const user = this.context.user;
    const managedBuildings = user.managed_buildings || [];
    if (!user.role.superAdmin && !managedBuildings.find(e => e.id === residence.building.id)) {
      throw new BizError('只能操作自己管理的楼栋数据');
    }

    const status = 1 - residence.status;
    const certificate = await this.certificateService.findByResidence(residence);
    await this.certificateService.toggle(certificate);
    return await this.update(residence, { status: status });
  }

  // return db record if the residence exists
  async create({ building, room, find = true }) {
    if (!building) {
      throw new Error(`Cannot find building with name: ${buildingName}.`);
    }

    if (!building.id) {
      building = await buidingService.findByName(buildingName);
    }

    const partialResidence = {
      building: building,
      room: room,
      status: 1,
      revision: 0,
    };

    if (find) {
      const exists = await this.findBy({
        criteria: partialResidence,
        orderBy: [],
        limit: 1,
      });
      if (exists && exists.length > 0) {
        console.info(`Return existing Residence: ${JSON.stringify(exists)}`);
        return exists[0];
      }
    }

    console.info(`Inserting Residence: ${JSON.stringify(partialResidence)}`);
    const newResidence = await super.insert(partialResidence);
    await this.certificateService.certify(newResidence);
    return newResidence;
  }

  async batchCreate({ building, rooms }) {
    if (!building || !rooms) {
      throw new Error(`Invalid params: ${building}, ${rooms}.`);
    }

    return rooms.split("；").map(async (room) => {
      return this.create({
        building: building,
        room: room
      });
    });
  }
}

module.exports = ResidenceService;