const Response = require('./response')
const ApiRoute = require('./apiRoute')

// 云函数入口函数
exports.main = async (event, context) => {

  const apiRoute = new ApiRoute(event, context);
  const result = await apiRoute.execute();
  return Response.success(result);
  // try {
  //   const apiRoute = new ApiRoute(event, context);
  //   const result = await apiRoute.execute();
  //   return Response.success(result);
  // } catch (error) {
  //   console.error(error);
  //   return Response.fail(error);
  // }
};
