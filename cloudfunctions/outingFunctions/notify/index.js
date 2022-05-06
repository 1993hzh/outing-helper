const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    let toUser = event.toUser;
    let templateId = event.templateId;
    let data = event.data;

    return await cloud.openapi.subscribeMessage.send({
      "touser": toUser,
      "data": data,
      "templateId": templateId
    });
  } catch (err) {
    return err
  }
}
