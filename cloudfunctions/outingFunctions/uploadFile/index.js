const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    const { path, content } = event.file;
    // 将图片上传云存储空间
    const upload = await cloud.uploadFile({
      cloudPath: path,
      fileContent: content
    });

    console.log(`Upload: ${path} succeed with response: ${JSON.stringify(upload)}`);
    return {
      success: true,
      data: upload.fileID
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      errorCode: error.errCode,
      errorMessage: errMsg
    };
  }
};
