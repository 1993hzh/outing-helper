import * as logger from './log';
import Toast from '@vant/weapp/toast/toast';
import BizError from './bizError';

Toast.setDefaultOptions({
  zIndex: 999999,
  duration: 2000,
  forbidClick: true,
});

module.exports = {
  send({ message = '正在发送请求...', errorMessage = '服务出错，请联系管理员', request, action, errorHandler }) {
    if (!action || !request) {
      logger.error(`CallFunction found invalid request, request: ${JSON.stringify(request)}, action: ${action}`);
      return;
    }

    Toast.loading(message);
    return wx.cloud.callFunction({
      name: 'outingFunctions',
      data: request
    }).then((resp) => {
      const result = resp.result;
      if (!result.success) {
        throw new BizError(result.errorMessage);
      }

      return result;
    }).then((result) => {
      logger.info(`CallFunction with request: ${JSON.stringify(request)} return result: ${JSON.stringify(result)}`);
      action(result);
      Toast.clear();
    }).catch((err) => {
      if (errorHandler) {
        errorHandler(err);
      }

      if (err instanceof BizError) {
        Toast.fail(err.message);
      } else {
        Toast.fail(errorMessage);
      }

      logger.error(`CallFunction with request: ${JSON.stringify(request)} failed.`, err);
    });
  },
}