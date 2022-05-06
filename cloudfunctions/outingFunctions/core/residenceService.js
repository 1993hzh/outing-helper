const BaseService = require('./baseService')
const Certificate = require('./certificate')
const BuidingService = require('./buildingService')
const CertificateService = require('./certificateService')

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
const certificateService = new CertificateService();

class ResidenceService extends BaseService {

  constructor(tx) {
    super(COLLECTION_RESIDENCE, tx);
  }

  async find(residence) {
    return db
      .collection(COLLECTION_RESIDENCE)
      .where(_.and([
        {
          building: {
            id: residence.building.id
          }
        },
        {
          room: residence.room
        }
      ]))
      .limit(1)
      .get();
  }

  // return db record if the residence exists
  async create(buildingName, room) {
    const building = await buidingService.findByName(buildingName);
    if (!building) {
      throw new Error(`Cannot find building with name: ${buildingName}.`);
    }

    const residence = {
      building: building,
      room: room,
      status: 0
    };

    return this.find(residence)
      .then((response) => {
        let exists = response.data;
        if (exists && exists.length > 0) {
          console.info(`Return existing Residence: ${JSON.stringify(exists)}`);
          return exists[0];
        }

        console.info(`Inserting Residence: ${JSON.stringify(residence)}`);
        return super.insert(residence);
      });
  }

  async certify(residence) {
    if (!residence || !residence._id) {
      throw new Error(`Invalid residence to certify: ${JSON.stringify(residence)}.`);
    }

    console.info(`Certify Residence: ${JSON.stringify(residence)}`);

    const certificate = new Certificate();
    certificate.residence = {
      id: residence._id,
      building: residence.building,
      room: residence.room
    };

    return certificateService.insert(certificate)
      .then((cert) => {
        console.info(`Successfully certified: ${JSON.stringify(cert)}`);
        return certificateService.createQRcode(cert);
      });
  }
}

module.exports = ResidenceService;