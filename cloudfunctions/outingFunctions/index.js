const BuildingService = require('./core/buildingService')
const CertificateService = require('./core/certificateService')
const CheckRecordService = require('./core/checkRecordService')
const ResidenceService = require('./core/residenceService')
const UserService = require('./core/userService')

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  // initialize services
  const buildingService = new BuildingService();
  const certificateService = new CertificateService(context);
  const checkRecordService = new CheckRecordService(context);
  const residenceService = new ResidenceService(context);
  const userService = new UserService(context);
  // API routing
  const service = event.service;
  const method = event.method;
  switch (service) {
    case 'buildingService':
      if (method === 'findByName') {
        return await buildingService.findByName(event.args);
      } else if (method === 'list') {
        return await buildingService.list();
      }
    case 'certificateService':
      if (method === 'findById') {
        return await certificateService.findById(event.args);
      } else if (method === 'findByResidence') {
        return await certificateService.findByResidence(event.args);
      } else if (method === 'createQRcode') {
        return await certificateService.createQRcode(event.args);
      } else if (method === 'checkIn') {
        return await certificateService.checkIn(event.args);
      } else if (method === 'checkOut') {
        return await certificateService.checkOut(event.args);
      } else if (method === 'certify') {
        return await certificateService.certify(event.args);
      }
    case 'checkRecordService':
      if (method === 'findById') {
        return await checkRecordService.findById(event.args);
      } else if (method === 'findByCertificate') {
        return await checkRecordService.findByCertificate(event.args);
      }
    case 'residenceService':
      if (method === 'findById') {
        return await residenceService.findById(event.args);
      } else if (method === 'listByBuilding') {
        return await residenceService.listByBuilding(event.args);
      } else if (method === 'create') {
        return await residenceService.create(event.args);
      }
    case 'userService':
      if (method === 'login') {
        return await userService.login();
      } else if (method === 'findByCertificate') {
        return await userService.findByCertificate(event.args);
      } else if (method === 'updateProfile') {
        return await this.safeRun({
          context: context,
          run: () => userService.updateProfile(event.args)
        });
      }
  }

  console.error(`Found invalid function call: ${JSON.stringify(event)}`);
  return new Error(`Found invalid funtion call: ${service}.${method}`);
};

exports.safeRun = async ({ context, run }) => {
  const wx_open_id = cloud.getWXContext().OPENID;
  const result = await new UserService().findBy({
    criteria: {
      wx_open_id: wx_open_id,
    },
    orderBy: [],
    limit: 1
  });
  const users = result.data;
  if (users.length <= 0) {
    return new Error(`Cannot find user with wx_open_id: ${wx_open_id}`);
  }

  // inject user to context
  context.user = users[0];
  console.log(`Inject user: ${JSON.stringify(context.user)} into context.`);
  // start tx
  const transaction = await db.startTransaction();
  try {
    // inject tx to context
    // context.transaction = transaction;
    // do run
    const result = await run();
    // try commit
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return error;
  }
};