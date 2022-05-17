const BizError = require('../bizError')
const { nanoid } = require('nanoid')
const moment = require('moment')
moment.locale('zh-CN');

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

class BaseService {

  #collection = undefined;
  context = undefined;

  constructor(collection, context) {
    this.#collection = collection;
    this.context = context;
  }

  async findById(_id) {
    const result = await this.db().collection(this.#collection).doc(_id).get();
    const record = result.data;
    return this.transform(record);
  }

  async findBy({ criteria, orderBy, limit }) {
    let query = this.db().collection(this.#collection)
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
      query = query.limit(limit);
    }

    const result = await query.get();
    console.info(`FindBy args: ${JSON.stringify(arguments)} returned: ${JSON.stringify(result)}`);

    const records = result.data;
    return records.map(record => this.transform(record));
  }

  // return created object
  async insert(record) {
    const wxContext = cloud.getWXContext();
    record._id = nanoid();
    record.created_at = new Date();
    record.created_by = wxContext.OPENID;
    record.updated_at = new Date();
    record.updated_by = wxContext.OPENID;

    const result = await this.db().collection(this.#collection).add({ data: record });
    console.info(`Insert record: ${JSON.stringify(record)} with result: ${JSON.stringify(result)}`);
    return this.transform(record);
  }

  // return after updated record if succeed
  async update(record, partial) {
    const record_id = record._id;
    const record_revision = record.revision;
    if (!record_id || record_revision < 0) {
      throw new Error(`Trying to update invalid record: ${JSON.stringify(record)}.`);
    }

    partial.updated_at = new Date();
    partial.updated_by = cloud.getWXContext().OPENID;
    partial.revision = record_revision + 1;

    console.info(`Updating {"record": ${JSON.stringify(record)}, "partial": ${JSON.stringify(partial)}}`);
    const updateResult = await this.db().collection(this.#collection)
      .where({ _id: record_id, revision: record_revision })
      .update({ data: partial });
    if (updateResult.stats.updated <= 0) {
      console.warn(
        `Possible optimistic lock exception: updating record: { id: ${record_id}, revision: ${record_revision} } failed.`
        , JSON.stringify(record), JSON.stringify(updateResult)
      );
      throw new BizError('更新出错，请刷新重试');
    }

    const result = { ...record, ...partial };
    return this.transform(result);
  }

  async delete(record) {
    return await this.update(record, { status: -1 });
  }

  transform(jsonObject) {
    return jsonObject;
  }

  db() {
    if (this.context && this.context.transaction) {
      return this.context.transaction;
    } else {
      return db;
    }
  }
}

module.exports = {BaseService, cloud};