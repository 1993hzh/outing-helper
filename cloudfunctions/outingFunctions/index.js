const Response = require('./response')
const ApiRoute = require('./apiRoute');
const BizError = require('./bizError');

// 云函数入口函数
exports.main = async (event, context) => {

  try {
    const apiRoute = new ApiRoute(event, context);
    const result = await apiRoute.execute();
    return Response.success(result);
  } catch (error) {
    console.error(error);
    if (error instanceof BizError) {
      return Response.fail(error);
    } else {
      throw error;
    }
  }
};
