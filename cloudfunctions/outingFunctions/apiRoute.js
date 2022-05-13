const SafeRunner = require('./safeRunner')
const BuildingService = require('./core/buildingService')
const CertificateService = require('./core/certificateService')
const CheckRecordService = require('./core/checkRecordService')
const ResidenceService = require('./core/residenceService')
const UserService = require('./core/userService')
const parse = require('./utils/parser')

class ApiRoute {

  event = undefined;
  context = undefined;
  buildingService = undefined;
  certificateService = undefined;
  checkRecordService = undefined;
  residenceService = undefined;
  userService = undefined;
  safeRunner = undefined;

  constructor(event, context) {
    this.event = event;
    this.context = context;
    // initialize services
    this.buildingService = new BuildingService();
    this.certificateService = new CertificateService(context);
    this.checkRecordService = new CheckRecordService(context);
    this.residenceService = new ResidenceService(context);
    this.userService = new UserService(context);
    // safe run
    this.safeRunner = new SafeRunner(context);
  }

  async execute() {
    const service = this.event.service;
    const method = this.event.method;
    switch (service) {
      case 'certificateService':
        return await this.routeCertificateService();
      case 'checkRecordService':
        return await this.routeCheckRecordService();
      case 'buildingService':
        return await this.routeBuildingService();
      case 'residenceService':
        return await this.routeResidenceService();
      case 'userService':
        return await this.routeUserService();
      default:
        throw new Error(`Found invalid funtion call: ${service}.${method}`);
    }
  }

  async routeCertificateService() {
    const service = this.event.service;
    const method = this.event.method;
    const args = this.event.args;
    const certificateService = this.certificateService;
    const safeRunner = this.safeRunner;
    switch (method) {
      case 'findById':
        return await safeRunner.run({
          invocation: () => certificateService.findById(args),
        });
      case 'findByResidence':
        return await safeRunner.run({
          invocation: () => certificateService.findByResidence(args),
        });
      case 'createQRcode':
        return await safeRunner.run({
          invocation: () => certificateService.createQRcode(args),
          roles: ['admin', 'superAdmin'],
          transactional: true,
        });
      case 'certify':
        return await safeRunner.run({
          invocation: () => certificateService.certify(args),
          roles: ['admin', 'superAdmin'],
          transactional: true,
        });
      default:
        throw new Error(`Found invalid funtion call: ${service}.${method}`);
    }
  }

  async routeCheckRecordService() {
    const service = this.event.service;
    const method = this.event.method;
    const args = this.event.args;
    const checkRecordService = this.checkRecordService;
    const safeRunner = this.safeRunner;
    switch (method) {
      case 'findByCertificate':
        return await safeRunner.run({
          invocation: () => checkRecordService.findByCertificate(args),
        });
      case 'findLastOutRecord':
        return await safeRunner.run({
          invocation: () => checkRecordService.findLastOutRecord(args),
          roles: ['checker', 'superAdmin'],
        });
      case 'checkIn':
        return await safeRunner.run({
          invocation: () => checkRecordService.checkIn(args),
          roles: ['checker', 'superAdmin'],
          transactional: true,
        });
      case 'checkOut':
        return await safeRunner.run({
          invocation: () => checkRecordService.checkOut(args),
          roles: ['checker', 'superAdmin'],
          transactional: true,
        });
      default:
        throw new Error(`Found invalid funtion call: ${service}.${method}`);
    }
  }

  async routeBuildingService() {
    const service = this.event.service;
    const method = this.event.method;
    const args = this.event.args;
    const buildingService = this.buildingService;
    const safeRunner = this.safeRunner;
    switch (method) {
      case 'findByName':
        return await buildingService.findByName(args);
      case 'list':
        return await buildingService.list();
      default:
        throw new Error(`Found invalid funtion call: ${service}.${method}`);
    }
  }

  async routeResidenceService() {
    const service = this.event.service;
    const method = this.event.method;
    const args = this.event.args;
    const residenceService = this.residenceService;
    const safeRunner = this.safeRunner;
    switch (method) {
      case 'findById':
        return await residenceService.findById(args);
      case 'listByBuilding':
        return await residenceService.listByBuilding(args);
      case 'toggle':
        return await safeRunner.run({
          invocation: () => residenceService.toggle(args),
          roles: ['admin', 'superAdmin'],
        });
      case 'batchCreate':
        return await safeRunner.run({
          invocation: () => residenceService.batchCreate(args),
          roles: ['admin', 'superAdmin'],
        });
      // case 'built-in':
      //   return await parse(residenceService);
      default:
        throw new Error(`Found invalid funtion call: ${service}.${method}`);
    }
  }

  async routeUserService() {
    const service = this.event.service;
    const method = this.event.method;
    const args = this.event.args;
    const userService = this.userService;
    const safeRunner = this.safeRunner;
    switch (method) {
      case 'login':
        return await userService.login();
      case 'findByCertificate':
        return await userService.findByCertificate(args);
      case 'updateProfile':
        return await safeRunner.run({
          invocation: () => userService.updateProfile(args),
          transactional: true,
        });
      case 'approveUserProfile':
        return await safeRunner.run({
          invocation: () => userService.approveUserProfile(args),
          roles: ['admin', 'superAdmin'],
          transactional: true,
        });
      case 'rejectUserProfile':
        return await safeRunner.run({
          invocation: () => userService.rejectUserProfile(args),
          roles: ['admin', 'superAdmin'],
          transactional: true,
        });
      case 'listPendingUsers':
        return await safeRunner.run({
          invocation: () => userService.listPendingUsers(args),
          roles: ['admin', 'superAdmin'],
        });
      case 'findUsersByCriteria':
        return await safeRunner.run({
          invocation: () => userService.findUsersByCriteria(args),
          roles: ['superAdmin'],
        });
      default:
        throw new Error(`Found invalid funtion call: ${service}.${method}`);
    }
  }
};

module.exports = ApiRoute;