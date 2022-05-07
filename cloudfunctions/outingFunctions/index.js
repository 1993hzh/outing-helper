const BuildingService = require('./core/buildingService')
const CertificateService = require('./core/certificateService')
const CheckRecordService = require('./core/checkRecordService')
const ResidenceService = require('./core/residenceService')
const UserService = require('./core/userService')

const buildingService = new BuildingService();
const certificateService = new CertificateService();
const checkRecordService = new CheckRecordService();
const residenceService = new ResidenceService();
const userService = new UserService();

// 云函数入口函数
exports.main = async (event, context) => {
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
        return await residenceService.create(...event.args);
      } else if (method === 'certify') {
        return await residenceService.certify(event.args);
      }
    case 'userService':
      if (method === 'login') {
        return await userService.login();
      } else if (method === 'create') {
        return await userService.create(event.args);
      } else if (method === 'register') {
        return await userService.register(...event.args);
      } else if (method === 'bindCertificate') {
        return await userService.bindCertificate(event.args);
      } else if (method === 'findByCertificate') {
        return await userService.findByCertificate(event.args);
      }
  }

  console.error(`Found invalid function call: ${JSON.stringify(event)}`);
  throw new Error(`Found invalid funtion call: ${service}.${method}`);
};
