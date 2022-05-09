class BizError extends Error {

  constructor(message, options = {}) {
    super(message, options);
  }
};

module.exports = BizError;