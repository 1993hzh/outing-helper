// biz error
class BizError extends Error {

  constructor(message, options = {}) {
    super(message, options);
  }
};

export default BizError;