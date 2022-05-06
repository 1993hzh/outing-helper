import * as logger from '../utils/log';
import BaseService from './baseService';
import BuildingService from './buildingService'
import Certificate from './certificate';
import Moment from 'moment';
Moment.locale('zh-CN');

const COLLECTION_CERTIFICATE = 'certificate';
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

class CertificateService extends BaseService {

  constructor() {
    super(COLLECTION_CERTIFICATE);
  }

  findByResidence(residence) {
    return db
      .collection(COLLECTION_CERTIFICATE)
      .where(_.and([
        {
          status: _.gte(0)
        },
        {
          residence: {
            id: residence._id
          }
        }
      ]))
      .orderBy('created_at', 'desc')
      .get()
      .then((response) => {
        return response.data?.map(e => new Certificate(e));
      });
  }
}

export default CertificateService;