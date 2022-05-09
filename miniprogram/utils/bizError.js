// biz error
class BizError extends Error {

  errorMessage = undefined;

  constructor(message, options = {}) {
    super('Business Error', options);
    this.errorMessage = message;
  }
};

export default BizError;