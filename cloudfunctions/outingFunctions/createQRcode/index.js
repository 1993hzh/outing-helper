const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  let certificate = event.certificate;

  try {
    // 生成无数量限制的二维码
    const resp = await cloud.openapi.wxacode.getUnlimited({
      "scene": `id=${certificate._id}`,
      "page": 'pages/check/index',
      "checkPath": true,
      "envVersion": 'release'
    });

    const { buffer } = resp;
    // 将图片上传云存储空间
    const upload = await cloud.uploadFile({
      cloudPath: `QRcode/${certificate.residence.building.name}/${certificate.residence.room}/`,
      fileContent: buffer
    });

    console.log(`Upload QRcode: ${certificate._id} succeed with response: ${JSON.stringify(upload)}`);
    return {
      success: true,
      data: upload.fileID
    }
  } catch (error) {
    console.error(JSON.stringify(error));
    return {
      success: false,
      errorCode: error.errCode,
      errorMessage: error.errMsg
    };
  }
};
