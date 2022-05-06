const { nanoid } = require('nanoid')
const moment = require('moment')
moment.locale('zh-CN');

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const wxContext = cloud.getWXContext();
const db = cloud.database();
const _ = db.command;

class BaseService {

  #collection = undefined;

  constructor(collection) {
    this.#collection = collection;
  }

  async findById(_id) {
    return db.collection(this.#collection).doc(_id).get()
      .then((response) => {
        let data = response.data;
        return this.transform(data);
      });
  }

  // return created object
  async insert(record) {
    record._id = nanoid();
    record.created_at = new Date();
    record.created_by = wxContext.OPENID;
    return db.collection(this.#collection).add({ data: record })
      .then(response => {
        console.info(`Insert record: ${JSON.stringify(record)} with response: ${JSON.stringify(response)}`);
        return this.transform(record);
      });
  }

  // return successfully updated counts
  async update(record) {
    record.updated_at = new Date();
    record.updated_by = wxContext.OPENID;

    console.debug(`Updating: ${JSON.stringify(record)}`);

    const recordId = record._id;
    if (!recordId) {
      throw new Error(`Trying to update invalid record: ${JSON.stringify(record)}.`);
    }

    delete record._id;
    return db.collection(this.#collection).doc(recordId).update({ data: record });
  }

  // return successfully updated counts
  async compareUpdate(expected, update) {
    update.updated_at = new Date();
    record.updated_by = wxContext.OPENID;

    console.debug(`CompareUpdating: ${JSON.stringify(update)}`);

    const recordId = update._id;
    if (!recordId) {
      throw new Error(`Trying to update invalid record: ${JSON.stringify(update)}.`);
    }

    delete update._id;
    return db.collection(this.#collection)
      .where(_.and([{ _id: recordId }, expected]))
      .update({ data: update });
  }

  transform(jsonObject) {
    return jsonObject;
  }
}

module.exports = BaseService;