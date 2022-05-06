const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command

exports.main = async (event, context) => {
  let collection = event.collection
  let criteria = event.criteria ? event.criteria : {}
  let orderBy = event.orderBy

  var query = db
    .collection(collection)
    .where(_.and([
      {
        status: _.gte(0)
      },
      criteria
    ]));
  if (orderBy) {
    orderBy.forEach(e => query = query.orderBy(e.prop, e.type));
  }
  return await query.get();
};
