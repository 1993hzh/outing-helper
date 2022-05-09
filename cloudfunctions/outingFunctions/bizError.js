class BizError extends Error {

  constructor(message, options = {}) {
    assert(typeof message === 'string');
    assert(typeof options === 'object');
    assert(options !== null);
    super(message);

    for (const [key, value] of Object.entries(options)) {
      this[key] = value;
    }
  }

  get name() {
    return this.constructor.name;
  }
};

module.exports = BizError;