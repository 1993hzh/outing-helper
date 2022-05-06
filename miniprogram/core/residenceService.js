import * as logger from '../utils/log';
import BaseService from './baseService';
import BuildingService from './buildingService'
import Certificate from './certificate';
import CertificateService from './certificateService';
import Moment from 'moment';
Moment.locale('zh-CN');

const COLLECTION_RESIDENCE = 'residence';
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const buidingService = new BuildingService();
const certificateService = new CertificateService();

class ResidenceService extends BaseService {

  constructor() {
    super(COLLECTION_RESIDENCE);
  }

  find(residence) {
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
  create(buildingName, room) {
    const building = buidingService.findByName(buildingName);
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
          logger.info(`Return existing Residence: ${JSON.stringify(exists)}`);
          return exists[0];
        }

        logger.info(`Inserting Residence: ${JSON.stringify(residence)}`);
        return super.insert(residence);
      });
  }

  certify(residence) {
    if (!residence || !residence._id) {
      throw new Error(`Invalid residence to certify: ${JSON.stringify(residence)}.`);
    }

    logger.info(`Certify Residence: ${JSON.stringify(residence)}`);

    const certificate = new Certificate();
    certificate.residence = {
      id: residence._id,
      building: residence.building,
      room: residence.room
    };

    return certificateService.insert(certificate)
      .then((cert) => {
        logger.info(`Successfully certified: ${JSON.stringify(cert)}`);
        return cert.createQRcode();
      })
      .then((cert) => {
        certificateService.update({
          _id: cert._id,
          qrcode_url: cert.qrcode_url
        });
      });
  }
}

export default ResidenceService;