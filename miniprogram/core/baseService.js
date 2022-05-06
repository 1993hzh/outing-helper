import * as logger from '../utils/log';
import Moment from 'moment';
Moment.locale('zh-CN');

const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

class BaseService {

  #collection = undefined;

  constructor(collection) {
    this.#collection = collection;
  }

  findById(_id) {
    return db.collection(this.#collection).doc(_id).get();
  }

  insert(record) {
    record.created_at = new Date();
    record.created_by = {
      id: app.globalData.loginUser._id,
      name: app.globalData.loginUser.name
    };
    return wx.cloud.callFunction({
      name: 'outingFunctions',
      data: {
        type: 'insert',
        collection: this.#collection,
        record: record
      }
    }).then(response => {
      logger.info(`Invoke cloud function insert with response: ${JSON.stringify(response)}`);
      const result = response.result;
      if (result.success) {
        record._id = result.data._id;
        return this.transform(record);
      } else {
        throw new Error(result.errorMessage);
      }
    });
  }

  update(record) {
    record.updated_at = new Date();
    record.updated_by = {
      id: app.globalData.loginUser._id,
      name: app.globalData.loginUser.name
    };

    logger.debug(`Updating: ${JSON.stringify(record)}`);

    const recordId = record._id;
    if (!recordId) {
      throw new Error(`Trying to update invalid record: ${JSON.stringify(record)}.`);
    }

    let json = JSON.stringify(record, (key) => {
      if (key === '_id') return undefined;
    });
    return db.collection(this.#collection)
      .doc(recordId)
      .update({ data: JSON.parse(json) });
  }

  transform(object) {
    return object;
  }
}

export default BaseService;