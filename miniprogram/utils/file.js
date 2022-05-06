// file.js
const logger = require('./log')

module.exports = {
  upload(localPath, remotePath) {
    return wx.cloud.uploadFile({
      cloudPath: remotePath,
      filePath: localPath
    });
  }
}