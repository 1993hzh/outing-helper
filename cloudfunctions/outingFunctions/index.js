const BuildingService = require('./core/buildingService')
const CertificateService = require('./core/certificateService')
const CheckRecordService = require('./core/checkRecordService')
const ResidenceService = require('./core/residenceService')

const buildingService = new BuildingService();
const certificateService = new CertificateService();
const checkRecordService = new CheckRecordService();
const residenceService = new ResidenceService();


// 云函数入口函数
exports.main = async (event, context) => {
  const service = event.service;
  const method = event.method;
  switch (service) {
    case 'buildingService':
      if (method === 'findByName') {
        return await buildingService.findByName(event.args);
      }
    case 'certificateService':
      if (method === 'findByResidence') {
        return await certificateService.findByResidence(event.args);
      } else if (method === 'createQRcode') {
        return await certificateService.createQRcode(event.args);
      }
    case 'checkRecordService':
      if (method === 'findByCertificate') {
        return await checkRecordService.findByCertificate(event.args);
      }
    case 'residenceService':
      if (method === 'create') {
        return await residenceService.create(...event.args);
      } else if (method === 'certify') {
        return await residenceService.certify(event.args);
      }
  }

  console.error(`Found invalid function call: ${JSON.stringify(event)}, context: ${JSON.stringify(context)}`);
  throw new Error(`Found invalid funtion call: ${service}.${method}`);
};
