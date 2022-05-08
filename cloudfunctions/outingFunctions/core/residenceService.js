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

    return this.findBy({
      criteria: {
        building: { id: building.id },
      },
      orderBy: [],
      limit: 1
    });
  }

  // return db record if the residence exists
  async create({ buildingName, room }) {
    const building = await buidingService.findByName(buildingName);
    if (!building) {
      throw new Error(`Cannot find building with name: ${buildingName}.`);
    }

    const partialResidence = {
      building: { id: building.id },
      room: room,
      status: 0,
    };
    return this.findBy({
      criteria: partialResidence,
      orderBy: [],
      limit: 1
    }).then((result) => {
      let exists = result.data;
      if (exists && exists.length > 0) {
        console.info(`Return existing Residence: ${JSON.stringify(exists)}`);
        result.data = exists[0];
        return result;
      }

      console.info(`Inserting Residence: ${JSON.stringify(partialResidence)}`);
      return super.insert(partialResidence);
    });
  }
}

module.exports = ResidenceService;