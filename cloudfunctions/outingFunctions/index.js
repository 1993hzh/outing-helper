const BuildingService = require('./core/buildingService')
const CertificateService = require('./core/certificateService')
const CheckRecordService = require('./core/checkRecordService')
const ResidenceService = require('./core/residenceService')
const UserService = require('./core/userService')
const SafeRunner = require('./safeRunner')

// 云函数入口函数
exports.main = async (event, context) => {
  // initialize services
  const buildingService = new BuildingService();
  const certificateService = new CertificateService(context);
  const checkRecordService = new CheckRecordService(context);
  const residenceService = new ResidenceService(context);
  const userService = new UserService(context);
  // safe run
  const safeRunner = new SafeRunner(context);
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
        return await safeRunner.run({
          invocation: () => certificateService.findById(event.args),
        });
      } else if (method === 'findByResidence') {
        return await certificateService.findByResidence(event.args);
      } else if (method === 'createQRcode') {
        return await safeRunner.run({
          invocation: () => certificateService.createQRcode(event.args),
          roles: ['admin', 'superAdmin'],
        });
      } else if (method === 'checkIn') {
        return await safeRunner.run({
          invocation: () => certificateService.checkIn(event.args),
          roles: ['checker', 'superAdmin'],
        });
      } else if (method === 'checkOut') {
        return await safeRunner.run({
          invocation: () => certificateService.checkOut(event.args),
          roles: ['checker', 'superAdmin'],
        });
      } else if (method === 'certify') {
        return await safeRunner.run({
          invocation: () => certificateService.certify(event.args),
          roles: ['admin', 'superAdmin'],
        });
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
      } else if (method === 'batchCreate') {
        return await safeRunner.run({
          invocation: () => residenceService.batchCreate(event.args),
          roles: ['admin', 'superAdmin'],
        });
      }
    case 'userService':
      if (method === 'login') {
        return await userService.login();
      } else if (method === 'findByCertificate') {
        return await userService.findByCertificate(event.args);
      } else if (method === 'updateProfile') {
        return await safeRunner.run({
          invocation: () => userService.updateProfile(event.args),
        });
      }
  }

  console.error(`Found invalid function call: ${JSON.stringify(event)}`);
  return new Error(`Found invalid funtion call: ${service}.${method}`);
};
