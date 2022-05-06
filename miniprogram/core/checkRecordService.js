import * as logger from '../utils/log';
import BaseService from './baseService';
import Certificate from './certificate';
import CheckRecord from './checkRecord';
import Moment from 'moment';
Moment.locale('zh-CN');

const COLLECTION_CHECK_RECORD = 'check_record';
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

class CheckRecordService extends BaseService {

  constructor() {
    super(COLLECTION_CHECK_RECORD);
  }

  findByCertificate(ceritificate_id) {
    const thisMonday = Moment().weekday(0);
    return db
      .collection(COLLECTION_CHECK_RECORD)
      .where(_.and([
        {
          status: _.gte(0)
        },
        {
          certificate: {
            id: ceritificate_id
          }
        },
        {
          checked_at: _.gte(thisMonday)
        }
      ]))
      .orderBy('checked_at', 'asc')
      .get()
      .then((response) => {
        return response.data?.map(e => new CheckRecord(e));
      });
  }
}

export default CheckRecordService;