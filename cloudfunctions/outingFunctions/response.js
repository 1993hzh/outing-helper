const BizError = require('./bizError')

class Response {

  static success(data) {
    return {
      success: true,
      data: data,
      // result: {
      //   data: data
      // },
    };
  }

  static fail(error) {
    return {
      success: false,
      isBizError: error instanceof BizError,
      errorMessage: error.message,
    };
  }
};

module.exports = Response;