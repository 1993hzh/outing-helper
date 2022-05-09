const UserService = require('./core/userService')
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

class SafeRunner {

  _context = undefined;
  _userService = undefined;

  constructor(context) {
    this._context = context;
    this._userService = new UserService(context);
  }

  // transaction is not supported yet
  async run({ invocation, roles, transactional }) {
    const wx_open_id = cloud.getWXContext().OPENID;
    const result = await this._userService.findBy({
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
    const user = users[0];
    this._context.user = user;
    console.log(`Inject user: ${JSON.stringify(user)} into context.`);
    if (roles && roles.length > 0) {
      const someRoleMatch = roles.some(e => user.role[e]);
      if (!user || !someRoleMatch) {
        throw new Error(`User: ${user._id} does not have the permission to execute ${invocation}`);
      }
    }

    // start tx
    // const transaction = await db.startTransaction();
    try {
      // inject tx to context
      // this._context.transaction = transaction;
      // do invocation
      const result = await invocation();
      // try commit
      // await transaction.commit();
      return result;
    } catch (error) {
      // await transaction.rollback();
      console.error(error);
      return error;
    }
  }
}

module.exports = SafeRunner;