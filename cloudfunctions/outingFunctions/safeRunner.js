const BizError = require('./bizError');
const { cloud } = require('./core/baseService')
const UserService = require('./core/userService')
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
    if (!wx_open_id || wx_open_id.trim() === '') {
      throw new BizError('找不到做人的证据');
    }

    const users = await this._userService.findBy({
      criteria: {
        wx_open_id: wx_open_id,
      },
      orderBy: [],
      limit: 1
    });
    if (users.length <= 0) {
      console.error(`Cannot find user with wx_open_id: ${wx_open_id}`);
      throw new BizError('找不到做人的证据');
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

    // if (!transactional) {
      return await invocation();
    // }

    // cannot use where for transaction
    // https://developers.weixin.qq.com/community/develop/doc/0000c49965c2f8f47e9b4d97057000
    // https://developers.weixin.qq.com/community/develop/doc/000826ef818bf0ce5ebcc5a2c5b000
    // const transaction = await db.startTransaction();
    // try {
    //   const result = await invocation();
    //   await transaction.commit();
    //   return result;
    // } catch (error) {
    //   await transaction.rollback();
    // }
  }
}

module.exports = SafeRunner;