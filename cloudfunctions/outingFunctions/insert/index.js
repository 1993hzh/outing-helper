const cloud = require('wx-server-sdk');
const { nanoid } = require('nanoid')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    let collection = event.collection;
    let record = event.record;
    record._id = nanoid();

    console.log(`Insert record: ${JSON.stringify(record)} into ${collection}.`);
    const result = await db.collection(collection).add({ data: record });
    return {
      success: true,
      data: result
    };
  } catch (e) {
    return {
      success: false,
      errorMessage: e
    };
  }
};
