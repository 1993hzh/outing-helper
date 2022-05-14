// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

const TIME_OUT_STEP = 30;

// 云函数入口函数
exports.main = async (event, context) => {
  let now = new Date().toLocaleString('zh-CN');
  console.log(`-----Start reset outing_count at: ${now}`);

  const result = await db.collection('certificate').where({
    outing_count: _.gt(0),
    status: _.gte(0),
  }).get();

  const certs = result.data;
  certs.forEach((cert, idx) => {
    setTimeout(async () => {
      await reset(cert);
    }, TIME_OUT_STEP * idx);
  });

  now = new Date().toLocaleString('zh-CN');
  console.log(`-----Finish reset outing_count at: ${now}`);
}

async function reset(certificate) {
  console.log(`Begin reset outing_count for: ${certificate._id}`);

  await db.collection('certificate').where({
    _id: certificate._id,
  }).update({
    data: {
      outing_count: 0,
    }
  });

  console.log(`End reset outing_count for: ${certificate._id}`);
}