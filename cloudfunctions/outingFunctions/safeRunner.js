const BizError = require('./bizError');
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
    const users = await this._userService.findBy({
      criteria: {
        wx_open_id: wx_open_id,
      },
      orderBy: [],
      limit: 1
    });
    if (users.length <= 0) {
      return new BizError('找不到做人的证据', wx_open_id);
    }
    // inject user to context
    const user = users[0];
    this._context.user = user;
    console.log(`Inject user into context.`, JSON.stringify(user));
    if (roles && roles.length > 0) {
      const someRoleMatch = roles.some(e => user.role[e]);
      if (!user || !someRoleMatch) {
        console.error(`User: ${user._id} does not have the permission to execute ${invocation}`);
        throw new BizError('用户越权操作');
      }
    }

    if (!transactional) {
      return await invocation();
    }

    const transaction = await db.startTransaction();
    try {
      const result = await invocation();
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
    }
  }
}

module.exports = SafeRunner;