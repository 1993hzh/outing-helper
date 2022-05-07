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

  async findBy({ criteria, orderBy, limit }) {
    var query = this.#database.collection(this.#collection)
      .where(_.and([
        {
          status: _.gte(0)
        },
        criteria
      ]));
    if (orderBy) {
      orderBy.forEach(e => query = query.orderBy(e.prop, e.type));
    }
    if (limit) {
      query.limit(limit);
    }
    return query.get()
      .then((response) => {
        if (response.data) {
          response.data = response.data.map(e => this.transform(e));
        }
        return response;
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
  async update(record, partial) {
    if (!record._id || record.revision < 0) {
      throw new Error(`Trying to update invalid record: ${JSON.stringify(record)}.`);
    }

    partial.updated_at = new Date();
    partial.updated_by = cloud.getWXContext().OPENID;
    partial.revision = record.revision + 1;
    console.info(`Updating, record: ${JSON.stringify(record)}, update: ${JSON.stringify(partial)}`);
    return this.#database.collection(this.#collection)
      .where({ _id: record._id, revision: record.revision })
      .update({ data: partial })
      .then(response => {
        if (response.stats.updated <= 0) {
          throw new Error(`Update record: ${JSON.stringify(record)} failed.`);
        }

        record.revision++;
        return response;
      });
  }

  async delete(record) {
    return this.update(record, { status: -1 });
  }

  transform(jsonObject) {
    return jsonObject;
  }
}

module.exports = BaseService;