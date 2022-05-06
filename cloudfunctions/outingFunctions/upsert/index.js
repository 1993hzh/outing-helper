const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    let collection = event.collection;
    let record = event.record;
    let replace = event.replace;

    let recordDbId = record._id;
    if (!recordDbId) {
      return await db.collection(collection).add({ data: record });
    } else {
      // cannot update `_id`
      delete record._id;
    }
    if (replace) {
      return await db.collection(collection).doc(recordDbId).set({ data: record });
    } else {
      return await db.collection(collection).doc(recordDbId).update({ data: record });
    }
  } catch (e) {
    return {
      success: false,
      errorMessage: e
    };
  }
};
