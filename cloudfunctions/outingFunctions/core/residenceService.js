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
        { prop: 'created_at', type: 'asc' }
      ],
    });
  }

  // return db record if the residence exists
  async create({ building, room }) {
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
    };
    const exists = await this.findBy({
      criteria: partialResidence,
      orderBy: [],
      limit: 1,
    });
    if (exists && exists.length > 0) {
      console.info(`Return existing Residence: ${JSON.stringify(exists)}`);
      return exists[0];
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