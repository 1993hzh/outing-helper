const { nanoid } = require('nanoid')
const moment = require('moment')
moment.locale('zh-CN');

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

class BaseService {

  #collection = undefined;
  #database = undefined;

  constructor(collection, tx) {
    this.#collection = collection;
    this.#database = tx ? tx : db;
  }

  async findById(_id) {
    return this.#database.collection(this.#collection).doc(_id).get()
      .then((response) => {
        let data = response.data;
        return this.transform(data);
      });
  }

  // return created object
  async insert(record) {
    const wxContext = cloud.getWXContext();

    record._id = nanoid();
    record.created_at = new Date();
    record.created_by = wxContext.OPENID;
    record.updated_at = new Date();
    record.updated_by = wxContext.OPENID;
    return this.#database.collection(this.#collection).add({ data: record })
      .then(response => {
        console.info(`Insert record: ${JSON.stringify(record)} with response: ${JSON.stringify(response)}`);
        return this.transform(record);
      });
  }

  // return successfully updated counts
  async update(expected, update) {
    if (!expected._id || expected.revision < 0) {
      throw new Error(`Trying to update invalid record: ${JSON.stringify(expected)}.`);
    }

    const wxContext = cloud.getWXContext();
    update.updated_at = new Date();
    update.updated_by = wxContext.OPENID;
    update.revision = expected.revision + 1;
    console.info(`Updating, expected: ${JSON.stringify(expected)}, update: ${JSON.stringify(update)}`);
    return this.#database.collection(this.#collection)
      .where(expected)
      .update({ data: update })
      .then(response => {
        if (response.stats.updated <= 0) {
          throw new Error(`Update record: ${JSON.stringify(expected)} failed.`);
        }
      });
  }

  transform(jsonObject) {
    return jsonObject;
  }
}

module.exports = BaseService;