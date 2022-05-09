const BizError = require('../bizError')
const BaseService = require('./baseService')
const BuidingService = require('./buildingService')

const moment = require('moment')
moment.locale('zh-CN');

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const COLLECTION_RESIDENCE = 'residence';

const buidingService = new BuidingService();

class ResidenceService extends BaseService {

  constructor(context) {
    super(COLLECTION_RESIDENCE, context);
  }

  async listByBuilding(building) {
    if (!building) {
      throw new Error(`Invalid building: ${JSON.stringify(building)}.`);
    }

    return await this.findBy({
      criteria: {
        building: { id: building.id },
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
      status: 0,
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
    return await super.insert(partialResidence);
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