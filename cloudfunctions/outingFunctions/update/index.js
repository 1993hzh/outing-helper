const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (event, context) => {
  let transactional = event.transactional;
  let collection = event.collection;
  let replace = event.replace;
  let records = event.records;

  const transaction = transactional ? await db.startTransaction() : null

  try {
    for (let record of records) {
      let recordDbId = record._id;
      if (!recordDbId) {
        throw `No _id found for ${JSON.stringify(record)}`
      } else {
        delete record._id;
      }

      if (replace) {
        db.collection(collection).doc(recordDbId).set({ data: record });
      } else {
        db.collection(collection).doc(recordDbId).update({ data: record });
      }
    }
    // commit tx
    if (transactional) {
      await transaction.commit();
    }
    return {
      success: true
    }
  } catch (e) {
    if (transactional) {
      await transaction.rollback();
    }
    return {
      success: false,
      errorMessage: e
    };
  }
};
